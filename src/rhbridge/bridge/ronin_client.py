from __future__ import annotations
import requests
from dataclasses import dataclass

@dataclass
class RoninClient:
    base_url: str = "http://localhost:8000"
    timeout_s: float = 2.0

    def execute(self, gesture: str, thumb_clearance: bool = False) -> bool:
        """POST /execute {"gesture": <name>, "thumb_clearance": bool}"""
        try:
            url = f"{self.base_url}/execute"
            payload = {"gesture": gesture, "thumb_clearance": thumb_clearance}
            r = requests.post(url, json=payload, timeout=self.timeout_s)
            return r.ok
        except Exception:
            return False

    def gestures(self) -> dict | None:
        """GET /gestures (if supported by server)"""
        try:
            r = requests.get(f"{self.base_url}/gestures", timeout=self.timeout_s)
            if r.ok:
                return r.json()
        except Exception:
            pass
        return None
