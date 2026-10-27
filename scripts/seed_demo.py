import asyncio
import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db.session import engine, Base
from app.db.seed import seed_initial_data

async def main():
    print("[RxGuard Seed] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("[RxGuard Seed] Seeding demonstration organizations and users...")
    await seed_initial_data()
    print("[RxGuard Seed] Seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
