from __future__ import annotations
from dataclasses import dataclass
import numpy as np

try:
    from brainflow.board_shim import BoardShim, BrainFlowInputParams
    from brainflow.data_filter import DataFilter
except Exception:  # pragma: no cover
    BoardShim = None
    BrainFlowInputParams = None
    DataFilter = None

@dataclass
class BrainFlowConfig:
    board_id: int = 0  # set per hardware
    serial_port: str | None = None
    ip_address: str | None = None
    ip_port: int | None = None

class BrainFlowReader:
    def __init__(self, cfg: BrainFlowConfig):
        self.cfg = cfg
        self._board = None

    def start(self):
        if BoardShim is None:
            raise RuntimeError("BrainFlow not installed")
        BoardShim.enable_dev_board_logger()
        params = BrainFlowInputParams()
        if self.cfg.serial_port:
            params.serial_port = self.cfg.serial_port
        if self.cfg.ip_address:
            params.ip_address = self.cfg.ip_address
        if self.cfg.ip_port:
            params.ip_port = self.cfg.ip_port
        self._board = BoardShim(self.cfg.board_id, params)
        self._board.prepare_session()
        self._board.start_stream()

    def stop(self):
        if self._board:
            self._board.stop_stream()
            self._board.release_session()
            self._board = None

    def read_window(self, n_samples: int) -> np.ndarray:
        if not self._board:
            return np.empty((0,))
        data = self._board.get_board_data()
        if data.size == 0:
            return np.empty((0,))
        # Return first channel for simplicity (user can map channels later)
        return data[0, -n_samples:]
