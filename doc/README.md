# Documentation Index

This folder contains all project documentation files.

## Quick Links

### Getting Started
- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 30 seconds

### Architecture & Design
- **[Services Refactor](SERVICES_REFACTOR.md)** - Complete overview of the service architecture refactor, what changed, and why

### Bug Fixes
- **[Matchmaking Bug Fix](MATCHMAKING_BUG_FIX.md)** - Details on the matchmaking polling bug and how it was fixed (if this file exists)

## Module-Specific Documentation

Located in their respective modules:
- **Backend API** - [`../backend/README.md`](../backend/README.md)
- **Frontend** - [`../client/README.md`](../client/README.md)
- **Services Layer** - [`../backend/backend_app/services/README.md`](../backend/backend_app/services/README.md)

## Project Structure

```
doc/
├── README.md                # This file - documentation index
├── QUICKSTART.md            # Quick start guide
├── SERVICES_REFACTOR.md     # Architecture documentation
└── MATCHMAKING_BUG_FIX.md   # Bug fix documentation
```

## Contributing Documentation

When adding new documentation:
1. Create `.md` files in this `doc/` folder
2. Add links to this index
3. Update the main [`../README.md`](../README.md) if needed
4. Keep module-specific docs in their respective folders

