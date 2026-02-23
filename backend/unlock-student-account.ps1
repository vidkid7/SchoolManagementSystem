# Unlock Student Account
Write-Host "Unlocking student1 account..." -ForegroundColor Cyan
Write-Host ""

$unlockQuery = @"
UPDATE users 
SET 
    failed_login_attempts = 0,
    account_locked_until = NULL,
    status = 'active'
WHERE username = 'student1';
"@

Write-Host "Executing unlock query..." -ForegroundColor Yellow
mysql -u root -p -D school_management_system -e $unlockQuery

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Account unlocked successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify the change
    $verifyQuery = @"
SELECT 
    username,
    status,
    failed_login_attempts,
    account_locked_until,
    CASE 
        WHEN account_locked_until IS NULL THEN 'Not Locked'
        WHEN account_locked_until > NOW() THEN 'Still Locked'
        ELSE 'Unlocked'
    END as lock_status
FROM users 
WHERE username = 'student1';
"@
    
    Write-Host "Current account status:" -ForegroundColor Cyan
    mysql -u root -p -D school_management_system -e $verifyQuery
    
    Write-Host ""
    Write-Host "You can now try logging in with:" -ForegroundColor Green
    Write-Host "Username: student1" -ForegroundColor White
    Write-Host "Password: Student@123" -ForegroundColor White
} else {
    Write-Host "✗ Failed to unlock account" -ForegroundColor Red
    Write-Host "Please check database connection" -ForegroundColor Yellow
}
