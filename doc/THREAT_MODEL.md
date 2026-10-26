# RxGuard — Security Threat Model (STRIDE Methodology)

## 1. Threat Modeling Overview
RxGuard handles sensitive healthcare operations across distributed organizations. This document applies the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) to identify vulnerabilities, document technical mitigations, and define verification test cases.

---

## 2. STRIDE Assessment Matrix

| Threat Category | Threat Description | Severity | Impact | Mitigation Strategy in RxGuard | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates a licensed doctor to issue fraudulent prescriptions. | Critical | Fraudulent narcotics dispensing. | Mandatory ECDSA asymmetric digital signature using registered prescriber key; certificate status verified on-chain against `HospitalMSP`. | `test_unauthorized_issuer_rejected` |
| **Spoofing** | Attacker creates fake pharmacy identity to access prescription payloads. | High | Unauthorized PHI inspection. | Mutual TLS (mTLS) / JWT with Organization Claim verification; role-based check `ROLE_PHARMACIST` under `PharmacyMSP`. | `test_cross_organization_access_denied` |
| **Tampering** | Attacker alters medicine name or dosage in transit or database. | Critical | Inappropriate or lethal medication dispensed. | SHA-256 hash calculated over canonical JSON payload and anchored on-chain. If hash mismatches on-chain record, request fails closed. | `test_modified_payload_rejected` |
| **Tampering** | Man-in-the-Middle changes ciphertext in off-chain store. | High | Corruption of clinical records. | Authenticated AES-256-GCM encryption with 128-bit authentication tag; tampering causes decryption exception. | `test_tampered_ciphertext_fails_auth_tag` |
| **Repudiation** | Doctor denies having issued an authorized prescription. | Medium | Legal and regulatory disputes. | Non-repudiation via digital signature anchored to doctor's registered public key and timestamped on immutable Fabric ledger. | `test_signature_verification_audit_trail` |
| **Repudiation** | Pharmacy claims it never dispensed a prescription. | High | Unaccounted controlled substances. | Dispense transaction requires pharmacy cryptographic signature and creates an immutable chaincode `DispenseEvent`. | `test_dispense_event_immutable_log` |
| **Information Disclosure** | QR code exposed or photographed in public reveals patient diagnosis. | High | Violation of patient privacy (HIPAA/GDPR). | QR code contains ONLY an opaque UUID reference token (`rx_id`) and temporary presentation HMAC. Zero plaintext PHI in QR code. | `test_qr_code_contains_no_phi` |
| **Information Disclosure** | Database dump exposes patient health records. | Critical | Massive healthcare data breach. | All prescription payloads stored off-chain are encrypted at rest using AES-256-GCM with separate key management. | `test_payload_stored_encrypted_at_rest` |
| **Denial of Service** | Concurrent pharmacy requests exhaust remaining quantity twice. | Critical | Double-dispensing of medicine. | Fabric MVCC transaction versioning + database-level row locking (`SELECT FOR UPDATE`) and unique idempotency keys. | `test_concurrent_double_dispense_race` |
| **Denial of Service** | Malicious bot spams QR verification endpoint. | Medium | API degradation. | Rate limiting per IP and authenticated API client (e.g. 100 req/min with token bucket). | `test_rate_limiting_enforced` |
| **Elevation of Privilege** | Normal user or patient escalates role to Pharmacist or Admin. | High | Unauthorized dispensing / user creation. | Strict server-side RBAC enforcement; role claims validated cryptographically on every request. | `test_privilege_escalation_blocked` |

---

## 3. Specific Attack Vector Analyses

### 3.1 Replay Attacks on Dispensing
- **Attack:** An attacker captures a legitimate dispensing API request and resubmits it repeatedly.
- **Mitigation:**
  1. Every dispense request requires an `idempotency_key` (UUIDv4) and a monotonic timestamp window (TTL: 5 minutes).
  2. The server records the `idempotency_key` in a unique PostgreSQL constraint table.
  3. Replayed requests return the cached result of the original operation without re-invoking the blockchain ledger.

### 3.2 Key Compromise & Revocation
- **Attack:** A doctor's signing key is compromised or a doctor is terminated from the hospital.
- **Mitigation:**
  1. `HospitalMSP` admin executes `RevokeIssuerKey(key_id, reason)` on-chain.
  2. Prescriptions issued *after* the revocation timestamp are rejected during verification.
  3. Prescriptions issued *before* revocation maintain a valid audit trail, but flagged for secondary clinical review if needed.

### 3.3 Blockchain Ledger Outage (Fail-Closed Architecture)
- **Principle:** If the Fabric Gateway or peer nodes are temporarily unreachable, the system must **FAIL CLOSED**.
- **Rule:** The API will **never** fall back to an unverified local database cache to authorize dispensing. It returns `503 Service Unavailable: Blockchain Ledger Unreachable. Cannot Authorize Dispensing.`
