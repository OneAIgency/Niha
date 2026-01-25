"""
List users in the database. Use to verify User Details / admin users.

Usage:
  docker compose exec backend python check_users.py
  # or, with venv: python check_users.py
"""
import asyncio
import sys

sys.path.insert(0, ".")

from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.models import User


async def main():
    async with AsyncSessionLocal() as db:
        total = await db.scalar(select(func.count()).select_from(User))
        print(f"Total users in DB: {total}")

        result = await db.execute(
            select(User).order_by(User.created_at.desc()).limit(50)
        )
        users = result.scalars().all()
        print(f"\nUsers (latest 50):")
        print("-" * 80)
        for u in users:
            print(f"  id={u.id}  email={u.email!r}  role={u.role}  active={u.is_active}")


if __name__ == "__main__":
    asyncio.run(main())
