#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Leave Applications API Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"

# First, login to get a token
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow

$loginBody = @{
    username = "admin"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "Login successful" -ForegroundColor Green
} catch {
    Write-Host "Login failed. Make sure the backend server is running." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Get some students
Write-Host "`nStep 2: Fetching students..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $studentsResponse = Invoke-RestMethod -Uri "$baseUrl/students?limit=10" -Method Get -Headers $headers
    $students = $studentsResponse.data.students
    Write-Host "Found $($students.Count) students" -ForegroundColor Green
} catch {
    Write-Host "Failed to fetch students" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

if ($students.Count -eq 0) {
    Write-Host "No students found. Please seed students first." -ForegroundColor Red
    exit 1
}

# Create leave applications
Write-Host "`nStep 3: Creating leave applications..." -ForegroundColor Yellow

$leaveReasons = @(
    "Medical appointment with family doctor",
    "Family emergency - need to travel to hometown",
    "Fever and cold - doctor advised rest",
    "Attending family wedding ceremony",
    "Religious festival celebration",
    "Stomach infection - need bed rest",
    "Dental treatment scheduled",
    "Participating in district sports competition",
    "Grandfather health condition - need to visit",
    "Severe headache and body pain"
)

$successCount = 0
$failCount = 0

for ($i = 0; $i -lt [Math]::Min(15, $students.Count * 2); $i++) {
    $student = $students[$i % $students.Count]
    
    # Random dates
    $daysOffset = Get-Random -Minimum -10 -Maximum 20
    $startDate = (Get-Date).AddDays($daysOffset)
    $duration = Get-Random -Minimum 1 -Maximum 4
    $endDate = $startDate.AddDays($duration)
    
    $leaveBody = @{
        studentId = $student.studentId
        startDate = $startDate.ToString('yyyy-MM-dd')
        endDate = $endDate.ToString('yyyy-MM-dd')
        reason = $leaveReasons[$i % $leaveReasons.Count]
        remarks = if ($i % 3 -eq 0) { 'Medical certificate attached' } else { $null }
    } | ConvertTo-Json
    
    try {
        $leaveResponse = Invoke-RestMethod -Uri "$baseUrl/attendance/leave/apply" -Method Post -Body $leaveBody -Headers $headers
        $successCount++
        $startStr = $startDate.ToString('yyyy-MM-dd')
        $endStr = $endDate.ToString('yyyy-MM-dd')
        Write-Host "  Created leave for student $($student.studentId): $startStr to $endStr" -ForegroundColor Green
    } catch {
        $failCount++
        Write-Host "  Failed to create leave for student $($student.studentId)" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        if ($i -eq 0) {
            Write-Host "    Response: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
        }
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully created: $successCount leave applications" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount leave applications" -ForegroundColor Red
}
Write-Host ""
Write-Host "You can now view the leave applications at:" -ForegroundColor Cyan
$leaveUrl = "http://localhost:5173/attendance/leave"
Write-Host $leaveUrl -ForegroundColor Yellow
Write-Host ""
