# Seed Examination Data
# Run this script to populate the database with examination data

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Examination Data Seeder" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting examination data seeding..." -ForegroundColor Yellow
Write-Host ""

# Run the seeder script
npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/seed-examinations.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  Success: Examination data seeded!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  Error: Seeding failed!" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    exit 1
}
