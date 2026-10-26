from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.api.deps import require_role
from app.models.entities import User, AuditEvent
from app.schemas.domain import APIResponse

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/events", response_model=APIResponse)
async def get_audit_events(
    rx_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("DOCTOR", "PHARMACIST", "ORG_ADMIN", "SYSTEM_ADMIN"))
):
    stmt = select(AuditEvent)
    if rx_id:
        stmt = stmt.where(AuditEvent.target_resource_id == rx_id)
    if event_type:
        stmt = stmt.where(AuditEvent.event_type == event_type)

    # Organization isolation: Non-system admins only see their own organization's events
    if current_user.role != "SYSTEM_ADMIN":
        stmt = stmt.where(AuditEvent.organization_id == current_user.organization_id)

    stmt = stmt.order_by(desc(AuditEvent.timestamp)).limit(limit)
    res = await db.execute(stmt)
    events = res.scalars().all()

    return APIResponse(
        success=True,
        data=[
            {
                "id": e.id,
                "event_type": e.event_type,
                "actor_id": e.actor_id,
                "organization_id": e.organization_id,
                "target_resource_id": e.target_resource_id,
                "blockchain_tx_id": e.blockchain_tx_id,
                "status": e.status,
                "details": e.details,
                "timestamp": e.timestamp
            }
            for e in events
        ]
    )
