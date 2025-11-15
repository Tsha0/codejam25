from __future__ import annotations

from datetime import datetime, timezone
from http import HTTPStatus

from flask import Blueprint, jsonify, request

from .events import emit_lobby_event
from .services import (
    ConflictError,
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
    game = ai_service.submit_prompt(game_id, data.get("player_name"), data.get("prompt"))
    status_code = HTTPStatus.OK if game.status != "processing" else HTTPStatus.ACCEPTED
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
    game = ai_service.submit_prompt(data.get("game_id"), data.get("player_name"), data.get("prompt"))
    status_code = HTTPStatus.OK if game.status == "completed" else HTTPStatus.ACCEPTED
    response = {"game": game.to_dict(), "status": game.status}
    if game.status != "completed":
        response["message"] = "Awaiting second prompt before processing."
    return jsonify(response), status_code


@api_bp.route("/ai/internal/resolve", methods=["POST"])
def ai_resolve():
    data = _payload()
    game = ai_service.process_game(data.get("game_id"))
    return jsonify({"game": game.to_dict()})

