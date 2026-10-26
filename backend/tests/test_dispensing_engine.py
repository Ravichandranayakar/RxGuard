import pytest
import uuid
from app.services.blockchain_service import BlockchainService
from app.core.exceptions import ConcurrencyConflictError

@pytest.mark.asyncio
async def test_blockchain_atomic_dispensing():
    bc = BlockchainService()
    rx_id = str(uuid.uuid4())
    total_qty = 30
    
    # 1. Register prescription on ledger
    tx1 = await bc.create_prescription(
        prescription_id=rx_id,
        payload_hash="samplehash123",
        issuer_org_id="HospitalMSP",
        prescriber_id="doc-1",
        prescriber_key_id="key-1",
        total_quantity=total_qty,
        expires_at="2099-01-01T00:00:00Z"
    )
    assert tx1.startswith("tx_fabric_")

    # 2. Dispense partial quantity (10 units)
    res1 = await bc.record_dispense(
        prescription_id=rx_id,
        dispense_quantity=10,
        pharmacy_org_id="PharmacyMSP",
        dispenser_id="pharm-1"
    )
    assert res1["remaining_quantity"] == 20
    assert res1["status"] == "PARTIALLY_DISPENSED"

    # 3. Dispense remaining balance (20 units)
    res2 = await bc.record_dispense(
        prescription_id=rx_id,
        dispense_quantity=20,
        pharmacy_org_id="PharmacyMSP",
        dispenser_id="pharm-1"
    )
    assert res2["remaining_quantity"] == 0
    assert res2["status"] == "FULLY_DISPENSED"

    # 4. Attempt to dispense again when balance is 0 -> Must raise ConcurrencyConflictError
    with pytest.raises(ConcurrencyConflictError):
        await bc.record_dispense(
            prescription_id=rx_id,
            dispense_quantity=5,
            pharmacy_org_id="PharmacyMSP",
            dispenser_id="pharm-2"
        )
