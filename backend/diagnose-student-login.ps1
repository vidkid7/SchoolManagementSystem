# Student Login Diagnostic Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Student Login Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Check if backend is running
Write-Host "[1/6] Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/health" -Method GET -TimeoutSec 5
    Write-Host "  ✓ Backend is running" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Backend is NOT running" -ForegroundColor Red
    Write-Host "    Please start backend: npm run dev" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# 2. Check database connection
Write-Host "[2/6] Checking database connection..." -ForegroundColor Yellow
try {
    $dbCheck = mysql -u root -p -D school_management_system -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Database connection failed" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Cannot connect to database" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# 3. Check if student user exists
Write-Host "[3/6] Checking if student1 user exists..." -ForegroundColor Yellow
$userQuery = @"
SELECT 
    user_id,
    username,
    email,
    role,
    status,
    failed_login_attempts,
    CASE 
        WHEN account_locked_until IS NULL THEN 'Not Locked'
        WHEN account_locked_until > NOW() THEN CONCAT('Locked until ', account_locked_until)
        ELSE 'Lock Expired'
    END as lock_status
FROM users 
WHERE username = 'student1';
"@

try {
    $result = mysql -u root -p -D school_management_system -e $userQuery 2>&1
    if ($result -match "student1") {
        Write-Host "  ✓ Student user exists" -ForegroundColor Green
        Write-Host $result -ForegroundColor Gray
        
        # Check if locked
        if ($result -match "Locked until") {
            Write-Host "  ⚠ Account is LOCKED" -ForegroundColor Yellow
            $allGood = $false
        }
        
        # Check if inactive
        if ($result -match "inactive") {
            Write-Host "  ⚠ Account is INACTIVE" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        Write-Host "  ✗ Student user does NOT exist" -ForegroundColor Red
        Write-Host "    Run: npm run seed" -ForegroundColor Yellow
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Error checking user" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 4. Check Redis connection (if applicable)
Write-Host "[4/6] Checking Redis connection..." -ForegroundColor Yellow
try {
    $redisCheck = redis-cli PING 2>&1
    if ($redisCheck -match "PONG") {
        Write-Host "  ✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Redis is not running (optional)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Redis check skipped (optional)" -ForegroundColor Yellow
}
Write-Host ""

# 5. Test login API
Write-Host "[5/6] Testing login API..." -ForegroundColor Yellow
$body = @{
    username = "student1"
    password = "Student@123"
    rememberMe = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "  ✓ Login API works!" -ForegroundColor Green
    Write-Host "    User: $($response.user.username)" -ForegroundColor Gray
    Write-Host "    Role: $($response.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Login API failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "    Error: $($errorObj.message)" -ForegroundColor Yellow
    } else {
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    $allGood = $false
}
Write-Host ""

# 6. Check frontend
Write-Host "[6/6] Checking if frontend is running..." -ForegroundColor Yellow
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Frontend is not running" -ForegroundColor Yellow
    Write-Host "    Start frontend: npm run dev (in frontend folder)" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✓ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now login with:" -ForegroundColor Cyan
    Write-Host "  Username: student1" -ForegroundColor White
    Write-Host "  Password: Student@123" -ForegroundColor White
} else {
    Write-Host "  ✗ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "  2. Seed database: cd backend && npm run seed" -ForegroundColor White
    Write-Host "  3. Start frontend: cd frontend && npm run dev" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
