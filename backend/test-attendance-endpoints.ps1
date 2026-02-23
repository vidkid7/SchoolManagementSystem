#!/usr/bin/env pwsh
# Test Attendance Endpoints
# This script tests if the attendance endpoints are accessible

Write-Host "🧪 Testing Attendance Endpoints..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# Test 1: Check if server is running
Write-Host "1️⃣ Testing server health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/../health" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Server is not running on port 3000" -ForegroundColor Red
    Write-Host "   Please start the backend server first: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Check student attendance endpoint (without auth - should get 401)
Write-Host "2️⃣ Testing student attendance endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/attendance/student/mark" -Method POST -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists (401 Unauthorized - expected without token)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Endpoint not found (404)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠ Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3: Check staff attendance endpoint (without auth - should get 401)
Write-Host "3️⃣ Testing staff attendance endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/attendance/staff/mark" -Method POST -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists (401 Unauthorized - expected without token)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Endpoint not found (404) - Server needs restart!" -ForegroundColor Red
        Write-Host "   Run: .\restart-server.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠ Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4: Check staff bulk attendance endpoint
Write-Host "4️⃣ Testing staff bulk attendance endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/attendance/staff/bulk" -Method POST -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists (401 Unauthorized - expected without token)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Endpoint not found (404) - Server needs restart!" -ForegroundColor Red
        Write-Host "   Run: .\restart-server.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠ Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: Check staff report endpoint
Write-Host "5️⃣ Testing staff attendance report endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/attendance/staff/report" -Method GET -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists (401 Unauthorized - expected without token)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Endpoint not found (404) - Server needs restart!" -ForegroundColor Red
        Write-Host "   Run: .\restart-server.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠ Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Endpoint testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   - All endpoints returning 401 = ✅ Good (authentication required)" -ForegroundColor Green
Write-Host "   - Any endpoint returning 404 = ❌ Bad (server needs restart)" -ForegroundColor Red
Write-Host ""
