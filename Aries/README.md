# AIRES™ Risk Profiler - Deployment Guide

This repository contains the **AIRES™ Risk Profiler**, a containerized FastAPI application with a modern React-based frontend.

## AWS Deployment (Quick Start)

The application is "AWS Ready" and can be deployed to **AWS ECS (Fargate)** or **AWS App Runner**.

### 1. Build & Push Docker Image
```bash
# Build the image
docker build -t aires-risk-profiler .

# Authenticate with Amazon ECR and push (replace <REGION> and <ACCOUNT_ID>)
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
docker tag aires-risk-profiler:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/aires-risk-profiler:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/aires-risk-profiler:latest
```

### 2. Environment Variables
When deploying to AWS, you can configure the following environment variables:
- `KAFKA_BROKERS`: List of Kafka brokers (e.g., for AWS MSK). Defaults to `localhost:9092`.
- `KAFKA_TOPIC`: Name of the Kafka topic for events. Defaults to `AIRES-assessment-events`.

### 3. Networking
- The application exposes port **3000**.
- Ensure your Security Groups allow inbound traffic on this port (or port 80/443 if using a Load Balancer).

## Local Development
To run the application locally:
```bash
python main.py
```
Then visit `http://localhost:3000` in your browser.

## Tech Stack
- **Frontend**: React (via CDN), Babel Standalone, Vanilla CSS.
- **Backend**: FastAPI (Python 3.11).
- **Messaging**: Kafka (Optional, streams assessment events).
- **Data**: CSV & JSON based question mapping.

---
*Branding: AIRES™ Risk Profiler | Developed for Enterprise AI Governance.*
