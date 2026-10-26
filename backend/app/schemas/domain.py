from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr

# Base Response Envelope
class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    organization_id: str
    organization_name: str
    msp_id: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile

# Prescription Schemas
class PrescriptionItemSchema(BaseModel):
    medication_code: str
    medication_name: str
    quantity: int = Field(gt=0)
    dosage: str
    frequency: str
    duration_days: Optional[int] = None

class CreatePrescriptionRequest(BaseModel):
    patient_reference_id: str
    patient_name: str
    patient_dob: str
    expires_in_days: int = Field(default=30, gt=0, le=365)
    total_authorized_quantity: int = Field(gt=0)
    allow_partial_dispense: bool = True
    items: List[PrescriptionItemSchema]

class PrescriptionCreatedData(BaseModel):
    prescription_id: str
    status: str
    payload_hash: str
    blockchain_tx_id: Optional[str] = None
    qr_verification_token: str
    created_at: datetime

class RevokePrescriptionRequest(BaseModel):
    revocation_reason: str = Field(min_length=3)

# Pharmacy Verification & Dispense Schemas
class PharmacyVerifyResponseData(BaseModel):
    prescription_id: str
    is_authentic: bool
    status: str
    total_quantity: int
    remaining_quantity: int
    issuer: Dict[str, Any]
    medications: List[Dict[str, Any]]
    expires_at: datetime
    tamper_status: str

class DispenseRequest(BaseModel):
    prescription_id: str
    dispense_quantity: int = Field(gt=0)
    idempotency_key: str = Field(min_length=8)

class DispenseResponseData(BaseModel):
    dispense_id: str
    prescription_id: str
    status: str
    dispensed_quantity: int
    remaining_quantity: int
    blockchain_tx_id: Optional[str] = None
    timestamp: datetime

# Audit & Health
class AuditEventSchema(BaseModel):
    id: str
    event_type: str
    actor_id: str
    organization_id: str
    target_resource_id: str
    blockchain_tx_id: Optional[str] = None
    status: str
    details: Optional[str] = None
    timestamp: datetime

class HealthCheckResponse(BaseModel):
    status: str
    components: Dict[str, str]
    timestamp: datetime
