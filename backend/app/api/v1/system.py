from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.domain import APIResponse
from app.services.blockchain_service import blockchain_service

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/health", response_model=APIResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "OK"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "DOWN"

    bc_status = "CONNECTED" if blockchain_service.is_connected() else "DISCONNECTED"

    return APIResponse(
        success=True,
        data={
            "status": "HEALTHY" if db_status == "OK" and bc_status == "CONNECTED" else "DEGRADED",
            "components": {
                "api": "OK",
                "database": db_status,
                "blockchain_gateway": bc_status,
                "storage": "OK"
            },
            "timestamp": datetime.now(timezone.utc)
        }
    )

@router.get("/healthz")
async def liveness():
    return {"status": "ok"}
