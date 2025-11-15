from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def serialize_dt(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.astimezone(timezone.utc).isoformat()


@dataclass
class Lobby:
    id: str
    host: str
    players: List[str]
    ready_state: Dict[str, bool]
    status: str
    created_at: datetime
    updated_at: datetime

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "host": self.host,
            "players": self.players,
            "ready_state": self.ready_state,
            "status": self.status,
            "created_at": serialize_dt(self.created_at),
            "updated_at": serialize_dt(self.updated_at),
        }

    @property
    def is_full(self) -> bool:
        return len(self.players) >= 2

    @property
    def everyone_ready(self) -> bool:
        return self.is_full and all(self.ready_state.get(player, False) for player in self.players)


@dataclass
class Game:
    id: str
    players: List[str]
    assigned_image: Optional[str]
    prompts: Dict[str, str] = field(default_factory=dict)
    outputs: Dict[str, str] = field(default_factory=dict)
    output_sections: Dict[str, Dict[str, str]] = field(default_factory=dict)  # Player -> {html, css, js}
    submissions: Dict[str, str] = field(default_factory=dict)  # Player -> local image path
    scores: Dict[str, float] = field(default_factory=dict)  # Player -> total score
    category_scores: Dict[str, Dict[str, float]] = field(default_factory=dict)  # Player -> {category: score}
    feedback: Dict[str, Dict[str, str]] = field(default_factory=dict)  # Player -> {category: feedback}
    winner: Optional[str] = None
    status: str = "pending"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    source: str = "manual"

    def to_dict(self) -> Dict[str, object]:
        # Build outputs with separate HTML, CSS, JS sections
        formatted_outputs: Dict[str, Dict[str, str]] = {}
        for player in self.players:
            if player in self.output_sections:
                # Use stored sections if available
                formatted_outputs[player] = {
                    "html": self.output_sections[player].get("html", ""),
                    "css": self.output_sections[player].get("css", ""),
                    "js": self.output_sections[player].get("js", ""),
                }
            elif player in self.outputs:
                # Fallback: parse combined output (for backward compatibility)
                combined = self.outputs[player]
                formatted_outputs[player] = self._parse_combined_output(combined)
            else:
                formatted_outputs[player] = {"html": "", "css": "", "js": ""}
        
        return {
            "id": self.id,
            "players": self.players,
            "assigned_image": self.assigned_image,
            "prompts": self.prompts,
            "outputs": formatted_outputs,
            "submissions": self.submissions,
            "scores": self.scores,
            "category_scores": self.category_scores,
            "feedback": self.feedback,
            "winner": self.winner,
            "status": self.status,
            "source": self.source,
            "created_at": serialize_dt(self.created_at),
            "updated_at": serialize_dt(self.updated_at),
        }
    
    @staticmethod
    def _parse_combined_output(combined: str) -> Dict[str, str]:
        """Parse combined HTML/CSS/JS output into separate sections."""
        html = ""
        css = ""
        js = ""
        
        # Extract CSS (between <style> tags)
        style_start = combined.find("<style>")
        style_end = combined.find("</style>")
        if style_start != -1 and style_end != -1:
            css = combined[style_start + 7:style_end].strip()
            html = combined[:style_start].strip()
            remaining = combined[style_end + 8:].strip()
        else:
            remaining = combined
        
        # Extract JS (between <script> tags)
        script_start = remaining.find("<script>")
        script_end = remaining.find("</script>")
        if script_start != -1 and script_end != -1:
            js = remaining[script_start + 8:script_end].strip()
            if not html:  # If we didn't extract HTML yet
                html = remaining[:script_start].strip()
        elif not html:
            html = remaining
        
        return {"html": html, "css": css, "js": js}

    def needs_generation(self) -> bool:
        return self.status not in {"processing", "completed"} and len(self.prompts) >= len(self.players)

