from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.entities import User
from app.schemas.domain import DispenseRequest, APIResponse
from app.services.prescription_service import prescription_service
from app.services.dispensing_engine import dispensing_engine

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])

@router.get("/verify/{token_or_id}", response_model=APIResponse)
async def verify_prescription(
    token_or_id: str,
    db: AsyncSession = Depends(get_db),
    pharmacist_user: User = Depends(require_role("PHARMACIST"))
):
    result = await prescription_service.verify_prescription(
        db=db,
        token_or_id=token_or_id,
        pharmacist_user=pharmacist_user
    )
    return APIResponse(success=True, data=result)

@router.post("/dispense", response_model=APIResponse)
async def record_dispense(
    req: DispenseRequest,
    db: AsyncSession = Depends(get_db),
    pharmacist_user: User = Depends(require_role("PHARMACIST"))
):
    result = await dispensing_engine.process_dispense(
        db=db,
        req=req,
        pharmacist_user=pharmacist_user
    )
    return APIResponse(success=True, data=result)
