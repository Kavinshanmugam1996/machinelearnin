# AIRES™: AI Risk Evaluation System

![AIRES Branding](frontend/bizcom.jpg)

AIRES™ is an enterprise-grade AI governance and risk assessment platform developed for **Bizcom**. It enables organizations to evaluate AI systems against regulatory frameworks and ethical standards.

## Project Structure

This repository follows enterprise-grade best practices for scalability and organization:

- **`backend/`**: FastAPI-based API server (Python 3.11).
- **`frontend/`**: React-based assessment interface.
- **`data/`**: Consolidated storage for risk models (JSON/CSV) and assessments.
- **`docs/`**: Technical documentation and [Architecture Overview](docs/ARCHITECTURE.md).
- **`.github/`**: CI/CD workflows and issue/PR templates.

## Quick Start (Local Development)

### Direct Launch
```bash
# Navigate to backend
cd backend/

# Install dependencies
pip install -r requirements.txt

# Start Server
python main.py
```
Access the profiler at: [http://localhost:3000](http://localhost:3000)

### via Docker
```bash
# Build the image from backend
docker build -t aires-backend backend/

# Run the container
docker run -p 3000:3000 aires-backend
```

## Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our standards and branching strategy.

---
*Developed for Bizcom AI Governance | Enterprise Edition*
