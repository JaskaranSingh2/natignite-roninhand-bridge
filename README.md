# NatIgnite RoninHand Bridge

## Overview

NatIgnite RoninHand Bridge is a modular platform for managing and mapping signals to robotic actions. The system features a modern web-based UI, a robust API backend, and optional gateway integration for advanced workflows. Designed for flexibility, accessibility, and business scalability, it enables users to define custom features, map state combinations, and control robotic devices with ease.

## Features

- **Intuitive UI**: Minimal, business-friendly interface for managing signals and actions.
- **Custom Features**: Easily define new signal types (e.g., clenching, moving up/down).
- **Mapping Engine**: Map any combination of signal states to specific actions.
- **Overlay Model**: All user changes are stored in overlay files, preserving base data.
- **Accessibility**: WCAG AA-compliant, keyboard navigation, and screen reader support.
- **Automated Testing**: Jest, Testing Library, and jest-axe for accessibility and reliability.
- **Extensible Gateway**: Optional FastAPI gateway for advanced integrations and overlay writes.

## Quick Start

See [RUNBOOK.md](RUNBOOK.md) for full setup instructions.

1. **Start API Server**

   ```bash
   python3 api.py
   ```

2. **Install Frontend Dependencies**

   ```bash
   cd frontend && npm install
   ```

3. **Start CORS Proxy**

   ```bash
   cd frontend && npm run proxy
   ```

4. **Start Frontend**

   ```bash
   cd frontend && npm run dev
   ```

5. **Access the UI**
   - Visit [http://localhost:3000/signals](http://localhost:3000/signals)

## Data Model

- **signals.json**: Defines available signals and their possible states.
- **mapping.json**: Maps state combinations to actions.
- **signals.local.json / mapping.local.json**: Overlay files for user edits.

## Business Value

- **Scalable**: Easily adapts to new devices, features, and workflows.
- **Accessible**: Designed for all users, including those with disabilities.
- **Reliable**: Automated tests and atomic overlay writes ensure data integrity.
- **Flexible**: Customizable mappings and features for any robotic application.
- **Investment-Ready**: Built for integration, expansion, and real-world deployment.

## Technology Stack

- Next.js (TypeScript, Tailwind CSS)
- FastAPI (Python)
- React Query, Testing Library, jest-axe
- Overlay persistence model

## Contributing

Pull requests and issues are welcome. Please see `.gitignore` for excluded files and [RUNBOOK.md](RUNBOOK.md) for developer setup.

## Related Projects

- [Original RoninHand Repository](https://github.com/Polymorph-Intelligence/RoninHand/)

## License

MIT License
