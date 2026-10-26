import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import engine, Base
from app.core.exceptions import RxGuardException, rxguard_exception_handler
from app.api.v1.auth import router as auth_router
from app.api.v1.prescriptions import router as rx_router
from app.api.v1.pharmacy import router as pharmacy_router
from app.api.v1.audit import router as audit_router
from app.api.v1.system import router as system_router
from app.db.seed import seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed default demonstration organizations and users
    await seed_initial_data()
    yield
    # Shutdown logic
    await engine.dispose()

app = FastAPI(
    title="RxGuard Healthcare Security API",
    description="A Blockchain-Based Prescription Verification and Dispensing System REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID Correlation Middleware
@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", f"req-{uuid.uuid4().hex[:10]}")
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Register Exception Handlers
app.add_exception_handler(RxGuardException, rxguard_exception_handler)

# Register v1 API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(rx_router, prefix="/api/v1")
app.include_router(pharmacy_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "service": "RxGuard Healthcare Verification Engine",
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }
