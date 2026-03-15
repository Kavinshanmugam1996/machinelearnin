# AIRES™ Architecture Overview

AIRES™ (AI Risk Evaluation System) is designed for enterprise-scale AI governance and risk assessment.

## Component Breakdown

### 1. Backend (FastAPI)
- **Framework**: Python 3.11 with FastAPI.
- **API**: Provides endpoints for saving assessments, retrieving client lists, and serving the frontend.
- **Data Persistence**: JSON-based storage for assessments; CSV/XLSX for core risk data.
- **Messaging**: (Optional) Kafka integration for real-time risk event streaming.

### 2. Frontend (React)
- **Framework**: React 18+ loaded via CDN.
- **Processing**: Uses Babel Standalone for in-browser JSX transformation (minimizing build-step complexity for dev).
- **Styling**: Vanilla CSS for flexibility and performance.

### 3. Data Layer
- **Core DB**: `AR_Risk_DB.csv` and `questions.json` define the assessment logic.
- **Mappings**: `Question_mapper_final.csv` links industry sectors to specific risk profiles.

## Deployment
- **Containerization**: Fully Dockerized for AWS ECS/App Runner.
- **Port**: Exposed on port 3000.
