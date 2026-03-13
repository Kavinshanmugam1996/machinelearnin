import asyncio
from database.connection import get_db
from database.models import QuestionMapper
from sqlalchemy import select

async def main():
    async for db in get_db():
        result = await db.execute(select(QuestionMapper))
        mappers = result.scalars().all()
        for m in mappers:
            print(f"{m.use_case} -> {m.component_groups}")
        break

if __name__ == "__main__":
    asyncio.run(main())
