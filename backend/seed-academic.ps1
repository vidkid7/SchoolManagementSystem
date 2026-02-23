#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Seed Academic Module Data
.DESCRIPTION
    Seeds academic years, terms, classes, subjects, class-subject assignments, and calendar events
.EXAMPLE
    .\seed-academic.ps1
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Academic Module Data Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Error: node_modules not found. Please run 'npm install' first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Using .env.example" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "Error: .env.example not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting academic module seeding..." -ForegroundColor Yellow
Write-Host ""

# Compile TypeScript
Write-Host "Compiling TypeScript..." -ForegroundColor Cyan
npx tsc src/scripts/seed-academic-module.ts --outDir dist --esModuleInterop --resolveJsonModule --skipLibCheck

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: TypeScript compilation failed" -ForegroundColor Red
    exit 1
}

# Run the seeder
Write-Host "Running seeder..." -ForegroundColor Cyan
node dist/scripts/seed-academic-module.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Academic Module Seeding Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Seeded Data:" -ForegroundColor Cyan
    Write-Host "  - Academic Years (2080-2081, 2081-2082)" -ForegroundColor White
    Write-Host "  - Terms (First, Second, Third)" -ForegroundColor White
    Write-Host "  - Classes (Grades 1-12, Sections A-C)" -ForegroundColor White
    Write-Host "  - Subjects (Nepali, English, Math, Science, etc.)" -ForegroundColor White
    Write-Host "  - Class-Subject Assignments" -ForegroundColor White
    Write-Host "  - Calendar Events (Academic, Sports, Cultural, Holidays)" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Yellow
    Write-Host "  1. View academic years at: /academic/years" -ForegroundColor White
    Write-Host "  2. View classes & subjects at: /academic" -ForegroundColor White
    Write-Host "  3. View calendar events at: /academic/calendar" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error: Seeding failed. Check the logs above." -ForegroundColor Red
    exit 1
}
