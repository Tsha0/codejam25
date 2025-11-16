from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from .services.auth_service import auth_service
from .services.dashboard_service import dashboard_service


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


def _payload() -> dict:
    return request.get_json(silent=True) or {}


def _get_token_from_header() -> str:
    """Extract JWT token from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def _get_current_user():
    """Get current user from token."""
    token = _get_token_from_header()
    if not token:
        return None
    return auth_service.verify_token(token)


@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    """
    Get user dashboard data (profile + game history).
    
    Headers:
        Authorization: Bearer <token>
    """
    user = _get_current_user()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED
    
    try:
        dashboard_data = dashboard_service.get_user_dashboard(str(user._id))
        return jsonify(dashboard_data), HTTPStatus.OK
    except Exception as e:
        return jsonify({"error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR


@dashboard_bp.route("/user/<user_id>/games", methods=["GET"])
def get_user_games(user_id: str):
    """
    Get user's game history (paginated).
    
    Query params:
        limit: Number of games to return (default 20)
        skip: Number of games to skip (default 0)
    """
    user = _get_current_user()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED
    
    # Users can only view their own game history
    if str(user._id) != user_id:
        return jsonify({"error": "Forbidden"}), HTTPStatus.FORBIDDEN
    
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        
        games = dashboard_service.get_user_games(user_id, limit=limit, skip=skip)
        return jsonify({"games": games}), HTTPStatus.OK
    except Exception as e:
        return jsonify({"error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR


@dashboard_bp.route("/games/create", methods=["POST"])
def create_game():
    """
    Create a new game record.
    
    Request body:
        {
            "player1Id": "user_id_1",
            "player1Username": "username1",
            "player2Id": "user_id_2",
            "player2Username": "username2"
        }
    """
    user = _get_current_user()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED
    
    data = _payload()
    
    try:
        game = dashboard_service.create_game_record(
            player1_id=data.get("player1Id"),
            player1_username=data.get("player1Username"),
            player2_id=data.get("player2Id"),
            player2_username=data.get("player2Username"),
        )
        
        return jsonify({
            "game": game.to_dict(),
            "message": "Game created successfully"
        }), HTTPStatus.CREATED
    except Exception as e:
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST


@dashboard_bp.route("/games/<game_id>/complete", methods=["POST"])
def complete_game(game_id: str):
    """
    Mark game as completed and record results.
    
    Request body:
        {
            "player1Result": "win" | "loss",
            "player2Result": "win" | "loss",
            "duration": 754
        }
    """
    user = _get_current_user()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED
    
    data = _payload()
    
    try:
        game = dashboard_service.complete_game(
            game_id=game_id,
            player1_result=data.get("player1Result"),
            player2_result=data.get("player2Result"),
            duration=data.get("duration"),
        )
        
        return jsonify({
            "game": game.to_dict(),
            "message": "Game completed successfully"
        }), HTTPStatus.OK
    except ValueError as e:
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        return jsonify({"error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR


@dashboard_bp.route("/user/<user_id>/stats", methods=["GET"])
def get_user_stats(user_id: str):
    """
    Get user's game statistics.
    
    Headers:
        Authorization: Bearer <token>
    """
    user = _get_current_user()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED
    
    # Users can only view their own stats
    if str(user._id) != user_id:
        return jsonify({"error": "Forbidden"}), HTTPStatus.FORBIDDEN
    
    try:
        stats = dashboard_service.get_user_stats(user_id)
        return jsonify(stats), HTTPStatus.OK
    except Exception as e:
        return jsonify({"error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

