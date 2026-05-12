
import os
import uuid
import json
import logging
import csv
import secrets
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Request, HTTPException, Body, Depends, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text, inspect, or_
from sqlalchemy.orm import selectinload

# Import internal modules
from database.connection import get_db
from database.models import (
    User,
    Domain,
    Department,
    Category,
    UseCase,
    UseCaseCategoryWeight,
    Question,
    Assessment,
)
from services.remediation import RemediationService
from services.email_service import send_verification_email, send_password_reset_email
from middleware import SecurityHeadersMiddleware, RequestLoggingMiddleware
import schemas

REGISTRATION_ENABLED = os.getenv("REGISTRATION_ENABLED", "false").lower() == "true"

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
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

ASSESSMENTS_DIR = Path(
    os.getenv("ASSESSMENTS_DIR", str(Path(__file__).parent.parent / "Data" / "Assessments"))
)
ASSESSMENTS_DIR.mkdir(parents=True, exist_ok=True)

S3_BUCKET = os.getenv("S3_BUCKET")
s3 = boto3.client("s3") if S3_BUCKET else None


def _sanitize_for_path(value: str) -> str:
    return "".join(ch for ch in value if ch.isalnum() or ch in ("-", "_", ".", "@"))


def _assessment_snapshot_path(owner_email: str, client_id: str) -> Path:
    safe_owner = _sanitize_for_path(owner_email.lower() if owner_email else "unknown")
    safe_client_id = "".join(ch for ch in client_id if ch.isalnum() or ch in ("-", "_"))
    owner_dir = ASSESSMENTS_DIR / safe_owner
    owner_dir.mkdir(parents=True, exist_ok=True)
    return owner_dir / f"{safe_client_id}.json"


def _write_assessment_snapshot(payload: dict) -> None:
    client_id = payload.get("id")
    owner_email = payload.get("owner_email")
    if not client_id or not owner_email:
        return

    if S3_BUCKET:
        key = f"snapshots/{_sanitize_for_path(owner_email.lower())}/{client_id}.json"
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(payload, indent=2))
    else:
        snapshot_path = _assessment_snapshot_path(owner_email, client_id)
        with open(snapshot_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)


def _read_assessment_snapshot(owner_email: str, client_id: str) -> Optional[dict]:
    if S3_BUCKET:
        key = f"snapshots/{_sanitize_for_path(owner_email.lower())}/{client_id}.json"
        try:
            response = s3.get_object(Bucket=S3_BUCKET, Key=key)
            return json.loads(response["Body"].read())
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return None
            raise
    else:
        snapshot_path = _assessment_snapshot_path(owner_email, client_id)
        if not snapshot_path.exists():
            return None
        with open(snapshot_path, "r", encoding="utf-8") as f:
            return json.load(f)


def _is_password_hash(value: str) -> bool:
    return isinstance(value, str) and value.startswith("$")


def _parse_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

# --- CONFIGURATION ---
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ALLOW_INSECURE_DEV", "false").lower() == "true":
        SECRET_KEY = "dev-insecure-key-change-me"
        logger.warning("Running with insecure development SECRET_KEY")
    else:
        raise RuntimeError("SECRET_KEY is required. Set environment variable SECRET_KEY.")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
ALREADY_HASHED = True # Set to False if migrating strictly from plain-text

# --- SECURITY HELPERS ---
def verify_password(plain_password, stored_password):
    if not stored_password:
        return False
    if _is_password_hash(stored_password):
        try:
            return pwd_context.verify(plain_password, stored_password)
        except Exception:
            return False
    # Backward compatibility for legacy plain-text users; upgraded on successful login.
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
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add custom security and logging middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# --- STARTUP EVENT: Seed Users and Load Data ---
@app.on_event("startup")
async def startup_event():
    """Create tables, seed test users, and load normalized SQL dataset on startup."""
    from database.connection import engine
    from database.models import Base

    # In production, never drop data automatically. Allow optional explicit reset only.
    reset_legacy_schema = os.getenv("RESET_LEGACY_SCHEMA", "false").lower() == "true"

    has_legacy_schema = False
    async with engine.begin() as conn:
        def _has_legacy_questions_schema(sync_conn):
            inspector = inspect(sync_conn)
            if "questions" not in inspector.get_table_names():
                return False
            cols = {c["name"] for c in inspector.get_columns("questions")}
            return "qid_code" not in cols

        has_legacy_schema = await conn.run_sync(_has_legacy_questions_schema)
        if has_legacy_schema and reset_legacy_schema:
            for table_name in [
                "risks",
                "question_mapper",
                "questions",
                "use_case_category_weights",
                "use_cases",
                "categories",
                "clusters",
                "departments",
                "domains",
            ]:
                await conn.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
            logger.warning("RESET_LEGACY_SCHEMA enabled: dropped legacy schema tables")
        elif has_legacy_schema:
            logger.error("Legacy questions schema detected. Set RESET_LEGACY_SCHEMA=true to reset in controlled environments.")

    # Create current tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed test users and load data
    db_generator = get_db()
    db = await db_generator.__anext__()
    
    try:
        # 1. Seed test users
        credentials_path = Path(__file__).parent / "credentials.csv"
        if credentials_path.exists():
            with open(credentials_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = row['email'].lower()
                    password = row['password']
                    
                    # Check if user already exists
                    stmt = select(User).where(User.email == email)
                    existing_user = (await db.execute(stmt)).scalar_one_or_none()
                    
                    if not existing_user:
                        new_user = User(
                            email=email,
                            hashed_password=pwd_context.hash(password)
                        )
                        db.add(new_user)
                        logger.info(f"Seeded user: {email}")
                    elif not _is_password_hash(existing_user.hashed_password):
                        existing_user.hashed_password = pwd_context.hash(password)
                        logger.info(f"Upgraded legacy password hash for user: {email}")
                
                await db.commit()
        else:
            logger.warning(f"credentials.csv not found at {credentials_path}")
        
        # 2. Load normalized dataset (Option B)
        data_dir = Path(__file__).parent.parent / "Data"
        sql_candidates = [data_dir / "Aires_DBA.sql", data_dir / "aries_rds.sql"]
        sql_path = next((p for p in sql_candidates if p.exists()), None)
        if sql_path:
            # Avoid replaying non-idempotent INSERT script on every restart.
            has_questions = (await db.execute(select(Question.id).limit(1))).first() is not None
            if not has_questions and not has_legacy_schema:
                logger.info(f"Loading normalized dataset from {sql_path.name}...")
                with open(sql_path, 'r', encoding='utf-8') as f:
                    raw_sql = f.read()

                buffer = []
                statements = []
                for line in raw_sql.splitlines():
                    stripped = line.strip()
                    if not stripped or stripped.startswith("--"):
                        continue
                    buffer.append(line)
                    if stripped.endswith(";"):
                        stmt = "\n".join(buffer).strip()
                        buffer = []
                        stmt = stmt[:-1].strip() if stmt.endswith(";") else stmt
                        if stmt.upper() in {"BEGIN", "COMMIT"}:
                            continue
                        # Skip PostgreSQL-only sequence statements when running locally.
                        if "pg_get_serial_sequence" in stmt.lower() or stmt.lower().startswith("select setval("):
                            continue
                        statements.append(stmt)

                for stmt in statements:
                    await db.execute(text(stmt))
                await db.commit()
                logger.info(f"Loaded normalized SQL dataset from {sql_path.name}")
            else:
                logger.info("Normalized dataset already loaded; skipping SQL seed")
        else:
            logger.warning(f"No SQL dataset found in {data_dir}; expected Aires_DBA.sql or aries_rds.sql")
        
    except Exception as e:
        logger.error(f"Failed to seed data: {e}")
        await db.rollback()
    finally:
        await db.close()

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

@app.get("/verify-email.html")
async def serve_verify_email():
    page_path = frontend_dir / "verify-email.html"
    if page_path.exists():
        return FileResponse(page_path)
    raise HTTPException(status_code=404, detail="Page not found")

@app.get("/reset-password.html")
async def serve_reset_password():
    page_path = frontend_dir / "reset-password.html"
    if page_path.exists():
        return FileResponse(page_path)
    raise HTTPException(status_code=404, detail="Page not found")

@app.get("/health")
async def health_check():
    """Health check endpoint for AWS/Load Balancer."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/login", response_model=schemas.Token)
async def login(creds: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == creds.email.lower())
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user and verify_password(creds.password, user.hashed_password):
        if REGISTRATION_ENABLED and not user.email_verified:
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Please check your inbox for a verification link."
            )
        if not _is_password_hash(user.hashed_password):
            user.hashed_password = pwd_context.hash(creds.password)
            await db.commit()
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        logger.info(f"User logged in: {user.email}")
        return {"access_token": access_token, "token_type": "bearer"}

    logger.warning(f"Failed login attempt: {creds.email}")
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/register", response_model=schemas.MessageResponse)
async def register(req: schemas.UserRegister, db: AsyncSession = Depends(get_db)):
    if not REGISTRATION_ENABLED:
        raise HTTPException(status_code=503, detail="Registration is not currently available.")
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    email = req.email.lower()
    stmt = select(User).where(User.email == email)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        # Don't reveal whether the account exists — generic response
        return {"message": "If that email is not already registered, a verification link has been sent."}

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    user = User(
        email=email,
        hashed_password=pwd_context.hash(req.password),
        email_verified=False,
        verification_token=token,
        verification_token_expires=expires,
    )
    db.add(user)
    await db.commit()

    send_verification_email(email, token)
    logger.info(f"New user registered: {email}")
    return {"message": "If that email is not already registered, a verification link has been sent."}


@app.get("/api/verify-email", response_model=schemas.MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.verification_token == token)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not user.verification_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")
    if datetime.now(timezone.utc) > user.verification_token_expires:
        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    await db.commit()
    logger.info(f"Email verified: {user.email}")
    return {"message": "Email verified successfully. You can now log in."}


@app.post("/api/resend-verification", response_model=schemas.MessageResponse)
async def resend_verification(req: schemas.PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    if not REGISTRATION_ENABLED:
        raise HTTPException(status_code=503, detail="Registration is not currently available.")

    stmt = select(User).where(User.email == req.email.lower())
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user and not user.email_verified:
        token = secrets.token_urlsafe(32)
        user.verification_token = token
        user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        await db.commit()
        send_verification_email(user.email, token)

    return {"message": "If your account exists and is unverified, a new verification link has been sent."}


@app.post("/api/request-password-reset", response_model=schemas.MessageResponse)
async def request_password_reset(req: schemas.PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email.lower())
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        send_password_reset_email(user.email, token)

    return {"message": "If an account with that email exists, a password reset link has been sent."}


@app.post("/api/reset-password", response_model=schemas.MessageResponse)
async def reset_password(req: schemas.PasswordReset, db: AsyncSession = Depends(get_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    stmt = select(User).where(User.reset_token == req.token)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    if datetime.now(timezone.utc) > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    user.hashed_password = pwd_context.hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()
    logger.info(f"Password reset completed: {user.email}")
    return {"message": "Password reset successfully. You can now log in with your new password."}

OTHER_INDUSTRY_VALUES = {
    "other",
    "other industry",
    "others",
    "other industries",
}


def _normalized_industry(industry: Optional[str]) -> str:
    return (industry or "").strip().lower()


def _is_other_industry(industry: Optional[str]) -> bool:
    return _normalized_industry(industry) in OTHER_INDUSTRY_VALUES


async def _resolve_use_cases(req: schemas.QuestionRequest) -> List[str]:
    use_cases = req.use_cases or []
    if not use_cases and req.inventory:
        use_cases = [item.useCase for item in req.inventory if item.useCase]
    # Keep original order while removing duplicates.
    return list(dict.fromkeys([u.strip() for u in use_cases if u and u.strip()]))


async def _resolve_component_tags(db: AsyncSession, use_cases: List[str]) -> List[str]:
    if not use_cases:
        return []

    stmt = (
        select(Category.slug)
        .join(UseCaseCategoryWeight, UseCaseCategoryWeight.category_id == Category.id)
        .join(UseCase, UseCase.id == UseCaseCategoryWeight.use_case_id)
        .where(UseCase.name.in_(use_cases), UseCaseCategoryWeight.weight > 0)
    )
    result = await db.execute(stmt)
    tags = [slug for slug in result.scalars().all() if slug]
    return sorted(set(tags))


async def _fetch_filtered_questions(req: schemas.QuestionRequest, db: AsyncSession) -> List[Question]:
    use_cases = await _resolve_use_cases(req)
    none_labels = {
        "None of the above / No specific AI use cases",
        "None of the above / No AI use cases",
    }
    is_none = any(uc in none_labels for uc in use_cases)

    stmt = (
        select(Question)
        .options(
            selectinload(Question.cluster_rel),
            selectinload(Question.category),
            selectinload(Question.domain),
            selectinload(Question.department_rel),
        )
        .join(Category, Question.category_id == Category.id)
        .join(Domain, Question.domain_id == Domain.id, isouter=True)
        .join(Department, Question.dept_id == Department.id, isouter=True)
    )

    # Step 1: Industry-first selection.
    if req.industry:
        if _is_other_industry(req.industry):
            # "Other" should not pull industry-specific questions.
            stmt = stmt.where(or_(Domain.name == "General", Question.is_universal.is_(True)))
        else:
            stmt = stmt.where(
                or_(
                    Domain.name == req.industry,
                    Domain.name == "General",
                    Question.is_universal.is_(True),
                )
            )

    # Step 2: Use-case component tag filtering via weighted mapper table.
    if use_cases and not is_none:
        component_tags = await _resolve_component_tags(db, use_cases)
        if not component_tags:
            return []
        stmt = stmt.where(Category.slug.in_(component_tags))

    # Order by department and question code. Deduplicate in Python to avoid
    # PostgreSQL's restriction that ORDER BY columns must appear in SELECT DISTINCT list.
    stmt = stmt.order_by(Department.name.asc(), Question.qid_code.asc())
    result = await db.execute(stmt)
    seen = set()
    questions = []
    for q in result.scalars().all():
        if q.id not in seen:
            seen.add(q.id)
            questions.append(q)
    return questions

@app.post("/api/get-questions", response_model=List[schemas.QuestionBase])
async def get_questions(
    req: schemas.QuestionRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    questions = await _fetch_filtered_questions(req, db)
    return questions

@app.post("/api/get-components", response_model=schemas.ComponentResponse)
async def get_components(
    req: schemas.ComponentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Given use case names, return the union of mapped category slugs."""
    groups = await _resolve_component_tags(db, req.use_cases or [])
    return {"component_groups": groups}


@app.post("/api/assessment/{client_id}/department-progress", response_model=schemas.DepartmentProgressResponse)
async def get_department_progress(
    client_id: str,
    req: schemas.QuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    stmt = select(Assessment).where(
        (Assessment.client_id == client_id) & (Assessment.owner_email == current_user)
    )
    assessment = (await db.execute(stmt)).scalar_one_or_none()

    answers = assessment.answers or {} if assessment else {}
    answered_qids = {qid for qid, ans in answers.items() if ans is not None and str(ans).strip() != ""}

    questions = await _fetch_filtered_questions(req, db)

    per_department = {}
    for q in questions:
        dept = q.department or "Unassigned"
        if dept not in per_department:
            per_department[dept] = {"answered": 0, "total": 0}
        per_department[dept]["total"] += 1
        if q.qid in answered_qids:
            per_department[dept]["answered"] += 1

    departments = []
    for dept_name in sorted(per_department.keys()):
        answered = per_department[dept_name]["answered"]
        total = per_department[dept_name]["total"]
        progress = int((answered / total) * 100) if total > 0 else 0
        departments.append(
            {
                "department": dept_name,
                "answered": answered,
                "total": total,
                "progress": progress,
            }
        )

    all_departments_complete = bool(departments) and all(d["progress"] == 100 for d in departments)
    return {
        "departments": departments,
        "all_departments_complete": all_departments_complete,
    }

@app.post("/api/save", response_model=schemas.SaveResponse)
async def save_assessment(
    assessment_data: schemas.AssessmentBase, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Upsert logic
    stmt = select(Assessment).where(
        (Assessment.client_id == assessment_data.id) & (Assessment.owner_email == current_user)
    )
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        assessment = Assessment(client_id=assessment_data.id, owner_email=current_user)
        db.add(assessment)
    
    assessment.name = assessment_data.name
    assessment.profile = assessment_data.profile
    # Persist every answer the user provided, regardless of trigger-point metadata.
    assessment.answers = assessment_data.answers or {}
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

    # Write a durable JSON snapshot in addition to DB persistence.
    try:
        snapshot_payload = {
            "id": assessment_data.id,
            "owner_email": current_user,
            "name": assessment_data.name,
            "profile": assessment_data.profile,
            "answers": assessment_data.answers or {},
            "currentQuestionIndex": assessment_data.currentQuestionIndex,
            "totalQuestions": assessment_data.totalQuestions,
            "savedAt": datetime.now(timezone.utc).isoformat(),
        }
        _write_assessment_snapshot(snapshot_payload)
    except Exception as e:
        logger.error(f"Failed to write assessment snapshot {assessment_data.id}: {e}")
        
    if producer:
        try:
            kafka_event = {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "client_id": assessment_data.id,
                "action": "assessment_updated",
                "user": current_user,
                "data": assessment_data.model_dump(by_alias=True)
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
    stmt = select(Assessment).where(
        (Assessment.client_id == client_id) & (Assessment.owner_email == current_user)
    )
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        snapshot = _read_assessment_snapshot(current_user, client_id)
        if snapshot:
            return {
                "id": snapshot.get("id", client_id),
                "name": snapshot.get("name", "Unnamed Assessment"),
                "profile": snapshot.get("profile"),
                "answers": snapshot.get("answers", {}),
                "currentQuestionIndex": snapshot.get("currentQuestionIndex", 0),
                "totalQuestions": snapshot.get("totalQuestions", 0),
            }

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
            answered_count = len(a.answers) if a.answers else 0
            progress = int((answered_count / a.total_questions) * 100)
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
    stmt = select(Assessment).where(
        (Assessment.client_id == client_id) & (Assessment.owner_email == current_user)
    )
    assessment = (await db.execute(stmt)).scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # We also need the questions to match against
    stmt_q = select(Question).options(
        selectinload(Question.cluster_rel),
        selectinload(Question.category),
        selectinload(Question.domain),
        selectinload(Question.department_rel),
    )
    questions = (await db.execute(stmt_q)).scalars().all()
    
    advice = RemediationService.get_advice(questions, assessment.answers or {})
    return advice

@app.delete("/api/assessment/{client_id}", response_model=schemas.SaveResponse)
async def delete_assessment(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        stmt = select(Assessment).where(
            (Assessment.client_id == client_id) & (Assessment.owner_email == current_user)
        )
        assessment = (await db.execute(stmt)).scalar_one_or_none()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Delete using delete statement
        delete_stmt = delete(Assessment).where(
            (Assessment.client_id == client_id) & (Assessment.owner_email == current_user)
        )
        result = await db.execute(delete_stmt)
        await db.commit()
        
        logger.info(f"Assessment deleted: {client_id} by {current_user}")
        try:
            snapshot_path = _assessment_snapshot_path(current_user, client_id)
            if snapshot_path.exists():
                snapshot_path.unlink()
        except Exception as e:
            logger.error(f"Failed to delete snapshot {client_id}: {e}")
        return {"status": "success", "message": "Assessment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        import traceback
        error_msg = traceback.format_exc()
        logger.error(f"Failed to delete assessment {client_id}: {error_msg}")
        raise HTTPException(
            status_code=500, 
            detail=f"Deletion failed. Error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
