from __future__ import annotations
import numpy as np
from dataclasses import dataclass

@dataclass
class EMGTriggerConfig:
    window_ms: int = 100
    threshold: float = 0.15  # normalized RMS
    refractory_ms: int = 300

class EMGTrigger:
    def __init__(self, cfg: EMGTriggerConfig):
        self.cfg = cfg
        self._last_fire_ts = 0.0

    def process(self, samples: np.ndarray, fs: float, now_s: float) -> bool:
        """Return True if RMS exceeds threshold and refractory elapsed."""
        if samples.size == 0:
            return False
        # Normalize and compute RMS
        x = samples.astype(float)
        x = x - np.mean(x)
        rms = np.sqrt(np.mean(x * x))
        if rms <= self.cfg.threshold:
            return False
        if (now_s - self._last_fire_ts) * 1000.0 < self.cfg.refractory_ms:
            return False
        self._last_fire_ts = now_s
        return True
