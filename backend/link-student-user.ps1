# Link student user to student record
Write-Host "Linking student1 user to student record..." -ForegroundColor Cyan

npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/link-student-user.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Student user linked successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: Failed to link student user" -ForegroundColor Red
}
