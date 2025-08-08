from __future__ import annotations
from typing import Dict, Tuple

# Very simple mapping stub. Load from YAML or edit here.
# (mode, intent) -> gesture string
DEFAULT_MAP: Dict[Tuple[str, str], str] = {
    ("manipulation", "select_grasp"): "fist",
    ("manipulation", "release"): "grip1open",
    ("social", "wave"): "handshake",
}

def map_intent(mode: str, intent: str) -> str | None:
    return DEFAULT_MAP.get((mode, intent))
