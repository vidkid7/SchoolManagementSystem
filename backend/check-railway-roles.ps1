# Check Railway Database Roles
# Usage: .\check-railway-roles.ps1 "your_database_url_here"

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl
)

if (-not $DatabaseUrl) {
    Write-Host "❌ Please provide the DATABASE_URL as a parameter" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\check-railway-roles.ps1 'postgresql://user:pass@host:port/dbname'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or set it as environment variable:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "postgresql://user:pass@host:port/dbname"' -ForegroundColor Cyan
    Write-Host "  node backend/check-railway-roles.js" -ForegroundColor Cyan
    exit 1
}

Write-Host "🚀 Setting DATABASE_URL environment variable..." -ForegroundColor Cyan
$env:DATABASE_URL = $DatabaseUrl

Write-Host "🔍 Checking Railway database roles..." -ForegroundColor Cyan
Write-Host ""

node backend/check-railway-roles.js

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
