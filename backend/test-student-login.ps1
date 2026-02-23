# Test Student Login
Write-Host "Testing Student Login..." -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Test credentials
$username = "student1"
$password = "Student@123"

Write-Host "Testing with credentials:" -ForegroundColor Yellow
Write-Host "Username: $username" -ForegroundColor White
Write-Host "Password: $password" -ForegroundColor White
Write-Host ""

# Create JSON body
$body = @{
    username = $username
    password = $password
    rememberMe = $false
} | ConvertTo-Json

Write-Host "Sending login request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "User ID: $($response.user.userId)" -ForegroundColor White
    Write-Host "Username: $($response.user.username)" -ForegroundColor White
    Write-Host "Email: $($response.user.email)" -ForegroundColor White
    Write-Host "Role: $($response.user.role)" -ForegroundColor White
    Write-Host ""
    Write-Host "Access Token: $($response.accessToken.Substring(0, 50))..." -ForegroundColor Gray
}
catch {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ""
        Write-Host "Server Response:" -ForegroundColor Yellow
        Write-Host ($errorObj | ConvertTo-Json -Depth 3) -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting Steps:" -ForegroundColor Cyan
    Write-Host "1. Check if user exists in database:" -ForegroundColor White
    Write-Host "   .\check-student-user.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Verify backend is running:" -ForegroundColor White
    Write-Host "   Check http://localhost:3000/api/v1/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check if account is locked:" -ForegroundColor White
    Write-Host "   Look for 'account_locked_until' in database" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Verify password hasn't been changed:" -ForegroundColor White
    Write-Host "   Default password is: Student@123" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Re-seed the database:" -ForegroundColor White
    Write-Host "   npm run seed" -ForegroundColor Gray
}
