from __future__ import annotations

from datetime import datetime, timezone
from http import HTTPStatus
from pathlib import Path
from uuid import uuid4

import requests
from flask import Blueprint, jsonify, request

from .events import emit_lobby_event
from .prompts import get_all_prompts
from .services import (
    ConflictError,
    ExternalServiceError,
    NotFoundError,
    ValidationError,
    ai_service,
    game_service,
    lobby_service,
    matchmaking_service,
)


api_bp = Blueprint("api", __name__)


def _payload() -> dict:
    return request.get_json(silent=True) or {}


@api_bp.errorhandler(NotFoundError)
def handle_not_found(error: NotFoundError):
    return jsonify({"error": str(error)}), HTTPStatus.NOT_FOUND


@api_bp.errorhandler(ConflictError)
def handle_conflict(error: ConflictError):
    return jsonify({"error": str(error)}), HTTPStatus.CONFLICT


@api_bp.errorhandler(ValidationError)
def handle_validation(error: ValidationError):
    return jsonify({"error": str(error)}), HTTPStatus.BAD_REQUEST


@api_bp.errorhandler(ExternalServiceError)
def handle_external_service(error: ExternalServiceError):
    return jsonify({"error": str(error)}), HTTPStatus.SERVICE_UNAVAILABLE


@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "creative-battles-backend",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


# Lobby endpoints ---------------------------------------------------------


@api_bp.route("/lobby/create", methods=["POST"])
def create_lobby():
    data = _payload()
    lobby = lobby_service.create_lobby(data.get("host_name"))
    return jsonify({"lobby": lobby.to_dict()}), HTTPStatus.CREATED


@api_bp.route("/lobby/join", methods=["POST"])
def join_lobby():
    data = _payload()
    lobby_id = data.get("lobby_id")
    player = data.get("player_name")
    lobby = lobby_service.join_lobby(lobby_id, player)
    return jsonify({"lobby": lobby.to_dict()})


@api_bp.route("/lobby/leave", methods=["POST"])
def leave_lobby():
    data = _payload()
    lobby_id = data.get("lobby_id")
    player = data.get("player_name")
    lobby, deleted = lobby_service.leave_lobby(lobby_id, player)
    return jsonify({"lobby": lobby.to_dict() if lobby else None, "deleted": deleted})


@api_bp.route("/lobby/<lobby_id>", methods=["GET"])
def get_lobby(lobby_id: str):
    lobby = lobby_service.get_lobby(lobby_id)
    return jsonify({"lobby": lobby.to_dict()})


@api_bp.route("/lobby/ready", methods=["POST"])
def toggle_ready():
    data = _payload()
    lobby_id = data.get("lobby_id")
    player = data.get("player_name")
    lobby = lobby_service.toggle_ready(lobby_id, player)
    return jsonify({"lobby": lobby.to_dict()})


@api_bp.route("/lobby/<lobby_id>/start", methods=["POST"])
def start_lobby(lobby_id: str):
    data = _payload()
    host = data.get("host_name")
    assigned_image = data.get("assigned_image")

    lobby = lobby_service.start_lobby(lobby_id, host)
    emit_lobby_event(lobby_id, "game_starting", {"lobby": lobby.to_dict()})

    game = game_service.create_game(lobby.players, assigned_image=assigned_image, source="lobby")
    lobby = lobby_service.mark_started(lobby_id)

    emit_lobby_event(lobby_id, "game_started", {"lobby": lobby.to_dict(), "game": game.to_dict()})
    return jsonify({"lobby": lobby.to_dict(), "game": game.to_dict()})


# Matchmaking endpoints ---------------------------------------------------


@api_bp.route("/matchmaking/join", methods=["POST"])
def matchmaking_join():
    data = _payload()
    result = matchmaking_service.join_queue(data.get("player_name"))
    if "game" in result:
        result["game"] = result["game"].to_dict()
    return jsonify(result), (HTTPStatus.CREATED if result.get("status") == "matched" else HTTPStatus.OK)


@api_bp.route("/matchmaking/cancel", methods=["POST"])
def matchmaking_cancel():
    data = _payload()
    result = matchmaking_service.cancel(data.get("player_name"))
    return jsonify(result)


# Game endpoints ----------------------------------------------------------


@api_bp.route("/game/create", methods=["POST"])
def game_create():
    data = _payload()
    players = data.get("players") or []
    assigned_image = data.get("assigned_image")
    game = game_service.create_game(players, assigned_image=assigned_image, source="manual")
    return jsonify({"game": game.to_dict()}), HTTPStatus.CREATED


@api_bp.route("/game/<game_id>", methods=["GET"])
def game_detail(game_id: str):
    game = game_service.get_game(game_id)
    return jsonify({"game": game.to_dict()})


@api_bp.route("/game/<game_id>/prompt", methods=["POST"])
def submit_prompt(game_id: str):
    data = _payload()
    game, canonical_player, sections = ai_service.submit_prompt(
        game_id, data.get("player_name"), data.get("prompt")
    )
    
    # Check if both players have outputs, and if so, score the game
    if len(game.outputs) >= len(game.players):
        try:
            game = ai_service.score_game(game.id)
            status_code = HTTPStatus.OK
        except ValueError:
            # Not all outputs ready yet, return current state
            status_code = HTTPStatus.ACCEPTED
    else:
        status_code = HTTPStatus.ACCEPTED
    
    return jsonify({"game": game.to_dict(), "status": game.status}), status_code


@api_bp.route("/game/<game_id>/complete", methods=["POST"])
def complete_game(game_id: str):
    data = _payload()
    game = game_service.complete_game(
        game_id,
        outputs=data.get("outputs"),
        scores=data.get("scores"),
        winner=data.get("winner"),
        status=data.get("status", "completed"),
    )
    return jsonify({"game": game.to_dict()})


# AI endpoints ------------------------------------------------------------


@api_bp.route("/ai/generate", methods=["POST"])
def ai_generate():
    data = _payload()
    game, canonical_player, sections = ai_service.submit_prompt(
        data.get("game_id"), data.get("player_name"), data.get("prompt")
    )
    
    # Check if both players have outputs, and if so, score the game
    if len(game.outputs) >= len(game.players):
        try:
            game = ai_service.score_game(game.id)
            status_code = HTTPStatus.OK
        except ValueError:
            # Not all outputs ready yet, return current state
            status_code = HTTPStatus.ACCEPTED
    else:
        status_code = HTTPStatus.ACCEPTED
    
    response = {"game": game.to_dict(), "status": game.status}
    if game.status != "completed":
        response["message"] = "Awaiting second output before scoring."
    return jsonify(response), status_code


@api_bp.route("/ai/submit", methods=["POST"])
def ai_submit():
    """Submit a player's final image submission for scoring."""
    data = _payload()
    game_id = data.get("game_id")
    player_name = data.get("player_name")
    image_url = data.get("image_url") or data.get("image")  # Support both field names
    
    if not image_url:
        return jsonify({"error": "image_url or image is required."}), HTTPStatus.BAD_REQUEST
    
    if not game_id:
        return jsonify({"error": "game_id is required."}), HTTPStatus.BAD_REQUEST
    
    if not player_name:
        return jsonify({"error": "player_name is required."}), HTTPStatus.BAD_REQUEST
    
    # Create submissions directory if it doesn't exist
    submissions_dir = Path("submissions")
    submissions_dir.mkdir(exist_ok=True)
    
    # Download and save image
    try:
        # Generate unique filename
        file_ext = Path(image_url).suffix or ".png"
        if not file_ext.startswith("."):
            file_ext = f".{file_ext}"
        filename = f"{game_id}_{player_name}_{uuid4().hex[:8]}{file_ext}"
        file_path = submissions_dir / filename
        
        # Download image from URL
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Save to local file
        with open(file_path, 'wb') as f:
            f.write(response.content)
        
        local_path = str(file_path.absolute())
        
    except Exception as exc:
        return jsonify({"error": f"Failed to download/save image: {str(exc)}"}), HTTPStatus.BAD_REQUEST
    
    # Record the submission
    try:
        game, canonical_player = game_service.record_submission(game_id, player_name, local_path)
    except NotFoundError as e:
        return jsonify({"error": str(e)}), HTTPStatus.NOT_FOUND
    except ValidationError as e:
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST
    
    # Check if both players have submitted, and if so, score the game
    if len(game.submissions) >= len(game.players):
        try:
            game = ai_service.score_submissions(game.id)
            status_code = HTTPStatus.OK
        except ValueError as e:
            # Not all submissions ready yet, return current state
            status_code = HTTPStatus.ACCEPTED
        except ExternalServiceError as e:
            return jsonify({"error": str(e)}), HTTPStatus.SERVICE_UNAVAILABLE
    else:
        status_code = HTTPStatus.ACCEPTED
    
    response = {"game": game.to_dict(), "status": game.status}
    if game.status != "completed":
        response["message"] = "Awaiting second submission before scoring."
    return jsonify(response), status_code


@api_bp.route("/ai/modify", methods=["POST"])
def ai_modify():
    """Modify existing HTML/CSS/JS code based on a new prompt."""
    data = _payload()
    prompt = data.get("prompt")
    html = data.get("html", "")
    css = data.get("css", "")
    js = data.get("js", "")
    
    if not prompt:
        return jsonify({"error": "prompt is required."}), HTTPStatus.BAD_REQUEST
    
    try:
        sections = ai_service.modify_code(prompt, html, css, js)
        return jsonify({
            "html": sections.get("html", ""),
            "css": sections.get("css", ""),
            "js": sections.get("js", ""),
            "context": sections.get("context", ""),
        }), HTTPStatus.OK
    except ExternalServiceError as e:
        return jsonify({"error": str(e)}), HTTPStatus.SERVICE_UNAVAILABLE
    except ValidationError as e:
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST




# Prompt endpoints --------------------------------------------------------


@api_bp.route("/prompts", methods=["GET"])
def list_prompts():
    prompts = get_all_prompts()
    return jsonify({
        "prompts": [p.to_dict() for p in prompts],
        "count": len(prompts)
    })