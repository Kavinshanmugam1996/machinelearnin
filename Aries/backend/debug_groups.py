
import asyncio
from database.connection import engine
from database.models import Question
from sqlalchemy import select

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(select(Question.qid, Question.text).where(Question.component_group == "").limit(10))
        print("Questions with NO Group:")
        for r in res.all():
            print(f"  {r[0]}: {r[1][:100]}...")

if __name__ == "__main__":
    asyncio.run(run())
