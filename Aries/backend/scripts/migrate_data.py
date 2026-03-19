import asyncio
import json
import csv
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import sys
import os

# Add backend to path so we can import models and connection
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import Base, User, Question, QuestionMapper, Risk
from database.connection import engine, AsyncSessionLocal

DATA_DIR = Path(__file__).parent.parent.parent / "Data"

async def migrate():
    print("--- Starting AIRES Data Migration ---")
    
    # 1. Create tables
    async with engine.begin() as conn:
        # For a clean migration, we drop and recreate (WARNING: Dev only)
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # 1. Migrate Users
        creds_path = Path(__file__).parent.parent / "credentials.csv"
        if creds_path.exists():
            print(f"Migrating users from {creds_path.name}...")
            with open(creds_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = row.get("email", "").lower()
                    pwd = row.get("password")
                    if email and pwd:
                        # Check if exists
                        stmt = select(User).where(User.email == email)
                        result = await session.execute(stmt)
                        if not result.scalar_one_or_none():
                            session.add(User(email=email, hashed_password=pwd))
        
        # 2. Migrate Questions
        questions_path = DATA_DIR / "questions.json"
        if questions_path.exists():
            print(f"Migrating questions from {questions_path.name}...")
            with open(questions_path, "r", encoding="utf-8") as f:
                qs = json.load(f)
                for q_data in qs:
                    qid = q_data.get("qid")
                    stmt = select(Question).where(Question.qid == qid)
                    result = await session.execute(stmt)
                    if not result.scalar_one_or_none():
                        session.add(Question(
                            qid=qid,
                            text=q_data.get("text"),
                            cluster=q_data.get("cluster"),
                            component_group=q_data.get("component_group"),
                            industry=q_data.get("industry"),
                            is_universal=q_data.get("is_universal", False),
                            department=q_data.get("department"),
                            options=q_data.get("options", [])
                        ))
            await session.commit() # Commit questions so we can link risks

        # 3. Migrate Risks (linked to questions)
        risk_path = DATA_DIR / "AR_Risk_DB.csv"
        if risk_path.exists():
            print(f"Migrating risks from {risk_path.name}...")
            # We need a qid -> question mapping
            stmt = select(Question)
            result = await session.execute(stmt)
            q_map = {q.qid: q.id for q in result.scalars().all()}
            inserted_risks = 0
            skipped_risks = 0
            
            with open(risk_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    qid = (row.get("QID Code") or "").strip()
                    if qid in q_map:
                        risk_id = (row.get("Risk ID") or "").strip()
                        if not risk_id:
                            continue

                        # Idempotent load: don't duplicate an already-migrated risk.
                        exists_stmt = select(Risk).where(
                            (Risk.risk_id == risk_id) &
                            (Risk.question_id == q_map[qid])
                        )
                        existing = (await session.execute(exists_stmt)).scalars().first()
                        if existing:
                            skipped_risks += 1
                            continue

                        session.add(Risk(
                            risk_id=risk_id,
                            description=(row.get("Risk Description") or "").strip(),
                            question_id=q_map[qid]
                        ))
                        inserted_risks += 1
            print(f"Risks inserted: {inserted_risks}, skipped existing: {skipped_risks}")
        
        # 4. Migrate Question Mapper
        mapper_path = DATA_DIR / "Question_mapper_final.csv"
        if mapper_path.exists():
            print(f"Migrating question mapper from {mapper_path.name}...")
            with open(mapper_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                headers = next(reader)
                comp_headers = headers[1:]
                for row in reader:
                    if not row: continue
                    use_case = row[0].strip()
                    groups = []
                    for i, val in enumerate(row[1:]):
                        try:
                            if float(val) > 0:
                                groups.append(comp_headers[i].strip())
                        except: continue
                    
                    stmt = select(QuestionMapper).where(QuestionMapper.use_case == use_case)
                    result = await session.execute(stmt)
                    if not result.scalar_one_or_none():
                        session.add(QuestionMapper(
                            use_case=use_case,
                            component_groups=",".join(groups)
                        ))

        await session.commit()
    print("--- Migration Complete ---")

if __name__ == "__main__":
    asyncio.run(migrate())
