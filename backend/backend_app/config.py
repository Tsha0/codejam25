from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Runtime configuration loaded from environment variables."""

    app_name: str
    environment: str
    debug: bool
    allowed_origins: list[str]

    @staticmethod
    def from_env() -> "Settings":
        environment = (
            os.getenv("FLASK_ENV")
            or os.getenv("ENVIRONMENT")
            or os.getenv("APP_ENV")
            or "development"
        ).lower()

        debug_flag = os.getenv("FLASK_DEBUG")
        debug = debug_flag == "1" if debug_flag is not None else environment != "production"

        raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
        parsed_origins = [
            origin.strip()
            for origin in raw_origins.split(",")
            if origin.strip()
        ]

        return Settings(
            app_name=os.getenv("APP_NAME", "CodeJam Backend"),
            environment=environment,
            debug=debug,
            allowed_origins=parsed_origins or ["*"],
        )

