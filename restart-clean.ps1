# Clean restart script for School Management System

Write-Host "🧹 Cleaning and restarting School Management System..." -ForegroundColor Cyan

# Stop any running processes on ports 3000 and 5173
Write-Host "`n📌 Stopping processes on ports 3000 and 5173..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $processId = $port3000.OwningProcess
    Write-Host "   Stopping process $processId on port 3000..." -ForegroundColor Gray
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    $processId = $port5173.OwningProcess
    Write-Host "   Stopping process $processId on port 5173..." -ForegroundColor Gray
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Clear frontend cache
Write-Host "`n🗑️  Clearing frontend cache..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules/.vite") {
    Remove-Item -Recurse -Force "frontend/node_modules/.vite"
    Write-Host "   ✓ Cleared Vite cache" -ForegroundColor Green
}

if (Test-Path "frontend/dist") {
    Remove-Item -Recurse -Force "frontend/dist"
    Write-Host "   ✓ Cleared dist folder" -ForegroundColor Green
}

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "   2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "   3. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   4. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "`n💡 Tip: Use Ctrl+F5 to hard refresh the page in your browser" -ForegroundColor Yellow
