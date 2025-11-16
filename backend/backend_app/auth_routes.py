from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from .services.auth_service import auth_service
from .services.dashboard_service import dashboard_service


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


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


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user.
    
    Request body:
        {
            "email": "user@example.com",
            "password": "password123",
            "name": "John Doe",
            "username": "johndoe" (optional)
        }
    """
    data = _payload()
    
    try:
        user, token = auth_service.signup(
            email=data.get("email"),
            password=data.get("password"),
            name=data.get("name"),
            username=data.get("username"),
        )
        
        return jsonify({
            "user": user.to_dict(),
            "token": token,
            "message": "User created successfully"
        }), HTTPStatus.CREATED
        
    except ValueError as e:
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        return jsonify({"error": "An error occurred during signup"}), HTTPStatus.INTERNAL_SERVER_ERROR


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login user.
    
    Request body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    """
    data = _payload()
    
    try:
        user, token = auth_service.login(
            email=data.get("email"),
            password=data.get("password"),
        )
        
        return jsonify({
            "user": user.to_dict(),
            "token": token,
            "message": "Login successful"
        }), HTTPStatus.OK
        
    except ValueError as e:
        return jsonify({"error": str(e)}), HTTPStatus.UNAUTHORIZED
    except Exception as e:
        return jsonify({"error": "An error occurred during login"}), HTTPStatus.INTERNAL_SERVER_ERROR


@auth_bp.route("/verify", methods=["GET"])
def verify():
    """
    Verify JWT token and return user info.
    
    Headers:
        Authorization: Bearer <token>
    """
    token = _get_token_from_header()
    
    if not token:
        return jsonify({"error": "No token provided"}), HTTPStatus.UNAUTHORIZED
    
    user = auth_service.verify_token(token)
    
    if not user:
        return jsonify({"error": "Invalid or expired token"}), HTTPStatus.UNAUTHORIZED
    
    return jsonify({
        "user": user.to_dict(),
        "valid": True
    }), HTTPStatus.OK


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """
    Get current user's profile.
    
    Headers:
        Authorization: Bearer <token>
    """
    token = _get_token_from_header()
    
    if not token:
        return jsonify({"error": "No token provided"}), HTTPStatus.UNAUTHORIZED
    
    user = auth_service.verify_token(token)
    
    if not user:
        return jsonify({"error": "Invalid or expired token"}), HTTPStatus.UNAUTHORIZED
    
    # Get user stats
    try:
        stats = dashboard_service.get_user_stats(str(user._id))
    except Exception:
        stats = None
    
    response = {
        "user": user.to_dict(),
    }
    
    if stats:
        response["stats"] = stats
    
    return jsonify(response), HTTPStatus.OK


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Logout user (client-side token removal).
    
    Note: Since we're using JWT, logout is primarily handled client-side.
    This endpoint is provided for consistency but doesn't do much server-side.
    """
    return jsonify({"message": "Logout successful"}), HTTPStatus.OK

