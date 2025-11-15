from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

from google import genai

from ..schemas import Game, serialize_dt, utc_now

GEMINI_MODEL = "gemini-2.5-flash"


def _normalize_name(value: str, field: str = "name") -> str:
    """Normalize player name for validation."""
    if value is None or not isinstance(value, str):
        raise ValueError(f"{field} is required.")
    cleaned = re.sub(r"\s+", " ", value).strip()
    if not (2 <= len(cleaned) <= 64):
        raise ValueError(f"{field} must be 2-64 characters.")
    return cleaned


def _generate_id(prefix: str) -> str:
    """Generate a unique ID with prefix."""
    return f"{prefix}_{uuid4().hex[:8]}"


def _clean_prompt(value: str) -> str:
    """Clean and validate prompt input."""
    if value is None or not isinstance(value, str):
        raise ValueError("prompt is required.")
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("prompt cannot be empty.")
    cleaned = re.sub(r"\s+", " ", cleaned)
    if len(cleaned) > 1000:
        raise ValueError("prompt must be 1000 characters or fewer.")
    return cleaned


class ExternalServiceError(Exception):
    """Raised when an external service (e.g., Gemini API) fails."""


class AiService:
    """Service for interacting with Gemini API to generate HTML/CSS/JS from prompts."""

    def __init__(self, game_service, *, api_key: Optional[str] = None) -> None:
        self._game_service = game_service
        self._api_key = api_key
        self._client = genai.Client(api_key=api_key) if api_key else None

    def submit_prompt(self, game_id: str, player_name: str, prompt: str) -> Tuple[Game, str, Dict[str, str]]:
        """Submit a prompt for a game and generate output immediately."""
        game = self._game_service.record_prompt(game_id, player_name, prompt)

        canonical_player = self._resolve_player(game, player_name)
        player_prompt = game.prompts.get(canonical_player, "")
        sections = self._generate_output(player_prompt)
        combined_output = self._combine_sections(sections)

        game, canonical_player = self._game_service.record_player_output(
            game_id,
            canonical_player,
            combined_output,
        )
        return game, canonical_player, sections

    def preview_prompt(self, player_name: str, prompt: str) -> Dict[str, object]:
        """Generate a preview output for a prompt without creating a game."""
        player = _normalize_name(player_name, field="player_name")
        cleaned_prompt = _clean_prompt(prompt)
        sections = self._generate_output(cleaned_prompt)
        return {
            "request_id": _generate_id("ai"),
            "player": player,
            "prompt": cleaned_prompt,
            "context": sections["context"],
            "output_html": sections["html"],
            "output_css": sections["css"],
            "output_js": sections["js"],
            "status": "generated",
            "created_at": serialize_dt(utc_now()),
        }

    def score_game(self, game_id: str, *, outputs: Optional[Dict[str, str]] = None) -> Game:
        """Score a game by comparing player outputs."""
        if outputs:
            for player, output in outputs.items():
                self._game_service.record_player_output(game_id, player, output)

        game = self._game_service.get_game(game_id)
        missing = [player for player in game.players if player not in game.outputs]
        if missing:
            raise ValueError("All player outputs are required before scoring.")

        scores = {
            player: self._score_output(game.outputs[player]) for player in game.players
        }
        winner = max(scores.items(), key=lambda item: item[1])[0] if scores else None
        return self._game_service.complete_game(
            game_id,
            scores=scores,
            winner=winner,
            status="completed",
        )

    @staticmethod
    def _resolve_player(game: Game, player_name: str) -> str:
        """Resolve player name to canonical form."""
        normalized = _normalize_name(player_name, field="player_name")
        for player in game.players:
            if player.lower() == normalized.lower():
                return player
        raise ValueError("Player is not part of this game.")

    def _generate_output(self, prompt: str) -> Dict[str, str]:
        """Generate HTML/CSS/JS output from prompt using Gemini API."""
        if not self._client:
            raise ExternalServiceError("Gemini client is not configured.")

        try:
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=self._build_prompt(prompt),
                config={
                    "temperature": 0.3,
                    "top_p": 0.8,
                    "top_k": 32,
                    "max_output_tokens": 65536,
                },
            )
            raw_text = self._extract_response_text(response)
            sections = self._parse_sections_from_response(raw_text)
            if not sections:
                raise ExternalServiceError("Gemini response missing required sections.")
            return sections
        except (ExternalServiceError, json.JSONDecodeError, AttributeError) as exc:
            raise ExternalServiceError("Gemini response missing required sections.") from exc
        except Exception as exc:  # pragma: no cover - safeguard
            raise ExternalServiceError("Gemini request failed.") from exc

    @staticmethod
    def _combine_sections(sections: Dict[str, str]) -> str:
        """Combine HTML, CSS, and JS sections into a single string."""
        return "\n\n".join(
            [
                sections["html"],
                "<style>",
                sections["css"],
                "</style>",
                "<script>",
                sections["js"],
                "</script>",
            ]
        )

    @staticmethod
    def _build_prompt(prompt: str) -> str:
        """Build the prompt string for Gemini API."""
        instructions = (
            "Respond ONLY with JSON following this schema:\n"
            '{ "context": "User prompt: <prompt>", "html": "<html...>", "css": "...", "js": "..." }\n'
            "Rules:\n"
            "- Do NOT wrap the JSON in markdown fences.\n"
            "- context must be exactly \"User prompt: <prompt>\".\n"
            "- html/css/js must be plain text (no backticks) and must not repeat the prompt text verbatim.\n"
            "- Use semantic HTML, responsive CSS, and vanilla JS only for behaviors explicitly requested.\n"
            "- Do NOT add extra features beyond the desriptions of the prompt."
            ""
        )
        return f"{instructions}\nUser prompt: {prompt}"

    @staticmethod
    def _extract_response_text(response: Any) -> str:
        """Extract text from Gemini API response."""
        text = getattr(response, "text", None)
        if text:
            return text

        candidates = getattr(response, "candidates", []) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            parts = getattr(content, "parts", []) or []
            collected = []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    collected.append(part_text)
            if collected:
                return "\n".join(collected)
        return ""

    @staticmethod
    def _parse_sections_from_response(raw_text: str) -> Optional[Dict[str, str]]:
        """Parse JSON sections from Gemini response text."""
        cleaned = (raw_text or "").strip()
        if not cleaned:
            return None

        cleaned = cleaned.strip("` \n")
        if cleaned.startswith("{"):
            json_text = cleaned
        else:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end == -1:
                return None
            json_text = cleaned[start : end + 1]

        parsed = json.loads(json_text)
        for key in ("context", "html", "css", "js"):
            value = parsed.get(key)
            if not isinstance(value, str):
                return None
            parsed[key] = value.strip()
        return parsed

    @staticmethod
    def _score_output(output: str) -> float:
        """Score an output based on length and vocabulary diversity."""
        unique_words = len(set(re.findall(r"\b\w+\b", output.lower())))
        length_score = min(len(output) * 0.02, 70)
        diversity_score = min(unique_words * 0.5, 30)
        return round(length_score + diversity_score, 2)

