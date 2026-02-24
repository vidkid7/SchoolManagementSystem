# Call the Railway backend setup endpoint to create/reset admin user
$backendUrl = "https://schoolmanagementsystem-production-4bb7.up.railway.app"

Write-Host "Calling setup endpoint to create/reset admin user..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/setup/reset-admin" -Method Post -ContentType "application/json"
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "`nLogin Credentials:" -ForegroundColor Yellow
    Write-Host "Username: $($response.credentials.username)" -ForegroundColor White
    Write-Host "Password: $($response.credentials.password)" -ForegroundColor White
    Write-Host "`nYou can now log in at: https://zucchini-passion-production.up.railway.app" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Error calling setup endpoint" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to read the response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
