# Reset student password
Write-Host "Resetting student1 password..." -ForegroundColor Cyan

# First, let's check if the user exists
$checkQuery = "SELECT user_id, username, email, status FROM users WHERE username = 'student1';"
Write-Host "`nChecking if student1 exists..." -ForegroundColor Yellow
mysql -u root -p -D school_management_system -e $checkQuery

Write-Host "`nTo reset password, you need to:" -ForegroundColor Yellow
Write-Host "1. Run: npm run seed (to create/recreate all users)" -ForegroundColor Green
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "2. Use the forgot password feature in the app" -ForegroundColor Green
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "3. Manually update in database (not recommended)" -ForegroundColor Green

Write-Host "`nDefault student credentials:" -ForegroundColor Cyan
Write-Host "Username: student1" -ForegroundColor White
Write-Host "Password: Student@123" -ForegroundColor White
