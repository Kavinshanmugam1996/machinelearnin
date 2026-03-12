# AIRES™: AI Risk Evaluation System

![AIRES Branding](frontend/bizcom.jpg)

AIRES™ is an enterprise-grade AI governance and risk assessment platform developed for **Bizcom**. It enables organizations to evaluate AI systems against regulatory frameworks and ethical standards.

## Project Structure

This repository follows enterprise-grade best practices for scalability and organization:

- **`backend/`**: FastAPI-based API server with SQLAlchemy ORM.
- **`frontend/`**: Buildless React interface using native ES Modules and HTM.
- **`data/`**: Consolidated storage for risk models (JSON/CSV) and relational SQLite data.
- **`docs/`**: Technical documentation and [Scope Document](docs/SCOPE.md).
- **`.github/`**: CI/CD workflows and issue/PR templates.

## Quick Start (Local Development)

### Direct Launch
```bash
# 1. Navigate to backend
cd backend/

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize/Migrate Data
python scripts/migrate_data.py

# 4. Start Server
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```
Access the profiler at: [http://localhost:3001/risk_profiler.html](http://localhost:3001/risk_profiler.html)

### Tech Stack
- **Frontend**: Native ES Modules, [HTM](https://github.com/developit/htm) (Zero-build React), Vanilla CSS.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy (Async SQLite).
- **Messaging**: Kafka (Optional event streaming).
- **Security**: JWT-based Authentication.

## Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our standards and branching strategy.

---
*Developed for Bizcom AI Governance | Enterprise Edition*
