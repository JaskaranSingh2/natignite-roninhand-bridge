# NatIgnite RoninHand Bridge - Runbook

This runbook provides step-by-step instructions for running all components of the NatIgnite RoninHand Bridge system.

## Overview

The system consists of:

- **API Server** (`api.py`) - Core signal processing server
- **Frontend** (Next.js) - Web UI for managing signals and actions
- **Gateway** (FastAPI) - Optional UI-friendly API layer with overlay persistence
- **RoninHand Server** - Physical robot control server

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm
- Git

## 1. API Server (Core)

The main signal processing server that handles signal definitions and mapping.

### Setup & Run

```bash
# From project root
python3 api.py
```

**Port:** 7000  
**Endpoints:**

- `GET /` - Health check
- `GET /signals` - Get all signals from signals.json
- `GET /mapping` - Get signal mappings from mapping.json
- `POST /add_signal` - Add new signal
- `POST /remove_signal` - Remove signal
- `POST /add_mapping` - Add signal mapping
- `POST /receive_signals` - Receive signal values for processing

**Files:**

- Reads: `signals.json`, `mapping.json`
- Writes: `signals.json`, `mapping.json` (base files)

## 2. Gateway (FastAPI) - Optional

UI-friendly API layer that implements overlay persistence model (base + overlay).

### Setup

```bash
# Create virtual environment
python3 -m venv gateway-env
source gateway-env/bin/activate  # On Windows: gateway-env\Scripts\activate

# Install dependencies
pip install -r gateway/requirements.txt
```

### Run

```bash
# From project root, with venv activated
uvicorn gateway.app:app --reload --port 9100
```

**Port:** 9100  
**Base URL:** <http://127.0.0.1:9100>

### Environment Variables (Optional)

```bash
export BASE_SIGNALS_PATH=signals.json
export OVERLAY_SIGNALS_PATH=signals.local.json
export BASE_MAPPING_PATH=mapping.json
export OVERLAY_MAPPING_PATH=mapping.local.json
```

**Endpoints:**

- `GET /health` - Health check
- `GET /ui/signals` - Get merged signals (base + overlay)
- `POST /ui/signals` - Create signal in overlay
- `DELETE /ui/signals/{name}` - Delete signal (tombstone in overlay)
- `GET /ui/signals/{name}` - Get specific signal
- `PUT /ui/signals/{name}/actions` - Update signal actions
- `GET /ui/mapping` - Get full mapping
- `PUT /ui/mapping` - Update mapping

**Files:**

- Reads: `signals.json`, `mapping.json`, `signals.local.json`, `mapping.local.json`
- Writes: `signals.local.json`, `mapping.local.json` (overlay files only)

## 3. Frontend (Next.js)

Web interface for managing signals and actions with accessibility features.

### Setup

```bash
cd frontend
npm install
```

### Configuration

Create `frontend/.env.local`:

```bash
# Point to Gateway (recommended) or API directly
NEXT_PUBLIC_API_URL=http://127.0.0.1:9100

# Alternative: Point to API directly (read-only mode)
# NEXT_PUBLIC_API_URL=http://127.0.0.1:7000
```

### Run

```bash
# From frontend directory
npm run dev
```

**Port:** 3000  
**URL:** <http://localhost:3000/signals>

### Features

- Dark/light theme toggle (defaults to dark)
- Accessibility tested with jest-axe
- Signal and action management
- Focus management for keyboard navigation
- Responsive design

### Testing

```bash
# Run accessibility tests
npm test
```

## 4. RoninHand Server

Physical robot control server that executes gestures and servo movements.

### Location

The RoninHand server is typically located in a separate repository or directory. Look for:

- `server.py` using `scservo_sdk`
- Usually runs on port 8000

### Setup & Run

```bash
# Install dependencies (in robot server directory)
pip install scservo_sdk requests

# Run server
python3 server.py
```

**Port:** 8000 (default)  
**Endpoints:**

- `GET /current_positions` - Get current servo positions
- `POST /update` - Update servo positions
- `POST /execute` - Execute gesture

## 5. Running the Complete System

### Recommended Startup Order

1. **Start RoninHand Server** (if available)

   ```bash
   # In robot server directory
   python3 server.py
   ```

2. **Start API Server**

   ```bash
   python3 api.py
   ```

3. **Start Gateway** (recommended for UI)

   ```bash
   source gateway-env/bin/activate
   uvicorn gateway.app:app --reload --port 9100
   ```

4. **Start Frontend**

   ```bash
   cd frontend
   npm run dev
   ```

### Access Points

- **Web UI:** <http://localhost:3000/signals>
- **Gateway API:** <http://127.0.0.1:9100>
- **Core API:** <http://127.0.0.1:7000>
- **Robot API:** <http://127.0.0.1:8000>

## 6. File Persistence Model

### Base Files (Read-Only in Production)

- `signals.json` - Base signal definitions
- `mapping.json` - Base signal mappings

### Overlay Files (User Changes)

- `signals.local.json` - User signal modifications
- `mapping.local.json` - User mapping modifications

### Merge Logic

- Overlay values override base values
- `null` in overlay = delete/tombstone
- Gateway handles merging automatically
- API server only works with base files

## 7. E2E Smoke Test (Optional)

Quick verification that the system is working:

```bash
# Test Gateway endpoints
curl http://127.0.0.1:9100/health
curl http://127.0.0.1:9100/ui/signals

# Test signal creation
curl -X POST http://127.0.0.1:9100/ui/signals \
  -H "Content-Type: application/json" \
  -d '{"name": "test_signal", "actions": ["test_action"]}'

# Test signal retrieval
curl http://127.0.0.1:9100/ui/signals/test_signal
```

## 8. Troubleshooting

### Common Issues

**Port Conflicts**

- API: Change port in `api.py` (default 7000)
- Gateway: Use `--port` flag with uvicorn
- Frontend: Use `npm run dev -- --port 3001`

**CORS Issues**

- Ensure Gateway CORS allows frontend origin
- Check NEXT_PUBLIC_API_URL matches Gateway URL

**Missing Dependencies**

```bash
# Frontend
cd frontend && npm install

# Gateway
pip install -r gateway/requirements.txt

# Robot server
pip install scservo_sdk requests
```

**File Permissions**

- Ensure write permissions for overlay files
- Check that `signals.json` and `mapping.json` exist

### Logs

- Frontend: Browser developer console
- Gateway: Terminal output with `--reload`
- API: Terminal output
- Robot: Check server.py output

## 9. Development Notes

### Frontend Development

- Uses Next.js 14 App Router
- Tailwind CSS for styling
- TypeScript throughout
- Jest + Testing Library for testing

### API Development

- Gateway uses FastAPI with Pydantic validation
- Core API uses basic http.server
- Overlay model prevents base file corruption

### Accessibility

- WCAG AA compliant
- Screen reader tested
- Keyboard navigation
- Color contrast verified

## 10. Production Deployment

For production deployment:

1. Build frontend: `npm run build`
2. Use production WSGI server for Gateway
3. Configure reverse proxy (nginx/Apache)
4. Set appropriate environment variables
5. Ensure file permissions for overlay writes
6. Monitor logs and health endpoints

---

_Last updated: August 2025_
