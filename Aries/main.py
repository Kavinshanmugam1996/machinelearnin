import os
import uuid
import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- KAFKA PRODUCER SETUP (AWS READY) ---
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC', 'AIRES-assessment-events')
try:
    from kafka import KafkaProducer
    # Defaults to localhost for dev, but configurable for AWS MSK via Env Var
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
    print(f"WARNING: Kafka connection error (Expected if broker is offline): {e}")
    producer = None
# ----------------------------------------

app = FastAPI(title="AIRES™ Risk Profiler Backend")

# Allow CORS for external access if needed in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ASSESSMENTS_DIR = Path("Assessments")
ASSESSMENTS_DIR.mkdir(exist_ok=True)

# Mount static files directly
app.mount("/Data", StaticFiles(directory="Data"), name="Data")

@app.get("/")
@app.get("/risk_profiler.html")
async def serve_frontend():
    if not os.path.exists("risk_profiler.html"):
        raise HTTPException(status_code=404, detail="risk_profiler.html not found")
    return FileResponse("risk_profiler.html")

@app.get("/bizcom.jpg")
async def serve_logo():
    if os.path.exists("bizcom.jpg"):
        return FileResponse("bizcom.jpg")
    raise HTTPException(status_code=404, detail="bizcom.jpg not found")

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
    
    # --- PUBLISH TO KAFKA ---
    if producer is not None:
        kafka_event = {
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "client_id": client_id,
            "action": "assessment_updated",
            "data": data
        }
        try:
            # Asynchronously send message to the Kafka topic
            producer.send(KAFKA_TOPIC, value=kafka_event)
            # Flush occasionally or rely on background thread
            print(f"[{datetime.utcnow().isoformat()}] PUBLISHED EVENT -> Kafka Topic: {KAFKA_TOPIC}")
        except Exception as e:
            print(f"ERROR: Failed to stream to Kafka: {e}")
    # ------------------------

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
    # This runs the app locally when invoking "python main.py"
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
