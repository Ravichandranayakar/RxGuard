# RxGuard — Development & Deployment Setup Guide

## 1. Quick Start via Docker Compose (Recommended)

RxGuard is engineered to run in a containerized environment with zero host configuration:

```powershell
# 1. Copy sample environment configuration
Copy-Item .env.example .env

# 2. Build and launch all services (PostgreSQL, FastAPI Backend, React Frontend)
docker compose up --build -d

# 3. View service status
docker compose ps
```

### Exposed Endpoints
- **Frontend Portal:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:8000/api/v1`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5432`

---

## 2. Local Development Setup (Manual)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 15+ (or run via `docker run --name rxguard-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine`)
- Go 1.21+ (for chaincode compilation & testing)

### 2.1 Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed synthetic test organizations and prescribers
python scripts/seed_demo.py

# Launch development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2.2 Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

### 2.3 Chaincode Setup (Go)
```powershell
cd chaincode/prescription
go test -v ./...
```

---

## 3. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/rxguard` | PostgreSQL connection string |
| `SECRET_KEY` | `dev_insecure_jwt_secret_change_in_production_32chars` | Secret key for JWT signing |
| `MASTER_ENCRYPTION_KEY` | `dev_master_aes256_key_32bytes_sample!` | 32-byte key for AES-256-GCM payload encryption |
| `FABRIC_MODE` | `standalone_dev` | `fabric_gateway` (real Fabric network) or `standalone_dev` (deterministic in-memory cryptographic ledger emulator for testing) |
| `FABRIC_CHANNEL` | `rxguardchannel` | Fabric channel name |
| `FABRIC_CHAINCODE` | `prescription` | Fabric chaincode contract name |
