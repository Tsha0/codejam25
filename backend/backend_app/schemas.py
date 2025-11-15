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
    scores: Dict[str, float] = field(default_factory=dict)
    winner: Optional[str] = None
    status: str = "pending"
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)
    source: str = "manual"

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "players": self.players,
            "assigned_image": self.assigned_image,
            "prompts": self.prompts,
            "outputs": self.outputs,
            "scores": self.scores,
            "winner": self.winner,
            "status": self.status,
            "source": self.source,
            "created_at": serialize_dt(self.created_at),
            "updated_at": serialize_dt(self.updated_at),
        }

    def needs_generation(self) -> bool:
        return self.status not in {"processing", "completed"} and len(self.prompts) >= len(self.players)

