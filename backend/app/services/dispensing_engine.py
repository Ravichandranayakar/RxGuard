import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.exceptions import (
    NotFoundError, ConcurrencyConflictError, AuthorizationError
)
from app.models.entities import (
    Prescription, DispenseRecord, IdempotencyRecord, AuditEvent, User
)
from app.schemas.domain import DispenseRequest
from app.services.blockchain_service import blockchain_service

class DispensingEngine:
    async def process_dispense(
        self,
        db: AsyncSession,
        req: DispenseRequest,
        pharmacist_user: User
    ) -> Dict[str, Any]:
        """
        Processes dispensing with concurrency protection:
        1. Check idempotency record to prevent duplicate replay.
        2. Validate prescription exists and is in dispensable state.
        3. Execute atomic state transition on blockchain ledger.
        4. Record off-chain dispense audit and idempotency outcome.
        """
        # Role check
        if pharmacist_user.role not in ["PHARMACIST", "SYSTEM_ADMIN"]:
            raise AuthorizationError("Only licensed pharmacists may record prescription dispensing.")

        # 1. Idempotency Check
        idemp_stmt = select(IdempotencyRecord).where(
            IdempotencyRecord.idempotency_key == req.idempotency_key
        )
        idemp_res = await db.execute(idemp_stmt)
        existing_idemp = idemp_res.scalar_one_or_none()

        if existing_idemp:
            if existing_idemp.status == "COMMITTED" and existing_idemp.response_json:
                # Return previously committed response (safe idempotent retry)
                return json.loads(existing_idemp.response_json)
            elif existing_idemp.status == "PENDING":
                raise ConcurrencyConflictError("A dispensing operation with this idempotency key is currently in progress.")

        # Create PENDING idempotency record
        idemp_record = IdempotencyRecord(
            id=str(uuid.uuid4()),
            idempotency_key=req.idempotency_key,
            operation_type="DISPENSE",
            status="PENDING"
        )
        db.add(idemp_record)
        await db.flush()

        # 2. Check local database prescription record
        rx_stmt = select(Prescription).where(
            Prescription.prescription_id == req.prescription_id
        ).with_for_update() # Row lock in PostgreSQL
        rx_res = await db.execute(rx_stmt)
        rx = rx_res.scalar_one_or_none()

        if not rx:
            idemp_record.status = "FAILED"
            await db.commit()
            raise NotFoundError(f"Prescription {req.prescription_id} not found.")

        if rx.status in ["FULLY_DISPENSED", "REVOKED", "EXPIRED"]:
            idemp_record.status = "FAILED"
            await db.commit()
            raise ConcurrencyConflictError(f"Prescription cannot be dispensed. Current status: {rx.status}")

        if not rx.allow_partial_dispense and req.dispense_quantity < rx.total_quantity:
            idemp_record.status = "FAILED"
            await db.commit()
            raise ConcurrencyConflictError("Partial dispensing is not permitted for this prescription.")

        # 3. Execute authoritative transaction on Blockchain Ledger
        try:
            blockchain_result = await blockchain_service.record_dispense(
                prescription_id=rx.prescription_id,
                dispense_quantity=req.dispense_quantity,
                pharmacy_org_id=pharmacist_user.organization.msp_id,
                dispenser_id=pharmacist_user.id
            )
        except Exception as e:
            idemp_record.status = "FAILED"
            await db.commit()
            raise e

        # 4. Synchronize Off-Chain Relational State
        dispense_id = f"dsp-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)
        new_remaining = blockchain_result["remaining_quantity"]
        new_status = blockchain_result["status"]
        tx_id = blockchain_result["tx_id"]

        rx.remaining_quantity = new_remaining
        rx.status = new_status

        dispense_record = DispenseRecord(
            id=str(uuid.uuid4()),
            dispense_id=dispense_id,
            prescription_id=rx.prescription_id,
            dispensed_by_user_id=pharmacist_user.id,
            pharmacy_organization_id=pharmacist_user.organization_id,
            quantity_dispensed=req.dispense_quantity,
            remaining_after_dispense=new_remaining,
            blockchain_tx_id=tx_id,
            idempotency_key=req.idempotency_key,
            timestamp=now
        )
        db.add(dispense_record)

        # Audit Event
        audit = AuditEvent(
            id=str(uuid.uuid4()),
            event_type="DISPENSE",
            actor_id=pharmacist_user.id,
            organization_id=pharmacist_user.organization_id,
            target_resource_id=rx.prescription_id,
            blockchain_tx_id=tx_id,
            status="SUCCESS",
            details=f"Dispensed {req.dispense_quantity} units. Remaining: {new_remaining}."
        )
        db.add(audit)

        response_payload = {
            "dispense_id": dispense_id,
            "prescription_id": rx.prescription_id,
            "status": new_status,
            "dispensed_quantity": req.dispense_quantity,
            "remaining_quantity": new_remaining,
            "blockchain_tx_id": tx_id,
            "timestamp": now.isoformat()
        }

        # Finalize idempotency state
        idemp_record.status = "COMMITTED"
        idemp_record.response_json = json.dumps(response_payload)

        await db.commit()

        # Parse ISO string back to datetime for schema compatibility
        return {
            "dispense_id": dispense_id,
            "prescription_id": rx.prescription_id,
            "status": new_status,
            "dispensed_quantity": req.dispense_quantity,
            "remaining_quantity": new_remaining,
            "blockchain_tx_id": tx_id,
            "timestamp": now
        }

dispensing_engine = DispensingEngine()
