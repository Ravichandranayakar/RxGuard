import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.core.crypto import CryptoEngine
from app.core.exceptions import (
    NotFoundError, AuthorizationError, TamperingDetectedError, ConcurrencyConflictError
)
from app.models.entities import Prescription, PrescriberKey, User, Organization, AuditEvent
from app.schemas.domain import CreatePrescriptionRequest
from app.services.blockchain_service import blockchain_service
from app.services.encrypted_storage import encrypted_storage_service

class PrescriptionService:
    def __init__(self):
        self.master_key = settings.MASTER_ENCRYPTION_KEY.encode('utf-8')[:32].ljust(32, b'0')

    async def create_prescription(
        self,
        db: AsyncSession,
        req: CreatePrescriptionRequest,
        doctor_user: User,
        doctor_private_key_pem: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Issues, canonicalizes, signs, encrypts, and records a new prescription.
        """
        # 1. Fetch or generate prescriber signing key
        key_stmt = select(PrescriberKey).where(
            PrescriberKey.user_id == doctor_user.id,
            PrescriberKey.status == "ACTIVE"
        )
        res = await db.execute(key_stmt)
        key_record = res.scalar_one_or_none()

        if not key_record or not doctor_private_key_pem:
            # Generate deterministic keypair for testing/doctor session
            priv_pem, pub_pem = CryptoEngine.generate_ecdsa_keypair()
            doctor_private_key_pem = priv_pem
            key_id = f"KEY-{doctor_user.id[:8]}-V1"
            key_record = PrescriberKey(
                id=str(uuid.uuid4()),
                user_id=doctor_user.id,
                key_id=key_id,
                public_key_pem=pub_pem,
                status="ACTIVE"
            )
            db.add(key_record)
            await db.flush()

        rx_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=req.expires_in_days)

        # 2. Build Canonical Payload Dictionary
        canonical_dict = {
            "prescription_id": rx_id,
            "schema_version": "1.0",
            "issuer_organization_id": doctor_user.organization_id,
            "prescriber_id": doctor_user.id,
            "prescriber_public_key_id": key_record.key_id,
            "patient_reference_id": req.patient_reference_id,
            "issued_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "total_authorized_quantity": req.total_authorized_quantity,
            "allow_partial_dispense": req.allow_partial_dispense,
            "items": [item.model_dump() for item in req.items]
        }

        # 3. Canonical Bytes and SHA-256 Hash
        canonical_bytes = CryptoEngine.canonical_json_bytes(canonical_dict)
        payload_hash = CryptoEngine.sha256_hash(canonical_bytes)

        # 4. Asymmetric Digital Signature
        signature_b64 = CryptoEngine.sign_hash(doctor_private_key_pem, payload_hash)

        # 5. Off-chain Encrypted Payload (includes sensitive patient name and DOB)
        sensitive_clinical_bundle = {
            "canonical_payload": canonical_dict,
            "patient_name": req.patient_name,
            "patient_dob": req.patient_dob,
            "signature": signature_b64
        }
        encrypted_envelope = CryptoEngine.encrypt_aes_gcm(
            self.master_key,
            json.dumps(sensitive_clinical_bundle),
            associated_data=rx_id
        )
        saved_path = encrypted_storage_service.save_envelope(rx_id, encrypted_envelope)

        # 6. Register on Blockchain Ledger
        tx_id = await blockchain_service.create_prescription(
            prescription_id=rx_id,
            payload_hash=payload_hash,
            issuer_org_id=doctor_user.organization.msp_id,
            prescriber_id=doctor_user.id,
            prescriber_key_id=key_record.key_id,
            total_quantity=req.total_authorized_quantity,
            expires_at=expires_at.isoformat()
        )

        # 7. Record in Relational Database
        qr_token = f"RXG-{rx_id[:8].upper()}-{uuid.uuid4().hex[:6].upper()}"
        prescription_model = Prescription(
            id=str(uuid.uuid4()),
            prescription_id=rx_id,
            issuer_organization_id=doctor_user.organization_id,
            prescriber_id=doctor_user.id,
            patient_reference_id=req.patient_reference_id,
            status="ISSUED",
            payload_hash=payload_hash,
            signature=signature_b64,
            blockchain_tx_id=tx_id,
            total_quantity=req.total_authorized_quantity,
            remaining_quantity=req.total_authorized_quantity,
            allow_partial_dispense=req.allow_partial_dispense,
            encrypted_payload_path=saved_path,
            qr_token=qr_token,
            issued_at=now,
            expires_at=expires_at
        )
        db.add(prescription_model)

        # 8. Audit Event
        audit = AuditEvent(
            id=str(uuid.uuid4()),
            event_type="ISSUANCE",
            actor_id=doctor_user.id,
            organization_id=doctor_user.organization_id,
            target_resource_id=rx_id,
            blockchain_tx_id=tx_id,
            status="SUCCESS",
            details=f"Prescription created with {req.total_authorized_quantity} units authorized."
        )
        db.add(audit)
        await db.commit()

        return {
            "prescription_id": rx_id,
            "status": "ISSUED",
            "payload_hash": payload_hash,
            "blockchain_tx_id": tx_id,
            "qr_verification_token": qr_token,
            "created_at": now
        }

    async def verify_prescription(
        self,
        db: AsyncSession,
        token_or_id: str,
        pharmacist_user: User
    ) -> Dict[str, Any]:
        """
        Verifies prescription authenticity by checking on-chain state,
        re-computing payload hash, and validating digital signature.
        """
        # Find prescription by ID or QR token
        stmt = select(Prescription).where(
            (Prescription.prescription_id == token_or_id) | (Prescription.qr_token == token_or_id)
        )
        res = await db.execute(stmt)
        rx = res.scalar_one_or_none()
        if not rx:
            raise NotFoundError(f"Prescription with reference '{token_or_id}' was not found.")

        # Query authoritative state from blockchain
        onchain_state = await blockchain_service.get_prescription(rx.prescription_id)
        if not onchain_state:
            raise NotFoundError("Prescription reference does not exist on blockchain ledger.")

        # Load off-chain encrypted envelope
        envelope = encrypted_storage_service.load_envelope(rx.prescription_id)
        decrypted_json_str = CryptoEngine.decrypt_aes_gcm(self.master_key, envelope)
        clinical_bundle = json.loads(decrypted_json_str)

        canonical_payload = clinical_bundle["canonical_payload"]
        canonical_bytes = CryptoEngine.canonical_json_bytes(canonical_payload)
        recomputed_hash = CryptoEngine.sha256_hash(canonical_bytes)

        # Tamper Check 1: Computed hash vs On-chain Hash
        if recomputed_hash != onchain_state["payload_hash"]:
            audit = AuditEvent(
                id=str(uuid.uuid4()),
                event_type="TAMPER_ATTEMPT",
                actor_id=pharmacist_user.id,
                organization_id=pharmacist_user.organization_id,
                target_resource_id=rx.prescription_id,
                status="REJECTED",
                details=f"Tampering detected! Recomputed hash {recomputed_hash} != On-chain hash {onchain_state['payload_hash']}"
            )
            db.add(audit)
            await db.commit()
            raise TamperingDetectedError("Prescription payload hash does not match registered ledger hash. Tampering detected!")

        # Verify Prescriber Signature
        key_stmt = select(PrescriberKey).where(PrescriberKey.user_id == rx.prescriber_id)
        key_res = await db.execute(key_stmt)
        key_record = key_res.scalars().first()

        is_sig_valid = False
        if key_record:
            is_sig_valid = CryptoEngine.verify_signature(
                key_record.public_key_pem,
                recomputed_hash,
                rx.signature
            )

        if not is_sig_valid:
            raise TamperingDetectedError("Digital signature verification failed! Prescriber identity could not be verified.")

        # Check Revocation & Expiration
        if onchain_state.get("revoked", False):
            raise ConcurrencyConflictError(f"Prescription has been revoked: {onchain_state.get('revocation_reason', 'No reason specified')}")

        exp_dt = datetime.fromisoformat(onchain_state["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > exp_dt:
            raise ConcurrencyConflictError("Prescription has expired.")

        # Log Verification Audit
        audit = AuditEvent(
            id=str(uuid.uuid4()),
            event_type="VERIFICATION",
            actor_id=pharmacist_user.id,
            organization_id=pharmacist_user.organization_id,
            target_resource_id=rx.prescription_id,
            status="SUCCESS",
            details="Cryptographic verification and ledger check succeeded."
        )
        db.add(audit)
        await db.commit()

        return {
            "prescription_id": rx.prescription_id,
            "is_authentic": True,
            "status": onchain_state["status"],
            "total_quantity": onchain_state["total_quantity"],
            "remaining_quantity": onchain_state["remaining_quantity"],
            "issuer": {
                "prescriber_id": rx.prescriber_id,
                "hospital_org": onchain_state["issuer_org_id"],
                "key_id": onchain_state["prescriber_key_id"]
            },
            "medications": canonical_payload.get("items", []),
            "expires_at": exp_dt,
            "tamper_status": "VERIFIED_INTEGRITY"
        }

    async def revoke_prescription(
        self,
        db: AsyncSession,
        prescription_id: str,
        reason: str,
        user: User
    ) -> Dict[str, Any]:
        stmt = select(Prescription).where(Prescription.prescription_id == prescription_id)
        res = await db.execute(stmt)
        rx = res.scalar_one_or_none()
        if not rx:
            raise NotFoundError(f"Prescription {prescription_id} not found.")

        # Authorize: Must be issuing doctor or hospital admin
        if user.role != "SYSTEM_ADMIN" and rx.prescriber_id != user.id and rx.issuer_organization_id != user.organization_id:
            raise AuthorizationError("Only the original issuing prescriber or hospital admin can revoke this prescription.")

        tx_id = await blockchain_service.revoke_prescription(
            prescription_id,
            reason,
            user.organization.msp_id
        )

        rx.status = "REVOKED"
        rx.revoked_at = datetime.now(timezone.utc)
        rx.revocation_reason = reason

        audit = AuditEvent(
            id=str(uuid.uuid4()),
            event_type="REVOCATION",
            actor_id=user.id,
            organization_id=user.organization_id,
            target_resource_id=prescription_id,
            blockchain_tx_id=tx_id,
            status="SUCCESS",
            details=f"Prescription revoked: {reason}"
        )
        db.add(audit)
        await db.commit()

        return {
            "prescription_id": prescription_id,
            "status": "REVOKED",
            "blockchain_tx_id": tx_id,
            "revoked_at": rx.revoked_at
        }

prescription_service = PrescriptionService()
