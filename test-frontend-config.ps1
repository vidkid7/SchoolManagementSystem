# Test what config.js the frontend is actually serving
$frontendUrl = "https://zucchini-passion-production.up.railway.app"

Write-Host "Fetching config.js from Railway frontend..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/config.js" -UseBasicParsing
    
    Write-Host "`n✅ Config.js content:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
    
    if ($response.Content -match "localhost") {
        Write-Host "`n❌ PROBLEM: Config still has localhost!" -ForegroundColor Red
        Write-Host "The inject-env.sh script is not running properly." -ForegroundColor Yellow
    } elseif ($response.Content -match "schoolmanagementsystem-production-4bb7") {
        Write-Host "`n✅ Config looks correct!" -ForegroundColor Green
    }
} catch {
    Write-Host "`n❌ Error fetching config.js" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---" -ForegroundColor Gray
Write-Host "Testing login endpoint from frontend..." -ForegroundColor Cyan

try {
    $loginResponse = Invoke-WebRequest -Uri "$frontendUrl/" -UseBasicParsing
    Write-Host "✅ Frontend is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend error: $($_.Exception.Message)" -ForegroundColor Red
}
