# RxGuard — Data Flow Specification

## 1. End-to-End Prescription Lifecycle Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Doc as Doctor (HospitalMSP)
    participant Front as Doctor Portal (React)
    participant API as RxGuard API (FastAPI)
    participant Crypto as Cryptographic Engine
    participant DB as PostgreSQL
    participant Store as Encrypted Store
    participant Fabric as Hyperledger Fabric
    actor Pharm as Pharmacist (PharmacyMSP)

    Note over Doc,Fabric: 1. PRESCRIPTION ISSUANCE
    Doc->>Front: Enter Patient & Medication Data
    Front->>API: POST /api/v1/prescriptions (Payload)
    API->>Crypto: Compute Canonical JSON & SHA-256 Hash
    API->>Crypto: Sign Hash with Doctor Private Key
    API->>Crypto: Encrypt Payload with AES-256-GCM
    API->>Store: Persist Encrypted Payload (Ciphertext, Nonce, Tag)
    API->>Fabric: Invoke CreatePrescription(id, hash, issuer_id, total_qty, expiry)
    Fabric-->>API: Transaction Committed (TxID)
    API->>DB: Insert Prescription Metadata & Tx Reference
    API-->>Front: Return Prescription Reference & QR Token

    Note over Pharm,Fabric: 2. PHARMACY VERIFICATION
    Pharm->>Front: Scan Prescription QR Token
    Front->>API: GET /api/v1/pharmacy/verify/{rx_id}
    API->>Fabric: Query GetPrescriptionStatus(rx_id)
    Fabric-->>API: Return On-Chain State (Hash, Status, Balance, Expiry)
    API->>Store: Retrieve Encrypted Payload
    API->>Crypto: Decrypt Payload & Recompute SHA-256 Hash
    API->>Crypto: Compare Computed Hash with On-Chain Hash
    API->>Crypto: Verify Doctor Signature against Public Key
    alt Hash Matches AND Signature Valid AND Status == ISSUED / PARTIALLY_DISPENSED
        API-->>Front: 200 OK (Verified True, Remaining Balance, Clinical Instructions)
    else Hash Mismatch OR Expired OR Revoked
        API-->>Front: 400/409 Rejection with Cryptographic Failure Reason
    end

    Note over Pharm,Fabric: 3. ATOMIC DISPENSING
    Pharm->>Front: Enter Dispensing Quantity (e.g., 10 units)
    Front->>API: POST /api/v1/pharmacy/dispense (rx_id, qty, idemp_key)
    API->>DB: Check & Record Idempotency Key
    API->>Fabric: Invoke RecordDispense(rx_id, qty, pharmacy_id)
    Fabric->>Fabric: Validate Remaining Balance >= qty
    Fabric->>Fabric: Decrement Balance & Update Status
    Fabric-->>API: Transaction Committed (TxID)
    API->>DB: Record Dispense Audit Record
    API-->>Front: 200 OK (Dispensed Successfully, New Remaining Balance)
```

---

## 2. Canonical Prescription Payload Schema

Before hashing and digital signing, the prescription must conform to the following schema and be serialized deterministically:

```json
{
  "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
  "schema_version": "1.0",
  "issuer_organization_id": "ORG-HOSPITAL-01",
  "prescriber_id": "DOC-99482",
  "prescriber_public_key_id": "KEY-DOC-99482-V1",
  "patient_reference_id": "PAT-REF-88319",
  "issued_at": "2026-10-26T12:00:00Z",
  "expires_at": "2026-11-26T12:00:00Z",
  "total_authorized_quantity": 30,
  "allow_partial_dispense": true,
  "max_refills": 1,
  "items": [
    {
      "item_id": "MED-001",
      "medication_code": "NDC-0069-4200",
      "medication_name": "Amoxicillin 500mg",
      "quantity": 30,
      "dosage": "500mg",
      "frequency": "Three times daily with food",
      "duration_days": 10
    }
  ]
}
```

---

## 3. On-Chain Ledger State Schema (Hyperledger Fabric World State)

```json
{
  "doc_type": "prescription_record",
  "prescription_id": "7f8b9e12-3456-4abc-9def-0123456789ab",
  "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "issuer_organization_id": "HospitalMSP",
  "prescriber_id": "DOC-99482",
  "prescriber_public_key_id": "KEY-DOC-99482-V1",
  "status": "ISSUED",
  "issued_at": "2026-10-26T12:00:00Z",
  "expires_at": "2026-11-26T12:00:00Z",
  "total_authorized_quantity": 30,
  "remaining_quantity": 30,
  "revoked": false,
  "revocation_reason": "",
  "dispense_events": []
}
```
