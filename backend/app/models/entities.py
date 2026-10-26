from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    msp_id = Column(String(64), nullable=False, index=True)  # HospitalMSP, PharmacyMSP
    org_type = Column(String(32), nullable=False)            # HOSPITAL, PHARMACY, REGULATOR
    created_at = Column(DateTime(timezone=True), default=utc_now)

    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, index=True)   # DOCTOR, PHARMACIST, ORG_ADMIN, SYSTEM_ADMIN, PATIENT
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="users")
    keys = relationship("PrescriberKey", back_populates="user")

class PrescriberKey(Base):
    __tablename__ = "prescriber_keys"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    key_id = Column(String(64), unique=True, nullable=False, index=True)
    public_key_pem = Column(Text, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False) # ACTIVE, REVOKED
    created_at = Column(DateTime(timezone=True), default=utc_now)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="keys")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(64), primary_key=True) # UUID
    prescription_id = Column(String(64), unique=True, nullable=False, index=True)
    issuer_organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    prescriber_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    patient_reference_id = Column(String(64), nullable=False, index=True)
    
    status = Column(String(32), default="ISSUED", nullable=False, index=True) # ISSUED, PARTIALLY_DISPENSED, FULLY_DISPENSED, REVOKED, EXPIRED
    payload_hash = Column(String(64), nullable=False, index=True)
    signature = Column(Text, nullable=False)
    blockchain_tx_id = Column(String(128), nullable=True)
    
    total_quantity = Column(Integer, nullable=False)
    remaining_quantity = Column(Integer, nullable=False)
    allow_partial_dispense = Column(Boolean, default=True)
    
    encrypted_payload_path = Column(String(512), nullable=False)
    qr_token = Column(String(128), unique=True, nullable=False, index=True)
    
    issued_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(Text, nullable=True)

    dispense_records = relationship("DispenseRecord", back_populates="prescription")

class DispenseRecord(Base):
    __tablename__ = "dispense_records"

    id = Column(String(64), primary_key=True)
    dispense_id = Column(String(64), unique=True, nullable=False, index=True)
    prescription_id = Column(String(64), ForeignKey("prescriptions.prescription_id"), nullable=False)
    dispensed_by_user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    pharmacy_organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    
    quantity_dispensed = Column(Integer, nullable=False)
    remaining_after_dispense = Column(Integer, nullable=False)
    blockchain_tx_id = Column(String(128), nullable=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    prescription = relationship("Prescription", back_populates="dispense_records")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)
    event_type = Column(String(64), nullable=False, index=True) # ISSUANCE, VERIFICATION, DISPENSE, REVOCATION, TAMPER_ATTEMPT
    actor_id = Column(String(64), nullable=False)
    organization_id = Column(String(64), nullable=False)
    target_resource_id = Column(String(64), nullable=False, index=True)
    blockchain_tx_id = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False) # SUCCESS, FAILED, REJECTED
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(String(64), primary_key=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    operation_type = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False) # PENDING, COMMITTED, FAILED
    response_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
