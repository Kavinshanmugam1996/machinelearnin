
import asyncio
from database.connection import engine
from database.models import Question
from sqlalchemy import select

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(select(Question.component_group).distinct())
        groups = [r[0] for r in res.all()]
        print(f"Groups: {groups}")
        
        res = await conn.execute(select(Question.qid, Question.text, Question.component_group).where(Question.industry == "Universal").limit(5))
        print("Universal Questions Sample:")
        for r in res.all():
            print(f"  {r[0]}: {r[2]} - {r[1][:50]}...")

if __name__ == "__main__":
    asyncio.run(run())
