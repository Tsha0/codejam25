from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

from google import genai
from google.genai import types

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
            sections=sections,  # Store sections separately
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

    def score_submissions(self, game_id: str) -> Game:
        """Score a game by comparing player submissions with images and prompts.
        
        Uses Gemini API to evaluate submissions based on:
        - Visual Design and Aesthetics (20 points)
        - Adherence to requirement (20 points)
        - Creativity and Innovation (20 points)
        - Prompt Clarity (20 points)
        - Prompt Formulation (20 points)
        
        Args:
            game_id: The game ID
            
        Returns:
            The completed game with scores and feedback
            
        Raises:
            ValueError: If not all submissions are available
            ExternalServiceError: If Gemini API fails
        """
        game = self._game_service.get_game(game_id)
        
        # Check all players have submitted
        missing = [player for player in game.players if player not in game.submissions]
        if missing:
            raise ValueError("All player submissions are required before scoring.")
        
        # Check all players have prompts
        missing_prompts = [player for player in game.players if player not in game.prompts]
        if missing_prompts:
            raise ValueError("All player prompts are required before scoring.")
        
        if not self._client:
            raise ExternalServiceError("Gemini client is not configured.")
        
        # Load images
        player1, player2 = game.players[0], game.players[1]
        image1_path = game.submissions[player1]
        image2_path = game.submissions[player2]
        
        # Read images
        try:
            with open(image1_path, 'rb') as f:
                image1_bytes = f.read()
            with open(image2_path, 'rb') as f:
                image2_bytes = f.read()
        except Exception as exc:
            raise ExternalServiceError(f"Failed to read submission images: {str(exc)}") from exc
        
        # Determine MIME type from file extension
        def get_mime_type(path: str) -> str:
            ext = Path(path).suffix.lower()
            mime_types = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.heic': 'image/heic',
                '.heif': 'image/heif',
            }
            return mime_types.get(ext, 'image/jpeg')
        
        mime1 = get_mime_type(image1_path)
        mime2 = get_mime_type(image2_path)
        
        # Create image parts
        image1_part = types.Part.from_bytes(data=image1_bytes, mime_type=mime1)
        image2_part = types.Part.from_bytes(data=image2_bytes, mime_type=mime2)
        
        # Build scoring prompt
        requirement = game.assigned_image or "the challenge requirements"
        prompt1 = game.prompts[player1]
        prompt2 = game.prompts[player2]
        
        scoring_prompt = f"""You are judging a creative coding competition. Two players have submitted their work based on the requirement: "{requirement}".

Player 1 ({player1}) prompt: "{prompt1}"
Player 2 ({player2}) prompt: "{prompt2}"

Evaluate both submissions based on these 5 criteria (20 points each, total 100 points):

1. Visual Design and Aesthetics (20 points)
2. Adherence to requirement (20 points)
3. Creativity and Innovation (20 points)
4. Prompt Clarity (20 points)
5. Prompt Formulation (20 points)

Respond ONLY with valid JSON in this exact format:
{{
  "player1": {{
    "visual_design": <number 0-20>,
    "adherence": <number 0-20>,
    "creativity": <number 0-20>,
    "prompt_clarity": <number 0-20>,
    "prompt_formulation": <number 0-20>,
    "feedback": {{
      "visual_design": "<feedback text>",
      "adherence": "<feedback text>",
      "creativity": "<feedback text>",
      "prompt_clarity": "<feedback text>",
      "prompt_formulation": "<feedback text>"
    }}
  }},
  "player2": {{
    "visual_design": <number 0-20>,
    "adherence": <number 0-20>,
    "creativity": <number 0-20>,
    "prompt_clarity": <number 0-20>,
    "prompt_formulation": <number 0-20>,
    "feedback": {{
      "visual_design": "<feedback text>",
      "adherence": "<feedback text>",
      "creativity": "<feedback text>",
      "prompt_clarity": "<feedback text>",
      "prompt_formulation": "<feedback text>"
    }}
  }}
}}

Do NOT wrap the JSON in markdown fences. Return only the JSON object."""
        
        try:
            # Call Gemini API with both images
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    scoring_prompt,
                    image1_part,
                    image2_part,
                ],
                config={
                    "temperature": 0.3,
                    "top_p": 0.8,
                    "top_k": 32,
                    "max_output_tokens": 8192,
                    "response_mime_type": "application/json",
                },
            )
            
            raw_text = self._extract_response_text(response)
            scores_data = self._parse_json_response(raw_text)
            
            # The response uses "player1" and "player2" keys, map to actual player names
            p1_key = "player1"
            p2_key = "player2"
            
            if p1_key not in scores_data or p2_key not in scores_data:
                raise ExternalServiceError("Gemini response missing required scoring data.")
            
            # Extract category scores and feedback
            p1_data = scores_data[p1_key]
            p2_data = scores_data[p2_key]
            
            # Extract individual category scores
            category_scores = {
                player1: {
                    "visual_design": float(p1_data.get("visual_design", 0)),
                    "adherence": float(p1_data.get("adherence", 0)),
                    "creativity": float(p1_data.get("creativity", 0)),
                    "prompt_clarity": float(p1_data.get("prompt_clarity", 0)),
                    "prompt_formulation": float(p1_data.get("prompt_formulation", 0)),
                },
                player2: {
                    "visual_design": float(p2_data.get("visual_design", 0)),
                    "adherence": float(p2_data.get("adherence", 0)),
                    "creativity": float(p2_data.get("creativity", 0)),
                    "prompt_clarity": float(p2_data.get("prompt_clarity", 0)),
                    "prompt_formulation": float(p2_data.get("prompt_formulation", 0)),
                },
            }
            
            # Calculate total scores as sum of all categories
            scores = {
                player1: sum(category_scores[player1].values()),
                player2: sum(category_scores[player2].values()),
            }
            
            feedback = {
                player1: {
                    "visual_design": p1_data.get("feedback", {}).get("visual_design", ""),
                    "adherence": p1_data.get("feedback", {}).get("adherence", ""),
                    "creativity": p1_data.get("feedback", {}).get("creativity", ""),
                    "prompt_clarity": p1_data.get("feedback", {}).get("prompt_clarity", ""),
                    "prompt_formulation": p1_data.get("feedback", {}).get("prompt_formulation", ""),
                },
                player2: {
                    "visual_design": p2_data.get("feedback", {}).get("visual_design", ""),
                    "adherence": p2_data.get("feedback", {}).get("adherence", ""),
                    "creativity": p2_data.get("feedback", {}).get("creativity", ""),
                    "prompt_clarity": p2_data.get("feedback", {}).get("prompt_clarity", ""),
                    "prompt_formulation": p2_data.get("feedback", {}).get("prompt_formulation", ""),
                },
            }
            
            # Determine winner based on total score
            winner = max(scores.items(), key=lambda item: item[1])[0] if scores else None
            
            # Update game with scores, category scores, and feedback
            game.scores = scores
            game.category_scores = category_scores
            game.feedback = feedback
            game.winner = winner
            
            return self._game_service.complete_game(
                game_id,
                scores=scores,
                category_scores=category_scores,
                feedback=feedback,
                winner=winner,
                status="completed",
            )
            
        except (ExternalServiceError, json.JSONDecodeError, AttributeError, KeyError) as exc:
            raise ExternalServiceError("Gemini scoring failed.") from exc
        except Exception as exc:
            raise ExternalServiceError("Gemini request failed.") from exc

    @staticmethod
    def _parse_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON from Gemini response text."""
        cleaned = (raw_text or "").strip()
        if not cleaned:
            return None
        
        # Remove markdown fences if present
        cleaned = cleaned.strip("` \n")
        if cleaned.startswith("{"):
            json_text = cleaned
        else:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end == -1:
                return None
            json_text = cleaned[start : end + 1]
        
        return json.loads(json_text)

