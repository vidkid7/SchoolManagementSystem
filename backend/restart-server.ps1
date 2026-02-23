#!/usr/bin/env pwsh
# Restart Backend Server Script
# This script stops any running backend server and starts a fresh instance

Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Cyan

# Kill any existing node processes running on port 3000
Write-Host "📍 Checking for existing processes on port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠ Could not stop process $pid" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ No existing processes found" -ForegroundColor Gray
}

# Navigate to backend directory
Set-Location $PSScriptRoot

# Start the server
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "   Server will run on http://localhost:3000" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
