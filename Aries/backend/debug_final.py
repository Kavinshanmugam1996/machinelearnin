
import asyncio
from database.connection import engine
from database.models import Question
from sqlalchemy import select

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(select(Question.qid, Question.text, Question.industry).where(Question.component_group == "").where(Question.industry == "Universal"))
        data = res.all()
        print(f"Universal questions with NO group: {len(data)}")
        for r in data:
            print(f"  {r[0]}: {r[1][:100]}...")

if __name__ == "__main__":
    asyncio.run(run())
