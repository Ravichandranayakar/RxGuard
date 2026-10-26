# RxGuard — REST API Contracts (`/api/v1`)

## 1. Global Standards & Conventions
- **Base URL:** `/api/v1`
- **Content-Type:** `application/json; charset=utf-8`
- **Standard Error Envelope:**
```json
{
  "success": false,
  "error": {
    "code": "PRESCRIPTION_TAMPERED",
    "message": "Payload hash mismatch. The prescription content has been altered.",
    "request_id": "req-9b823-c48f"
  }
}
```

---

## 2. Authentication & Identity (`/auth`)

### POST `/api/v1/auth/login`
- **Description:** Authenticate user and obtain short-lived JWT token + user profile.
- **Request:**
```json
{
  "username": "dr.smith@metrohealth.org",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "user_id": "usr-101",
      "name": "Dr. Sarah Smith",
      "email": "dr.smith@metrohealth.org",
      "role": "DOCTOR",
      "organization_id": "ORG-HOSP-01",
      "organization_name": "Metro General Hospital",
      "msp_id": "HospitalMSP"
    }
  }
}
```

---

## 3. Prescriptions (`/prescriptions`)

### POST `/api/v1/prescriptions`
- **Role:** `DOCTOR`
- **Description:** Create, canonicalize, sign, encrypt, and record a new prescription.
- **Request:**
```json
{
  "patient_reference_id": "PAT-88412",
  "patient_name": "Jane Doe",
  "patient_dob": "1988-04-12",
  "expires_in_days": 30,
  "total_authorized_quantity": 30,
  "allow_partial_dispense": true,
  "items": [
    {
      "medication_code": "NDC-0069-4200",
      "medication_name": "Amoxicillin 500mg",
      "quantity": 30,
      "dosage": "500mg",
      "frequency": "Three times daily with food"
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
    "status": "ISSUED",
    "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchain_tx_id": "tx_fabric_9f81a7b32c",
    "qr_verification_token": "RXG-7F8B9E12-TOKEN",
    "created_at": "2026-10-26T12:00:00Z"
  }
}
```

### POST `/api/v1/prescriptions/{rx_id}/revoke`
- **Role:** `DOCTOR` / `ORG_ADMIN`
- **Description:** Revoke an active prescription.
- **Request:**
```json
{
  "revocation_reason": "Patient adverse drug reaction reported"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
    "status": "REVOKED",
    "blockchain_tx_id": "tx_fabric_rev_77a2",
    "revoked_at": "2026-10-26T14:30:00Z"
  }
}
```

---

## 4. Pharmacy Verification & Dispensing (`/pharmacy`)

### GET `/api/v1/pharmacy/verify/{token_or_id}`
- **Role:** `PHARMACIST`
- **Description:** Verify authenticity, on-chain state, issuer authority, and remaining dispensable balance.
- **Response (200 OK - Valid):**
```json
{
  "success": true,
  "data": {
    "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
    "is_authentic": true,
    "status": "ISSUED",
    "total_quantity": 30,
    "remaining_quantity": 30,
    "issuer": {
      "prescriber_name": "Dr. Sarah Smith",
      "hospital_name": "Metro General Hospital",
      "key_status": "ACTIVE"
    },
    "medications": [
      {
        "medication_name": "Amoxicillin 500mg",
        "dosage": "500mg",
        "frequency": "Three times daily with food"
      }
    ],
    "expires_at": "2026-11-26T12:00:00Z"
  }
}
```

### POST `/api/v1/pharmacy/dispense`
- **Role:** `PHARMACIST`
- **Description:** Concurrency-safe atomic dispense request.
- **Request:**
```json
{
  "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
  "dispense_quantity": 15,
  "idempotency_key": "idemp-pharm-101-99842"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dispense_id": "dsp-55214",
    "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
    "status": "PARTIALLY_DISPENSED",
    "dispensed_quantity": 15,
    "remaining_quantity": 15,
    "blockchain_tx_id": "tx_fabric_dsp_8819",
    "timestamp": "2026-10-26T15:00:00Z"
  }
}
```

---

## 5. Audit & System Health (`/audit`, `/system`)

### GET `/api/v1/audit/events/{rx_id}`
- **Role:** `AUDITOR`, `DOCTOR`, `ORG_ADMIN`
- **Description:** Retrieve verifiable lifecycle events (Issuance, Verification, Dispense, Revocation).

### GET `/api/v1/system/health`
- **Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "components": {
    "api": "OK",
    "database": "OK",
    "blockchain_gateway": "CONNECTED",
    "storage": "OK"
  },
  "timestamp": "2026-10-26T20:00:00Z"
}
```
