Write-Host "Linking student user..." -ForegroundColor Cyan
npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/link-student-user.ts
Write-Host "Done!" -ForegroundColor Green
