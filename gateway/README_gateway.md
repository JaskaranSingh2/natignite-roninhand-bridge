Gateway (FastAPI) for UI overlay

Overview
- Provides UI-friendly endpoints that merge base JSON (read-only) with overlay JSON (writable):
  - Base: signals.json, mapping.json (do not modify)
  - Overlay: signals.local.json, mapping.local.json (written atomically)
- Enforces unique bit indexes per signal on writes.
- CORS enabled for http://localhost:3000.

Endpoints
- GET  /ui/signals                  -> { signals: [{ name, actions: [{name, bit}] }] }
- POST /ui/signals                  -> { created: true }
- DELETE /ui/signals/{name}         -> { deleted: true }
- GET  /ui/signals/{name}           -> { name, actions }
- PUT  /ui/signals/{name}/actions   -> { updated: true }
- GET  /ui/mapping                  -> { mapping: { [signalName]: [{name, bit}] } }
- PUT  /ui/mapping                  -> { updated: true }

Run locally
1) Create and activate a virtualenv (recommended)
2) Install deps:
   pip install -r gateway/requirements.txt
3) Start server:
   uvicorn gateway.app:app --reload --port 9100

Environment variables (optional)
- BASE_DIR: repo root (default: parent of gateway/)
- BASE_SIGNALS_PATH: default signals.json
- BASE_MAPPING_PATH: default mapping.json
- OVERLAY_SIGNALS_PATH: default signals.local.json
- OVERLAY_MAPPING_PATH: default mapping.local.json
- PORT: default 9100 (use with uvicorn --port)

Notes
- This gateway never writes to signals.json or mapping.json.
- Overlay writes are atomic (temp file -> rename).
- mapping.local.json schema: { [signalName]: [{ name: string, bit: number|null }] }
- signals.local.json schema: { [signalName]: string[] | null } (null acts as tombstone to remove)

