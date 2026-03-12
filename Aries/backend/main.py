import os
import uuid
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Request, HTTPException, Body
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- CONFIGURATION ---
DATA_DIR = Path(__file__).parent.parent / "Data"
ASSESSMENTS_DIR = DATA_DIR / "Assessments"
ASSESSMENTS_DIR.mkdir(parents=True, exist_ok=True)

# --- DATA STORAGE (IN-MEMORY CACHE) ---
QUESTIONS = []
QUESTION_MAPPER = {}
RISK_DB = {}
CREDENTIALS = {}

def load_data():
    global QUESTIONS, QUESTION_MAPPER, RISK_DB, CREDENTIALS
    
    # Load Questions
    questions_path = DATA_DIR / "questions.json"
    if questions_path.exists():
        with open(questions_path, "r", encoding="utf-8") as f:
            QUESTIONS = json.load(f)
    
    # Load Question Mapper
    mapper_path = DATA_DIR / "Question_mapper.csv"
    if mapper_path.exists():
        with open(mapper_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            component_headers = headers[1:]
            for row in reader:
                if not row: continue
                use_case = row[0].strip()
                groups = []
                for i, val in enumerate(row[1:]):
                    try:
                        weight = float(val)
                        if weight > 0:
                            groups.append(component_headers[i].strip())
                    except ValueError:
                        continue
                QUESTION_MAPPER[use_case] = groups

    # Load Risk DB
    risk_path = DATA_DIR / "AR_Risk_DB.csv"
    if risk_path.exists():
        with open(risk_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                qid = row.get("QID")
                if qid:
                    if qid not in RISK_DB:
                        RISK_DB[qid] = []
                    RISK_DB[qid].append({
                        "riskId": row.get("Risk ID"),
                        "desc": row.get("Risk Description")
                    })

    # Load Credentials
    creds_path = Path(__file__).parent / "credentials.csv"
    if creds_path.exists():
        with open(creds_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = row.get("email", "").lower()
                password = row.get("password")
                if email and password:
                    CREDENTIALS[email] = password

load_data()

# --- KAFKA PRODUCER SETUP (AWS READY) ---
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC', 'AIRES-assessment-events')
try:
    from kafka import KafkaProducer
    KAFKA_BROKERS = os.environ.get('KAFKA_BROKERS', 'localhost:9092')
    producer = KafkaProducer(
        bootstrap_servers=[b.strip() for b in KAFKA_BROKERS.split(',')],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    print(f"INFO: Kafka Configured. Streaming events to topic: {KAFKA_TOPIC} on {KAFKA_BROKERS}")
except ImportError:
    print("WARNING: kafka-python library not installed. Event streaming disabled.")
    producer = None
except Exception as e:
    print(f"WARNING: Kafka connection error: {e}")
    producer = None

app = FastAPI(title="AIRES™ Risk Profiler Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/risk_profiler.html")
async def serve_frontend():
    frontend_path = Path(__file__).parent.parent / "frontend" / "risk_profiler.html"
    if not frontend_path.exists():
        raise HTTPException(status_code=404, detail="risk_profiler.html not found")
    return FileResponse(frontend_path)

@app.get("/bizcom.jpg")
async def serve_logo():
    logo_path = Path(__file__).parent.parent / "frontend" / "bizcom.jpg"
    if logo_path.exists():
        return FileResponse(logo_path)
    raise HTTPException(status_code=404, detail="bizcom.jpg not found")

@app.post("/api/login")
async def login(credentials: dict = Body(...)):
    email = credentials.get("email", "").lower()
    password = credentials.get("password")
    
    if email in CREDENTIALS and CREDENTIALS[email] == password:
        return {"status": "success", "user": email}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/get-questions")
async def get_questions(payload: dict = Body(...)):
    inventory = payload.get("inventory", [])
    industry = payload.get("industry")
    
    mandatory_groups = ["privacy", "security", "reliability", "legal_regulatory"]
    all_groups = set(mandatory_groups)
    
    for item in inventory:
        use_case = item.get("useCase")
        if use_case in QUESTION_MAPPER:
            all_groups.update(QUESTION_MAPPER[use_case])
    
    relevant = []
    for q in QUESTIONS:
        is_universal = q.get("is_universal", False)
        belongs_to_industry = industry and q.get("industry") == industry
        matches_group = q.get("component_group") in all_groups
        
        if is_universal or (belongs_to_industry and matches_group):
            relevant.append(q)
            
    return relevant

@app.post("/api/save")
async def save_assessment(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Request Payload")
    
    client_id = data.get("id")
    if not client_id:
        raise HTTPException(status_code=400, detail="Missing client ID")

    # Save to file
    file_path = ASSESSMENTS_DIR / f"{client_id}.json"
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"ERROR: Failed to write file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save data on server")
    
    if producer is not None:
        kafka_event = {
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "client_id": client_id,
            "action": "assessment_updated",
            "data": data
        }
        try:
            producer.send(KAFKA_TOPIC, value=kafka_event)
            print(f"[{datetime.utcnow().isoformat()}] PUBLISHED EVENT -> Kafka Topic: {KAFKA_TOPIC}")
        except Exception as e:
            print(f"ERROR: Failed to stream to Kafka: {e}")

    return JSONResponse(content={"status": "success", "file": str(file_path)})

@app.get("/api/clients")
async def get_clients():
    clients = []
    if ASSESSMENTS_DIR.exists():
        for f in ASSESSMENTS_DIR.glob("*.json"):
            try:
                with open(f, "r", encoding="utf-8") as j:
                    d = json.load(j)
                    clients.append({"id": d.get("id"), "name": d.get("name")})
            except Exception as e:
                print(f"Error reading {f}: {e}")
    
    return JSONResponse(content=clients)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
