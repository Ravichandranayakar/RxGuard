Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RxGuard - Healthcare Security Trust Protocol Setup   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check or copy .env
if (-not (Test-Path ".env")) {
    Write-Host "[1/3] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host "[1/3] .env file already exists." -ForegroundColor Green
}

# 2. Check Docker
Write-Host "[2/3] Checking Docker availability..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  -> $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  -> Docker CLI not found or daemon not started." -ForegroundColor Red
}

# 3. Next Steps
Write-Host "`n[3/3] System Ready to Launch!" -ForegroundColor Cyan
Write-Host "To run the entire system in Docker containers:" -ForegroundColor White
Write-Host "  docker compose up --build" -ForegroundColor Yellow

Write-Host "`nTo run services individually:" -ForegroundColor White
Write-Host "  Backend:  cd backend; uvicorn app.main:app --reload" -ForegroundColor Yellow
Write-Host "  Frontend: cd frontend; npm run dev" -ForegroundColor Yellow
Write-Host "  Tests:    python scripts/test_e2e_flow.py" -ForegroundColor Yellow
