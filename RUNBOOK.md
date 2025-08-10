# NatIgnite RoninHand Bridge - Runbook

This document provides step-by-step instructions to run the complete system.

## System Overview

The system consists of:

- **API Server** (`api.py`) - Main data server providing signals and mappings
- **Frontend** (Next.js) - Web interface for managing signals and state mappings
- **RoninHand Server** (external) - Robot hand control server

## Data Format

### signals.json

```json
{
	"bite": ["clenched", "open"],
	"EMG": ["up", "down"]
}
```

### mapping.json

```json
{
	"['clenched', 'up']": ["hello", "mate"],
	"['clenched', 'down']": null,
	"['open', 'up']": null,
	"['open', 'down']": null
}
```

## 1. API Server (api.py)

The main API server provides data endpoints and handles signal/mapping updates.

### Start Command

```bash
python3 api.py
```

### Server Details

- **Port**: 7001
- **Base URL**: <http://localhost:7001>

### Available Endpoints

#### GET Endpoints

- `GET /` - Health check
- `GET /signals` - Get current signals configuration
- `GET /mapping` - Get current state mappings

#### POST Endpoints

- `POST /add_signal` - Add a new signal with states

  ```json
  {
  	"signal": "bite",
  	"signal_types": ["clenched", "open"]
  }
  ```

- `POST /remove_signal` - Remove a signal

  ```json
  {
  	"signal": "bite"
  }
  ```

- `POST /add_mapping` - Add/update state combination mapping

  ```json
  {
  	"signal": "['clenched', 'up']",
  	"mapsto": ["hello", "mate"]
  }
  ```

- `POST /receive_signals` - Receive live signal data

  ```json
  {
  	"signal": "bite",
  	"value": "clenched"
  }
  ```

### File Dependencies

- Reads/writes: `signals.json`, `mapping.json`
- Auto-generates mapping combinations when signals are modified

## 2. Frontend (Next.js)

Web interface for managing signals and state mappings.

### Setup & Start

```bash
cd frontend
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:7002" > .env.local

# Start CORS proxy (required due to api.py CORS header duplication)
npm run proxy

# In another terminal, start development server
npm run dev
```

### Frontend Details

- **Port**: 3000
- **URL**: <http://localhost:3000>
- **Main Route**: <http://localhost:3000/signals>
- **CORS Proxy Port**: 7002

### Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:7002
```

### CORS Proxy

Due to duplicate CORS headers in api.py (which cannot be modified), a proxy server is required:

- **Purpose**: Removes duplicate CORS headers and sets clean ones
- **Port**: 7002
- **Target**: api.py at port 7001
- **Command**: `npm run proxy` (must run before frontend)

### Features

- View and manage signals with their states
- Create state combinations and assign actions
- Rainbow border animations and accessible UI
- Save disclaimer warnings

## 3. RoninHand Server

External robot hand control server (not in this repository).

### Expected Setup

```bash
# Navigate to RoninHand server directory
cd /path/to/roninhand-server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install scservo_sdk requests

# Run server
python3 server.py
```

### Server Details

- **Expected Port**: 8000
- **Base URL**: <http://localhost:8000>
- **Dependencies**: scservo_sdk for servo control

### Expected Endpoints

- `GET /current_positions` - Get current servo positions
- `POST /update` - Update servo positions
- `POST /execute` - Execute gesture commands

## 4. Example Curl Commands

### Read Current State

```bash
# Get signals
curl http://127.0.0.1:7001/signals

# Get mappings
curl http://127.0.0.1:7001/mapping
```

### Create Signal

```bash
curl -X POST http://127.0.0.1:7001/add_signal \
  -H "Content-Type: application/json" \
  -d '{
    "signal": "EMG",
    "signal_types": ["up", "down"]
  }'
```

### Set Mapping

```bash
curl -X POST http://127.0.0.1:7001/add_mapping \
  -H "Content-Type: application/json" \
  -d '{
    "signal": "[\"clenched\", \"up\"]",
    "mapsto": ["hello", "mate"]
  }'
```

## 5. End-to-End Verification

### Quick Setup Verification

1. **Start API Server**:

   ```bash
   python3 api.py
   # Should show: Server running at http://localhost:7001
   ```

2. **Verify API Endpoints**:

   ```bash
   curl http://127.0.0.1:7001/signals
   curl http://127.0.0.1:7001/mapping
   ```

3. **Install Frontend Dependencies**:

   ```bash
   cd frontend && npm install
   # This installs express and http-proxy-middleware for the CORS proxy
   ```

4. **Start CORS Proxy**:

   ```bash
   cd frontend && npm run proxy
   # Should show: CORS Proxy running on http://localhost:7002
   # Proxying requests to api.py at http://127.0.0.1:7001
   ```

5. **Start Frontend** (in another terminal):

   ```bash
   cd frontend && npm run dev
   # Should show: ready - started server on http://localhost:3000
   ```

6. **Test Frontend**:
   - Visit <http://localhost:3000/signals>
   - Should see current signals and be able to add new ones

### Complete Workflow Test

1. **Create test signals** (bite with clenched/open, EMG with up/down)
2. **Set mapping** for ['clenched', 'up'] → ["hello","mate"]
3. **Verify data persistence** by refreshing and checking JSON files
4. **Test API responses** match the target format exactly

### Data Verification

```bash
# Download current state
curl http://127.0.0.1:7001/signals > current_signals.json
curl http://127.0.0.1:7001/mapping > current_mapping.json

# Compare with expected format
diff signals.json current_signals.json
diff mapping.json current_mapping.json
```

## 6. Troubleshooting

### Common Issues

- **Port conflicts**: API server uses 7001, frontend uses 3000
- **CORS errors**: API server includes CORS headers for localhost:3000
- **Missing dependencies**: Install Node.js, Python 3, and required packages
- **File permissions**: Ensure API server can read/write JSON files

### Development Notes

- API server auto-regenerates mapping.json when signals change
- Frontend validates input and shows errors for missing data
- All endpoints return JSON with appropriate HTTP status codes
- Save operations are atomic to prevent data corruption

## 7. Architecture Notes

### Data Flow

1. Frontend creates signals via API → signals.json updated
2. API auto-generates all possible state combinations → mapping.json updated
3. Frontend allows editing individual state combinations
4. Live signals trigger actions via mapping lookup

### Key Features

- **No overlay files**: All data goes directly through api.py endpoints
- **Exact formatting**: Combo keys use single quotes with space after comma
- **Validation**: Client and server validate signal/state names are non-empty
- **Atomic updates**: Temporary files used during writes, then renamed
