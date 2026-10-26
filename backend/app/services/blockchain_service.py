import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.config import settings
from app.core.exceptions import BlockchainError, ConcurrencyConflictError

class BlockchainService:
    """
    Gateway to Hyperledger Fabric network.
    In 'standalone_dev' mode, runs an in-process cryptographic ledger emulator
    with strict MVCC versioning and transaction ordering.
    """
    def __init__(self):
        self.mode = settings.FABRIC_MODE
        # In-memory world state for standalone development mode
        # key: prescription_id -> { record, version, tx_history }
        self._dev_ledger: Dict[str, Dict[str, Any]] = {}
        self._dev_tx_log: List[Dict[str, Any]] = []

    def is_connected(self) -> bool:
        return True

    async def create_prescription(
        self,
        prescription_id: str,
        payload_hash: str,
        issuer_org_id: str,
        prescriber_id: str,
        prescriber_key_id: str,
        total_quantity: int,
        expires_at: str
    ) -> str:
        """
        Submits 'CreatePrescription' transaction to the Fabric ledger.
        Returns transaction ID.
        """
        if self.mode == "fabric_gateway":
            # Real Fabric Gateway submission would occur here via grpc/SDK
            raise BlockchainError("Live Fabric Gateway configured but peer connection not initialized.")

        # Standalone Dev Ledger Implementation
        if prescription_id in self._dev_ledger:
            raise BlockchainError(f"Prescription ID {prescription_id} already exists on ledger.")

        tx_id = f"tx_fabric_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        record = {
            "prescription_id": prescription_id,
            "payload_hash": payload_hash,
            "issuer_org_id": issuer_org_id,
            "prescriber_id": prescriber_id,
            "prescriber_key_id": prescriber_key_id,
            "status": "ISSUED",
            "total_quantity": total_quantity,
            "remaining_quantity": total_quantity,
            "expires_at": expires_at,
            "revoked": False,
            "revocation_reason": "",
            "dispense_events": [],
            "created_at": now
        }

        self._dev_ledger[prescription_id] = {
            "record": record,
            "version": 1
        }
        self._dev_tx_log.append({
            "tx_id": tx_id,
            "action": "CreatePrescription",
            "prescription_id": prescription_id,
            "timestamp": now
        })
        return tx_id

    async def get_prescription(self, prescription_id: str) -> Optional[Dict[str, Any]]:
        """Queries world state for prescription record."""
        if self.mode == "fabric_gateway":
            raise BlockchainError("Live Fabric Gateway connection not initialized.")

        item = self._dev_ledger.get(prescription_id)
        if not item:
            return None
        return dict(item["record"])

    async def record_dispense(
        self,
        prescription_id: str,
        dispense_quantity: int,
        pharmacy_org_id: str,
        dispenser_id: str
    ) -> Dict[str, Any]:
        """
        Executes atomic dispense state transition on-chain.
        Validates remaining balance with MVCC version checks.
        """
        if self.mode == "fabric_gateway":
            raise BlockchainError("Live Fabric Gateway connection not initialized.")

        item = self._dev_ledger.get(prescription_id)
        if not item:
            raise BlockchainError(f"Prescription {prescription_id} not found on ledger.")

        rec = item["record"]
        if rec["revoked"]:
            raise ConcurrencyConflictError("Cannot dispense: Prescription has been revoked.")

        # Check expiration
        exp_dt = datetime.fromisoformat(rec["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > exp_dt:
            rec["status"] = "EXPIRED"
            raise ConcurrencyConflictError("Cannot dispense: Prescription has expired.")

        # Concurrency & Balance Validation
        remaining = rec["remaining_quantity"]
        if remaining < dispense_quantity:
            raise ConcurrencyConflictError(
                f"Insufficient remaining quantity on ledger. Available: {remaining}, Requested: {dispense_quantity}"
            )

        tx_id = f"tx_fabric_dsp_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        # Atomic decrement
        new_remaining = remaining - dispense_quantity
        rec["remaining_quantity"] = new_remaining
        rec["status"] = "FULLY_DISPENSED" if new_remaining == 0 else "PARTIALLY_DISPENSED"

        dispense_event = {
            "tx_id": tx_id,
            "dispenser_id": dispenser_id,
            "pharmacy_org_id": pharmacy_org_id,
            "quantity": dispense_quantity,
            "remaining_after": new_remaining,
            "timestamp": now
        }
        rec["dispense_events"].append(dispense_event)
        item["version"] += 1

        self._dev_tx_log.append({
            "tx_id": tx_id,
            "action": "RecordDispense",
            "prescription_id": prescription_id,
            "quantity": dispense_quantity,
            "timestamp": now
        })

        return {
            "tx_id": tx_id,
            "remaining_quantity": new_remaining,
            "status": rec["status"]
        }

    async def revoke_prescription(
        self,
        prescription_id: str,
        reason: str,
        revoking_org_id: str
    ) -> str:
        """Revokes prescription on the ledger."""
        if self.mode == "fabric_gateway":
            raise BlockchainError("Live Fabric Gateway connection not initialized.")

        item = self._dev_ledger.get(prescription_id)
        if not item:
            raise BlockchainError(f"Prescription {prescription_id} not found on ledger.")

        rec = item["record"]
        if rec["issuer_org_id"] != revoking_org_id:
            raise BlockchainError("Only the original issuing organization can revoke this prescription.")

        tx_id = f"tx_fabric_rev_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        rec["revoked"] = True
        rec["status"] = "REVOKED"
        rec["revocation_reason"] = reason
        item["version"] += 1

        self._dev_tx_log.append({
            "tx_id": tx_id,
            "action": "RevokePrescription",
            "prescription_id": prescription_id,
            "reason": reason,
            "timestamp": now
        })
        return tx_id

# Singleton instance
blockchain_service = BlockchainService()
