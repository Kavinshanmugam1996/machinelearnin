import http.server
import socketserver
import json
import os
import uuid
from datetime import datetime
from pathlib import Path

PORT = 3000
ASSESSMENTS_DIR = Path("Assessments")

# --- KAFKA PRODUCER SETUP (AWS READY) ---
KAFKA_TOPIC = "aries-assessment-events"
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

class AriesHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/save":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            client_id = data.get("id")
            if not client_id:
                self.send_error(400, "Missing client ID")
                return

            # Ensure directory exists
            ASSESSMENTS_DIR.mkdir(exist_ok=True)
            
            # Save to file
            file_path = ASSESSMENTS_DIR / f"{client_id}.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            
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

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "file": str(file_path)}).encode())
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path == "/api/clients":
            clients = []
            if ASSESSMENTS_DIR.exists():
                for f in ASSESSMENTS_DIR.glob("*.json"):
                    try:
                        with open(f, "r", encoding="utf-8") as j:
                            d = json.load(j)
                            clients.append({"id": d.get("id"), "name": d.get("name")})
                    except Exception as e:
                        print(f"Error reading {f}: {e}")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(clients).encode())
        else:
            super().do_GET()

# Ensure assessment directory exists on startup
ASSESSMENTS_DIR.mkdir(exist_ok=True)

with socketserver.TCPServer(("", PORT), AriesHandler) as httpd:
    print(f"serving at port {PORT}")
    httpd.serve_forever()
