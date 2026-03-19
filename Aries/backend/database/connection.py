import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Require explicit DATABASE_URL in production environments.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("ALLOW_INSECURE_DEV", "false").lower() == "true":
        DATABASE_URL = "sqlite+aiosqlite:///aires.db"
    else:
        raise RuntimeError("DATABASE_URL is required. Set environment variable DATABASE_URL.")

# Handle DB URL and connect args
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True # Add connection health check
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
