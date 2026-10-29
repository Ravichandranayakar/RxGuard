import asyncio
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db.session import engine, Base, AsyncSessionLocal
from app.db.seed import seed_initial_data
from app.models.entities import User
from app.services.prescription_service import prescription_service
from app.services.dispensing_engine import dispensing_engine
from app.schemas.domain import CreatePrescriptionRequest, PrescriptionItemSchema, DispenseRequest
from app.core.exceptions import TamperingDetectedError, ConcurrencyConflictError
from sqlalchemy import select

async def run_e2e():
    print("=" * 70)
    print("RXGUARD END-TO-END VERIFICATION & SECURITY TEST SUITE")
    print("=" * 70)

    # 1. Initialize & Seed DB
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

    async with AsyncSessionLocal() as db:
        # Fetch Doctor and Pharmacist users
        doc_res = await db.execute(select(User).where(User.role == "DOCTOR"))
        doctor = doc_res.scalars().first()
        pharm_res = await db.execute(select(User).where(User.role == "PHARMACIST"))
        pharmacist = pharm_res.scalars().first()

        print(f"\n[STEP 1] Prescriber Issuance Test")
        print(f"Doctor: {doctor.name} ({doctor.organization_id})")

        create_req = CreatePrescriptionRequest(
            patient_reference_id="PAT-TEST-001",
            patient_name="Synthetic Patient Alice",
            patient_dob="1992-05-15",
            expires_in_days=30,
            total_authorized_quantity=30,
            allow_partial_dispense=True,
            items=[
                PrescriptionItemSchema(
                    medication_code="NDC-0069-4200",
                    medication_name="Amoxicillin 500mg",
                    quantity=30,
                    dosage="500mg",
                    frequency="Three times daily"
                )
            ]
        )

        issued = await prescription_service.create_prescription(db, create_req, doctor)
        rx_id = issued["prescription_id"]
        qr_token = issued["qr_verification_token"]
        print(f"  -> Prescription Issued: {rx_id}")
        print(f"  -> Payload Hash: {issued['payload_hash']}")
        print(f"  -> Ledger Tx ID: {issued['blockchain_tx_id']}")
        print(f"  -> QR Token: {qr_token}")

        print(f"\n[STEP 2] Pharmacy Cryptographic Verification")
        print(f"Pharmacist: {pharmacist.name} ({pharmacist.organization_id})")
        verified = await prescription_service.verify_prescription(db, qr_token, pharmacist)
        assert verified["is_authentic"] is True
        assert verified["remaining_quantity"] == 30
        print(f"  -> Authenticity: {verified['is_authentic']} (Hash & Digital Signature Valid)")
        print(f"  -> Authoritative Ledger Balance: {verified['remaining_quantity']} / {verified['total_quantity']}")

        print(f"\n[STEP 3] Atomic Partial Dispensing (10 of 30 units)")
        dispense_req_1 = DispenseRequest(
            prescription_id=rx_id,
            dispense_quantity=10,
            idempotency_key=f"idemp-test-1-{uuid.uuid4().hex[:6]}"
        )
        disp_res_1 = await dispensing_engine.process_dispense(db, dispense_req_1, pharmacist)
        assert disp_res_1["remaining_quantity"] == 20
        assert disp_res_1["status"] == "PARTIALLY_DISPENSED"
        print(f"  -> Dispensed: 10 units")
        print(f"  -> Remaining Balance on Ledger: {disp_res_1['remaining_quantity']} units")
        print(f"  -> Status: {disp_res_1['status']}")

        print(f"\n[STEP 4] Completing Full Dispensing (Remaining 20 units)")
        dispense_req_2 = DispenseRequest(
            prescription_id=rx_id,
            dispense_quantity=20,
            idempotency_key=f"idemp-test-2-{uuid.uuid4().hex[:6]}"
        )
        disp_res_2 = await dispensing_engine.process_dispense(db, dispense_req_2, pharmacist)
        assert disp_res_2["remaining_quantity"] == 0
        assert disp_res_2["status"] == "FULLY_DISPENSED"
        print(f"  -> Dispensed: 20 units")
        print(f"  -> Remaining Balance on Ledger: {disp_res_2['remaining_quantity']} units")
        print(f"  -> Status: {disp_res_2['status']}")

        print(f"\n[STEP 5] Negative Test: Prevent Double-Dispensing (Attempt 5 units)")
        dispense_req_3 = DispenseRequest(
            prescription_id=rx_id,
            dispense_quantity=5,
            idempotency_key=f"idemp-test-3-{uuid.uuid4().hex[:6]}"
        )
        try:
            await dispensing_engine.process_dispense(db, dispense_req_3, pharmacist)
            print("  -> ERROR: Over-dispense was NOT rejected!")
            sys.exit(1)
        except ConcurrencyConflictError as e:
            print(f"  -> SUCCESS: Double-dispense blocked by policy: {e.message}")

    print("\n" + "=" * 70)
    print("ALL CORE SECURITY & INTEGRITY VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_e2e())
