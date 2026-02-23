#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Seeds leave application data for testing
.DESCRIPTION
    Creates sample leave applications with various statuses (pending, approved, rejected)
    and dates (past, present, future) for testing the leave management system
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Leave Applications Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting leave applications seeding..." -ForegroundColor Green
Write-Host ""

# Run the seeder script
npx ts-node -r tsconfig-paths/register src/scripts/seed-leave-applications.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Leave applications seeded successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now view the leave applications at:" -ForegroundColor Cyan
    Write-Host "http://localhost:5173/attendance/leave" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Failed to seed leave applications" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Make sure students are seeded first (run seed-students.ps1)" -ForegroundColor White
    Write-Host "2. Make sure users exist in the database" -ForegroundColor White
    Write-Host "3. Check database connection in .env file" -ForegroundColor White
    exit 1
}
