import os
import json
from typing import Dict, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# --- Config ---
BASE_DIR = Path(os.getenv("BASE_DIR", Path(__file__).resolve().parents[1]))
BASE_SIGNALS_PATH = BASE_DIR / os.getenv("BASE_SIGNALS_PATH", "signals.json")
BASE_MAPPING_PATH = BASE_DIR / os.getenv("BASE_MAPPING_PATH", "mapping.json")
OVERLAY_SIGNALS_PATH = BASE_DIR / os.getenv("OVERLAY_SIGNALS_PATH", "signals.local.json")
OVERLAY_MAPPING_PATH = BASE_DIR / os.getenv("OVERLAY_MAPPING_PATH", "mapping.local.json")

# --- Models ---
class Action(BaseModel):
    name: str
    bit: Optional[int] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str):
        v2 = v.strip()
        if not v2:
            raise ValueError("action name cannot be empty")
        return v2

    @field_validator("bit")
    @classmethod
    def validate_bit(cls, v: Optional[int]):
        if v is None:
            return v
        if not isinstance(v, int) or v < 0:
            raise ValueError("bit must be a non-negative integer or null")
        return v

class Signal(BaseModel):
    name: str
    actions: List[Action] = Field(default_factory=list)

class SignalsResponse(BaseModel):
    signals: List[Signal]

class CreateSignalRequest(BaseModel):
    name: str
    actions: List[str] = Field(default_factory=list)

class PutActionsRequest(BaseModel):
    actions: List[Action]

class MappingResponse(BaseModel):
    # mapping keyed by signal
    mapping: Dict[str, List[Action]]

class PutMappingRequest(BaseModel):
    mapping: Dict[str, List[Action]]

# --- Helpers: file IO ---
def _load_json(path: Path) -> Dict:
    try:
        if not path.exists():
            return {}
        txt = path.read_text().strip()
        if txt == "":
            return {}
        return json.loads(txt)
    except Exception:
        # Return empty if invalid JSON (be tolerant for base mapping.json)
        return {}


def _write_json_atomic(path: Path, data: Dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    tmp_path.replace(path)


# --- Helpers: merge logic ---
def _sanitize_actions_list(lst: List[str]) -> List[str]:
    out: List[str] = []
    for x in lst:
        if isinstance(x, str):
            t = x.strip()
            if t:
                out.append(t)
    return out


def _merge_signals(base: Dict[str, List[str]], overlay: Dict[str, Optional[List[str]]]) -> Dict[str, List[str]]:
    # Copy base and apply overlay. If overlay value is None, treat as tombstone (delete)
    merged: Dict[str, List[str]] = {}
    for k, v in base.items():
        if isinstance(v, list):
            merged[k] = _sanitize_actions_list(v)
    for k, v in overlay.items():
        if v is None:
            if k in merged:
                del merged[k]
        elif isinstance(v, list):
            merged[k] = _sanitize_actions_list(v)
    return merged


def _read_signals_merged() -> Dict[str, List[str]]:
    base = _load_json(BASE_SIGNALS_PATH)
    overlay = _load_json(OVERLAY_SIGNALS_PATH)
    # sanitize overlay on read and write back if changed
    cleaned_overlay: Dict[str, Optional[List[str]]] = {}
    changed = False
    for k, v in overlay.items():
        if v is None:
            cleaned_overlay[k] = None
        elif isinstance(v, list):
            sv = _sanitize_actions_list(v)
            cleaned_overlay[k] = sv
            if sv != v:
                changed = True
    # preserve keys not lists/None as-is
    for k, v in overlay.items():
        if k not in cleaned_overlay:
            cleaned_overlay[k] = v
    if changed:
        _write_json_atomic(OVERLAY_SIGNALS_PATH, cleaned_overlay)
    return _merge_signals(base, cleaned_overlay)


def _read_mapping_overlay() -> Dict[str, List[Dict]]:
    # Overlay mapping schema: { signalName: [{name, bit}] }
    data = _load_json(OVERLAY_MAPPING_PATH)
    # normalize and sanitize
    norm: Dict[str, List[Dict]] = {}
    changed = False
    for sig, arr in data.items():
        if isinstance(arr, list):
            items: List[Dict] = []
            for it in arr:
                if isinstance(it, dict) and "name" in it:
                    name = str(it.get("name") or "").strip()
                    if not name:
                        # drop empty names
                        changed = True
                        continue
                    bit = it.get("bit")
                    if bit is not None and (not isinstance(bit, int) or bit < 0):
                        bit = None
                        changed = True
                    items.append({"name": name, "bit": bit})
            norm[sig] = items
    if changed:
        _write_json_atomic(OVERLAY_MAPPING_PATH, norm)
    return norm


def _validate_unique_bits(actions: List[Action]):
    seen = {}
    for a in actions:
        if a.bit is None:
            continue
        if a.bit in seen:
            raise HTTPException(status_code=400, detail=f"Duplicate bit {a.bit} for actions '{seen[a.bit]}' and '{a.name}'")
        seen[a.bit] = a.name


# --- App ---
app = FastAPI(title="UI Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/ui/signals", response_model=SignalsResponse)
def get_signals():
    merged = _read_signals_merged()
    overlay_map = _read_mapping_overlay()
    signals: List[Signal] = []
    for name, action_names in sorted(merged.items()):
        # map bits from overlay mapping
        mapped = {a["name"]: a.get("bit") for a in overlay_map.get(name, []) if isinstance(a, dict)}
        actions = [Action(name=a, bit=mapped.get(a)) for a in action_names]
        signals.append(Signal(name=name, actions=actions))
    return SignalsResponse(signals=signals)


@app.post("/ui/signals", status_code=201)
def create_signal(req: CreateSignalRequest):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Signal name cannot be empty")

    base = _load_json(BASE_SIGNALS_PATH)
    overlay = _load_json(OVERLAY_SIGNALS_PATH)

    merged = _merge_signals(base, overlay)
    if name in merged:
        raise HTTPException(status_code=409, detail="Signal already exists")

    # Update overlay: set actions list
    overlay[name] = list(req.actions)
    _write_json_atomic(OVERLAY_SIGNALS_PATH, overlay)

    # No need to touch mapping overlay here
    return {"created": True, "name": name}


@app.delete("/ui/signals/{name}")
def delete_signal(name: str):
    base = _load_json(BASE_SIGNALS_PATH)
    overlay = _load_json(OVERLAY_SIGNALS_PATH)

    merged = _merge_signals(base, overlay)
    if name not in merged:
        raise HTTPException(status_code=404, detail="Signal not found")

    # Tombstone in overlay
    overlay[name] = None
    _write_json_atomic(OVERLAY_SIGNALS_PATH, overlay)

    # Remove mapping overlay for that signal
    map_overlay = _read_mapping_overlay()
    if name in map_overlay:
        del map_overlay[name]
        _write_json_atomic(OVERLAY_MAPPING_PATH, map_overlay)

    return {"deleted": True}


@app.get("/ui/signals/{name}", response_model=Signal)
def get_signal(name: str):
    merged = _read_signals_merged()
    if name not in merged:
        raise HTTPException(status_code=404, detail="Signal not found")
    overlay_map = _read_mapping_overlay()
    action_names = merged[name]
    mapped = {a["name"]: a.get("bit") for a in overlay_map.get(name, []) if isinstance(a, dict)}
    actions = [Action(name=a, bit=mapped.get(a)) for a in action_names]
    return Signal(name=name, actions=actions)


@app.put("/ui/signals/{name}/actions")
def put_signal_actions(name: str, req: PutActionsRequest):
    # Validate existence
    base = _load_json(BASE_SIGNALS_PATH)
    overlay = _load_json(OVERLAY_SIGNALS_PATH)
    merged = _merge_signals(base, overlay)
    if name not in merged:
        raise HTTPException(status_code=404, detail="Signal not found")

    # Validate unique bits
    _validate_unique_bits(req.actions)

    # Update overlay signals list to reflect action names
    overlay[name] = [a.name for a in req.actions]
    _write_json_atomic(OVERLAY_SIGNALS_PATH, overlay)

    # Update overlay mapping for this signal only
    map_overlay = _read_mapping_overlay()
    map_overlay[name] = [a.model_dump() for a in req.actions]
    _write_json_atomic(OVERLAY_MAPPING_PATH, map_overlay)

    return {"updated": True}


@app.get("/ui/mapping", response_model=MappingResponse)
def get_mapping():
    merged_signals = _read_signals_merged()
    map_overlay = _read_mapping_overlay()

    result: Dict[str, List[Action]] = {}
    for name, action_names in merged_signals.items():
        mapped = {a["name"]: a.get("bit") for a in map_overlay.get(name, []) if isinstance(a, dict)}
        result[name] = [Action(name=a, bit=mapped.get(a)) for a in action_names]

    return MappingResponse(mapping=result)


@app.put("/ui/mapping")
def put_mapping(req: PutMappingRequest):
    # Validate unique bits per signal
    for sig, actions in req.mapping.items():
        _validate_unique_bits(actions)

    # Ensure signals exist; if not, create in overlay with provided actions
    base = _load_json(BASE_SIGNALS_PATH)
    overlay = _load_json(OVERLAY_SIGNALS_PATH)
    merged = _merge_signals(base, overlay)

    for sig, actions in req.mapping.items():
        overlay[sig] = [a.name for a in actions]
    _write_json_atomic(OVERLAY_SIGNALS_PATH, overlay)

    # Write mapping overlay
    map_overlay = _read_mapping_overlay()
    for sig, actions in req.mapping.items():
        map_overlay[sig] = [a.model_dump() for a in actions]
    _write_json_atomic(OVERLAY_MAPPING_PATH, map_overlay)

    return {"updated": True}

