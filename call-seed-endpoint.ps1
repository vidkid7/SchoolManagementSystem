# Call the Railway backend seed endpoint to populate database
$backendUrl = "https://schoolmanagementsystem-production-4bb7.up.railway.app"

Write-Host "Calling seed endpoint to populate database..." -ForegroundColor Cyan
Write-Host "This may take 30-60 seconds..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/setup/seed-database" -Method Post -ContentType "application/json" -TimeoutSec 120
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
    
    if ($response.output) {
        Write-Host "`nSeed Output:" -ForegroundColor Cyan
        Write-Host $response.output -ForegroundColor Gray
    }
    
    Write-Host "`nDatabase has been seeded with:" -ForegroundColor Yellow
    Write-Host "- Admin user (admin / Admin@123)" -ForegroundColor White
    Write-Host "- Sample teacher (teacher1 / Teacher@123)" -ForegroundColor White
    Write-Host "- Sample student (student1 / Student@123)" -ForegroundColor White
    Write-Host "- Sample parent (parent1 / Parent@123)" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error calling seed endpoint" -ForegroundColor Red
    
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
            if ($errorData.stdout) {
                Write-Host "`nStdout:" -ForegroundColor Yellow
                Write-Host $errorData.stdout -ForegroundColor Gray
            }
            if ($errorData.stderr) {
                Write-Host "`nStderr:" -ForegroundColor Yellow
                Write-Host $errorData.stderr -ForegroundColor Gray
            }
        } catch {
            Write-Host "Could not parse error response" -ForegroundColor Red
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n---" -ForegroundColor Gray
Write-Host "Note: If seeding fails, you may need to run it from Railway Shell:" -ForegroundColor Yellow
Write-Host "  railway run node dist/scripts/seed-database.js" -ForegroundColor Gray
