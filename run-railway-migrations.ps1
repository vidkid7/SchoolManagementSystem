# Run migrations on Railway database
$backendUrl = "https://schoolmanagementsystem-production-4bb7.up.railway.app"

Write-Host "Calling migration endpoint..." -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Yellow

try {
    # Create a migration endpoint call
    $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/setup/run-migrations" -Method Post -ContentType "application/json" -TimeoutSec 180
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    
    if ($response.output) {
        Write-Host "`nMigration Output:" -ForegroundColor Cyan
        Write-Host $response.output -ForegroundColor Gray
    }
    
} catch {
    Write-Host "`n❌ Error calling migration endpoint" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            
            $errorData = $responseBody | ConvertFrom-Json
            Write-Host "Error: $($errorData.error)" -ForegroundColor Red
            if ($errorData.details) {
                Write-Host "Details: $($errorData.details)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Could not parse error response" -ForegroundColor Red
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n---" -ForegroundColor Gray
Write-Host "After migrations complete, the dashboard should work properly." -ForegroundColor Yellow
