from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import require_role
from app.models.entities import User, Prescription
from app.schemas.domain import (
    CreatePrescriptionRequest, RevokePrescriptionRequest, APIResponse
)
from app.services.prescription_service import prescription_service
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("", response_model=APIResponse)
async def create_prescription(
    req: CreatePrescriptionRequest,
    db: AsyncSession = Depends(get_db),
    doctor_user: User = Depends(require_role("DOCTOR"))
):
    result = await prescription_service.create_prescription(
        db=db,
        req=req,
        doctor_user=doctor_user
    )
    return APIResponse(success=True, data=result)

@router.get("/{prescription_id}", response_model=APIResponse)
async def get_prescription_details(
    prescription_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("DOCTOR", "PHARMACIST", "ORG_ADMIN"))
):
    stmt = select(Prescription).where(Prescription.prescription_id == prescription_id)
    res = await db.execute(stmt)
    rx = res.scalar_one_or_none()
    if not rx:
        raise NotFoundError(f"Prescription {prescription_id} not found.")

    return APIResponse(
        success=True,
        data={
            "prescription_id": rx.prescription_id,
            "status": rx.status,
            "payload_hash": rx.payload_hash,
            "total_quantity": rx.total_quantity,
            "remaining_quantity": rx.remaining_quantity,
            "qr_token": rx.qr_token,
            "issued_at": rx.issued_at,
            "expires_at": rx.expires_at,
            "revoked_at": rx.revoked_at,
            "revocation_reason": rx.revocation_reason
        }
    )

@router.post("/{prescription_id}/revoke", response_model=APIResponse)
async def revoke_prescription(
    prescription_id: str,
    req: RevokePrescriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("DOCTOR", "ORG_ADMIN"))
):
    result = await prescription_service.revoke_prescription(
        db=db,
        prescription_id=prescription_id,
        reason=req.revocation_reason,
        user=current_user
    )
    return APIResponse(success=True, data=result)
