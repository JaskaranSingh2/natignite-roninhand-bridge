# RoninHand HRI Bridge

A minimal, hackathon-friendly pipeline that maps low-bandwidth **human inputs** (EMG/EEG/IMU/VR or simple switches) to **high-level RoninHand gestures** by issuing:

```
POST http://<roninhand_host>:8000/execute
{"gesture":"<name>"}
```

This repo is **simulator-first** but **hardware-ready**: we only speak HTTP to the RoninHand server, the same API used by the physical hand.

## Quickstart

1) Create and activate a virtual env, then install:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev,brainflow]"
pre-commit install || true
```

2) Configure the target RoninHand server (defaults to `http://localhost:8000`):
```bash
cp config/default.yaml config/local.yaml
# edit local.yaml if needed
```

3) Send a gesture:
```bash
rhbridge send --gesture fist
# or
python examples/send_gesture.py --gesture fist
```

4) Run unit tests:
```bash
pytest -q
```

## Repo layout

- `src/rhbridge/bridge/ronin_client.py` — thin HTTP client for `/execute` and other endpoints
- `src/rhbridge/mapper/map.py` — `(mode, intent) -> gesture` logic (configurable via YAML)
- `src/rhbridge/io/brainflow_reader.py` — BrainFlow-based biosignal reader (stub)
- `src/rhbridge/dsp/filters.py` — notch/band-pass helpers for EMG/EEG (stubs)
- `src/rhbridge/intents/emg_trigger.py` — simple RMS+threshold EMG trigger (stub)
- `src/rhbridge/ui/calibrate.py` — minimal calibration CLI (stub)
- `examples/` — runnable demos
- `tests/` — basic integration tests for the bridge

## Notes

- Gesture names must match those supported by the RoninHand server's `gestures.json`.
- For the live demo, we recommend **two-factor**: selection (SSVEP/hand tracking) + confirm (EMG/blink).
- Keep end-to-end latency under ~150 ms for EMG-triggered actions when possible.
