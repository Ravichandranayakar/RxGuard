import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

db_url = settings.DATABASE_URL

# Check if aiosqlite is missing and handle fallback
if "sqlite" in db_url:
    try:
        import aiosqlite  # test import
    except ImportError:
        # If running without aiosqlite, inform and adjust or install dynamically
        import subprocess
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "aiosqlite"])
            import aiosqlite
        except Exception:
            pass

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    """FastAPI dependency for obtaining async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
