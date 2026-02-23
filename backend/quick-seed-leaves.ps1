#!/usr/bin/env pwsh

Write-Host "Seeding leave applications..." -ForegroundColor Cyan
npx ts-node -r tsconfig-paths/register src/scripts/simple-seed-leaves.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! View at: http://localhost:5173/attendance/leave" -ForegroundColor Green
}
