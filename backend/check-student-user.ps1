# Check student user in database
Write-Host "Checking student user..." -ForegroundColor Cyan

$query = @"
SELECT 
    user_id,
    username,
    email,
    role,
    status,
    failed_login_attempts,
    account_locked_until,
    last_login,
    created_at
FROM users 
WHERE username = 'student1' OR email = 'student1@school.edu.np';
"@

mysql -u root -p -D school_management_system -e $query

Write-Host "`nIf no user found, run the seed script:" -ForegroundColor Yellow
Write-Host "npm run seed" -ForegroundColor Green
