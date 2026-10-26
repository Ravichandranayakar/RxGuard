# RxGuard — Implementation Plan & Milestone Tracker

## Project Overview
**RxGuard: A Blockchain-Based Prescription Verification and Dispensing System**
- **Architecture Standard:** Silicon Valley Enterprise Grade (Clean Architecture, Typed Safety, Defense-in-Depth).
- **Core Principle:** Blockchain is the shared verification and audit ledger; sensitive patient medical records remain off-chain, encrypted with AES-256-GCM.

---

## Environment & Dependency Audit (Phase 0)

| Tool / Subsystem | Detected State | Status | Impact / Strategy |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (PowerShell) | Verified | PowerShell scripts provided alongside POSIX bash scripts (`scripts/bootstrap.ps1`, `scripts/bootstrap.sh`). |
| **Git Version Control** | `git 2.56.0` on `main` branch | Active & Clean | Strict branching model (`feature/*`), clear atomic commits, no secret tracking. |
| **Docker Engine** | Docker CLI 28.5.1 present, Desktop Daemon stopped | Stopped | Provide full multi-stage Dockerfiles + `docker-compose.yml` for zero-friction containerized deployment. |
| **Hyperledger Fabric** | Not pre-installed locally | Requires Setup / Containerization | Go chaincode authored to standard Fabric contract API; network bootstrap scripts provided for official Fabric test-network / dockerized deployment. |
| **Python Tooling** | Not in host system PATH | Containerized / VirtualEnv | Use standard FastAPI, SQLAlchemy 2.0, Pydantic v2, cryptography, pytest inside containerized & local venv workflows. |
| **Node.js / Frontend** | Not in host system PATH | Containerized / Local | React 18 + TypeScript + Vite + Tailwind CSS project structure with clean dependency manifests and zero host lock-in. |

---

## Milestone Progress Matrix

```
[Phase 0] Environment & Planning Documentation   --> [COMPLETED]
[Phase 1] Repository Foundation & Monorepo Scaffold --> [IN PROGRESS]
[Phase 2] Database Models & Server Authorization    --> [PLANNED]
[Phase 3] Cryptographic Prescription Service        --> [PLANNED]
[Phase 4] Hyperledger Fabric Chaincode (Go)         --> [PLANNED]
[Phase 5] Concurrency-Safe Dispensing Engine       --> [PLANNED]
[Phase 6] FastAPI Backend Service Layer & REST API  --> [PLANNED]
[Phase 7] React + TypeScript + Tailwind UI         --> [PLANNED]
[Phase 8] Test Suite & Verification Matrix         --> [PLANNED]
[Phase 9] Threat Model Hardening & Observability   --> [PLANNED]
[Phase 10] Final Engineering Report & Handoff       --> [PLANNED]
```

---

## Detailed Phase Breakdown

### Phase 0: Environment & Planning Documentation
- [x] Initial workspace audit (OS, shell, paths, tooling, ports).
- [x] Create `docs/IMPLEMENTATION_PLAN.md`.
- [ ] Create `docs/ARCHITECTURE.md`.
- [ ] Create `docs/THREAT_MODEL.md`.
- [ ] Create `docs/DATA_FLOW.md`.
- [ ] Create `docs/API_CONTRACTS.md`.
- [ ] Create `docs/DEVELOPMENT_SETUP.md`.
- **Acceptance Criteria:** Comprehensive design specification covering data schemas, cryptographic invariants, and concurrency boundaries.

### Phase 1: Repository Foundation & Monorepo Scaffold
- [ ] Initialize repository structure (`backend/`, `frontend/`, `chaincode/`, `blockchain/`, `infra/`, `scripts/`).
- [ ] Root configuration: `.gitignore`, `.env.example`, `docker-compose.yml`, `Makefile`.
- [ ] Backend foundation: `pyproject.toml`, Dockerfile, package structure.
- [ ] Frontend foundation: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, Dockerfile.
- [ ] Chaincode foundation: Go module `go.mod`, package structure.
- [ ] GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- **Acceptance Criteria:** Monorepo scaffold is clean, well-bounded, and container-ready.

### Phase 2: Database, Identity & Server Authorization
- [ ] Design PostgreSQL relational schema (Organizations, Users, Roles, Prescriber Keys, Prescriptions, Dispensing Records, Audit Logs, Idempotency Keys).
- [ ] Implement SQLAlchemy 2.0 async/sync models and Alembic migration structure.
- [ ] Implement PBKDF2/Argon2 password hashing and JWT/session management.
- [ ] Implement Role-Based Access Control (RBAC): `DOCTOR`, `PHARMACIST`, `ORG_ADMIN`, `SYSTEM_ADMIN`, `PATIENT`.
- [ ] Enforce backend-level organization boundary checks.
- **Acceptance Criteria:** Server-side authorization blocks unauthorized cross-organization and cross-role requests.

### Phase 3: Cryptographic Prescription Service
- [ ] Implement canonical JSON serialization (deterministic key sorting, strict whitespace).
- [ ] Implement SHA-256 payload hashing.
- [ ] Implement asymmetric digital signing and verification (ECDSA P-256 / Ed25519).
- [ ] Implement AES-256-GCM authenticated encryption/decryption envelope with unique 96-bit nonces.
- [ ] Unit tests verifying: valid signature passes, altered payload fails, tampered ciphertext fails authentication tag check.
- **Acceptance Criteria:** Cryptographic pipeline produces deterministic hashes and prevents tampering.

### Phase 4: Hyperledger Fabric Chaincode (Go)
- [ ] Implement `PrescriptionContract` in Go (`chaincode/prescription/`).
- [ ] Chaincode data structs: `PrescriptionRecord`, `DispenseEvent`, `IssuerKeyStatus`.
- [ ] Transactions: `CreatePrescription`, `ReadPrescription`, `VerifyPrescription`, `RecordDispense`, `RevokePrescription`, `RegisterIssuerKey`, `GetPrescriptionHistory`.
- [ ] Enforce status transitions: `ISSUED` -> `PARTIALLY_DISPENSED` -> `FULLY_DISPENSED` / `REVOKED` / `EXPIRED`.
- [ ] Network configuration artifacts and Fabric test-network scripts.
- **Acceptance Criteria:** Chaincode compiles and validates state transitions with MVCC conflict safety.

### Phase 5: Concurrency-Safe Dispensing Engine
- [ ] Implement transactional dispensing state machine: `PENDING` -> `SUBMITTED` -> `COMMITTED` / `REJECTED`.
- [ ] Idempotency key tracking to prevent duplicate network submissions.
- [ ] Atomic quantity decrement to prevent concurrent double-dispensing race conditions.
- [ ] Reconciliation worker interface for transient blockchain or network interruptions.
- **Acceptance Criteria:** Two concurrent requests consuming remaining balance cannot double-dispense.

### Phase 6: FastAPI Backend REST API (`/api/v1`)
- [ ] API routes:
  - `/auth`: Login, profile, token refresh.
  - `/prescriptions`: Create, retrieve, status check, revocation.
  - `/pharmacy`: QR verification lookup, check balance, execute dispensing.
  - `/audit`: Query tamper-evident event log.
  - `/system`: Liveness (`/healthz`), Readiness (`/ready`), component health checks.
- [ ] Global exception handling, structured JSON error envelopes, request IDs.
- [ ] Automated OpenAPI / Swagger documentation.
- **Acceptance Criteria:** Endpoints adhere strictly to `API_CONTRACTS.md` with full Pydantic validation.

### Phase 7: Professional Frontend (React + TypeScript + Tailwind)
- [ ] Color Palette: Deep Navy (`#0C162A`), Panel (`#15253F`), Verified Teal (`#0F766E` / `#29D2B4`), Alert Red (`#EF4444`).
- [ ] Core layout: 3-Pane Master-Detail (Navigation -> Workflows -> Inspector / Details).
- [ ] Doctor Portal: Form validation (Zod), digital signing status, QR code display.
- [ ] Pharmacy Portal: QR camera / manual code lookup, authenticity badge, balance counter, dispensing modal.
- [ ] Audit Explorer: Searchable, filterable event timeline with transaction IDs.
- [ ] System Health Dashboard: Service indicators (API, DB, Ledger).
- **Acceptance Criteria:** Responsive, accessible UI with zero unhandled client errors.

### Phase 8: Automated Test Suite & Verification Matrix
- [ ] Backend unit & integration tests (`pytest`).
- [ ] Chaincode unit tests (`go test`).
- [ ] End-to-end user journey test script (`scripts/test_e2e_flow.py`).
- **Acceptance Criteria:** 100% of core verification paths and negative security tests pass.

### Phase 9: Security Threat Model Hardening & Observability
- [ ] STRIDE audit review against attack vectors.
- [ ] Security headers (CSP, HSTS, X-Content-Type-Options).
- [ ] Redaction filters ensuring no private keys or patient health info (PHI) in logs.
- **Acceptance Criteria:** Zero sensitive data in plain application logs or on-chain payloads.

### Phase 10: Final Engineering Report & Handoff
- [ ] Complete documentation package.
- [ ] Verification evidence and reproducible run commands.
