# Run database migrations for School Management System

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan

# Change to backend directory
Set-Location backend

# Run migrations using ts-node
Write-Host "`n📦 Executing migrations..." -ForegroundColor Yellow
npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/run-migrations.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
}

# Return to root directory
Set-Location ..
