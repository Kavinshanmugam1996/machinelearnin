import os
import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Request, HTTPException, Body, Depends, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

# Import internal modules
from database.connection import get_db
from database.models import User, Question, QuestionMapper, Assessment
from services.remediation import RemediationService
from middleware import SecurityHeadersMiddleware, RequestLoggingMiddleware
import schemas

# --- ENTERPRISE LOGGING ---
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

logger = logging.getLogger("aires")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# --- CONFIGURATION ---
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "change-at-least-32-character-very-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 43200))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALREADY_HASHED = True # Set to False if migrating strictly from plain-text

# --- SECURITY HELPERS ---
def verify_password(plain_password, stored_password):
    # In this phase, we still check for plain text match for migration ease,
    # but the infrastructure is ready for full hashing.
    return plain_password == stored_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(schemas.oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email

# --- KAFKA PRODUCER SETUP ---
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC', 'AIRES-assessment-events')
try:
    from kafka import KafkaProducer
    KAFKA_BROKERS = os.environ.get('KAFKA_BROKERS', 'localhost:9092')
    producer = KafkaProducer(
        bootstrap_servers=[b.strip() for b in KAFKA_BROKERS.split(',')],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    logger.info(f"Kafka Configured. Streaming events to topic: {KAFKA_TOPIC}")
except Exception as e:
    logger.warning(f"Kafka connection error or library missing: {e}")
    producer = None

# --- APP SETUP ---
app = FastAPI(title="AIRES™ Risk Profiler Backend (SQL)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom security and logging middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# --- STATIC FILES ---
# Mount the frontend directory to serve JS, CSS, and Images
frontend_dir = Path(__file__).parent.parent / "frontend"
app.mount("/src", StaticFiles(directory=str(frontend_dir / "src")), name="src")
app.mount("/styles", StaticFiles(directory=str(frontend_dir / "src" / "styles")), name="styles")

@app.get("/")
@app.get("/risk_profiler.html")
async def serve_index():
    index_path = frontend_dir / "risk_profiler.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend index not found")

@app.get("/bizcom.jpg")
async def serve_root_logo():
    logo_path = frontend_dir / "bizcom.jpg"
    if logo_path.exists():
        return FileResponse(logo_path)
    raise HTTPException(status_code=404, detail="Logo not found")

@app.post("/api/login", response_model=schemas.Token)
async def login(creds: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == creds.email.lower())
    user = (await db.execute(stmt)).scalar_one_or_none()
    
    if user and verify_password(creds.password, user.hashed_password):
        access_token = create_access_token(
            data={"sub": user.email}, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        logger.info(f"User logged in: {user.email}")
        return {"access_token": access_token, "token_type": "bearer"}
    
    logger.warning(f"Failed login attempt: {creds.email}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/get-questions", response_model=List[schemas.QuestionBase])
async def get_questions(
    req: schemas.QuestionRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    mandatory_groups = ["privacy", "security", "reliability", "legal_regulatory"]
    all_groups = set(mandatory_groups)
    all_groups.add("") # Include generic/universal questions
    all_groups.add(None)
    
    is_none = any(item.useCase == "None of the above / No specific AI use cases" for item in req.inventory)
    
    if not is_none:
        for item in req.inventory:
            stmt = select(QuestionMapper).where(QuestionMapper.use_case == item.useCase)
            mapper = (await db.execute(stmt)).scalar_one_or_none()
            if mapper and mapper.component_groups:
                all_groups.update([g.strip() for g in mapper.component_groups.split(",")])
    
    # Fetch questions: (Industry matches OR is Universal)
    # AND (component_group matches our calculated set)
    stmt = select(Question).where(
        ((Question.industry == req.industry) | (Question.industry == "Universal")) &
        (Question.component_group.in_(list(all_groups)))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@app.post("/api/save", response_model=schemas.SaveResponse)
async def save_assessment(
    assessment_data: schemas.AssessmentBase, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Upsert logic
    stmt = select(Assessment).where(Assessment.client_id == assessment_data.id)
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        assessment = Assessment(client_id=assessment_data.id, owner_email=current_user)
        db.add(assessment)
    
    assessment.name = assessment_data.name
    assessment.profile = assessment_data.profile
    assessment.answers = assessment_data.answers
    assessment.current_index = assessment_data.currentQuestionIndex
    
    # Only update total_questions if it's > 0 to avoid resetting progress 
    # during initialization race conditions
    if assessment_data.totalQuestions > 0:
        assessment.total_questions = assessment_data.totalQuestions
    
    try:
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to save assessment {assessment_data.id}: {e}")
        raise HTTPException(status_code=500, detail="Database save failed")
        
    if producer:
        try:
            kafka_event = {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "client_id": assessment_data.id,
                "action": "assessment_updated",
                "user": current_user,
                "data": assessment_data.dict(by_alias=True)
            }
            producer.send(KAFKA_TOPIC, value=kafka_event)
        except Exception as e:
            logger.error(f"Kafka stream error: {e}")
            
    logger.info(f"Assessment saved: {assessment_data.id} for {current_user}")
    return {"status": "success", "message": "Assessment data persisted successfully"}

@app.get("/api/assessment/{client_id}", response_model=schemas.AssessmentBase)
async def get_assessment(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    stmt = select(Assessment).where(Assessment.client_id == client_id)
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        # Return a blank structure if not found (expected for new clients)
        return {
            "id": client_id,
            "name": "Unnamed Assessment",
            "profile": None,
            "answers": {},
            "currentQuestionIndex": 0,
            "totalQuestions": 0
        }
        
    return {
        "id": assessment.client_id,
        "name": assessment.name,
        "profile": assessment.profile,
        "answers": assessment.answers,
        "currentQuestionIndex": assessment.current_index,
        "totalQuestions": assessment.total_questions
    }

@app.get("/api/clients", response_model=List[schemas.ClientRead])
async def get_clients(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    stmt = select(Assessment).where(Assessment.owner_email == current_user)
    result = await db.execute(stmt)
    clients_data = []
    for a in result.scalars().all():
        progress = 0
        if a.total_questions and a.total_questions > 0:
            progress = int((a.current_index / a.total_questions) * 100)
        clients_data.append({
            "id": a.client_id, 
            "name": a.name or "Unnamed Assessment",
            "progress": progress,
            "totalQuestions": a.total_questions or 0
        })
    return clients_data

@app.get("/api/remediation/{client_id}")
async def get_remediation(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    stmt = select(Assessment).where(Assessment.client_id == client_id)
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # We also need the questions to match against
    stmt_q = select(Question)
    questions = (await db.execute(stmt_q)).scalars().all()
    
    advice = RemediationService.get_advice(questions, assessment.answers or {})
    return advice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
