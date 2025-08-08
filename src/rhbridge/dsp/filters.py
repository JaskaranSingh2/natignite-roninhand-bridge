from __future__ import annotations
import numpy as np
from scipy.signal import iirnotch, butter, filtfilt

def notch(x: np.ndarray, fs: float, freq: float = 60.0, q: float = 30.0) -> np.ndarray:
    b, a = iirnotch(w0=freq/(fs/2.0), Q=q)
    return filtfilt(b, a, x)

def bandpass(x: np.ndarray, fs: float, low: float, high: float, order: int = 4) -> np.ndarray:
    b, a = butter(order, [low/(fs/2.0), high/(fs/2.0)], btype="band")
    return filtfilt(b, a, x)
