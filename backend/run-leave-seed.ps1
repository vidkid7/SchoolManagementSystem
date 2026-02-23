#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Leave Applications SQL Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$dbHost = $env:DB_HOST
$dbPort = $env:DB_PORT
$dbName = $env:DB_NAME
$dbUser = $env:DB_USER
$dbPassword = $env:DB_PASSWORD

Write-Host "Database: $dbName@$dbHost" -ForegroundColor Yellow
Write-Host ""

# Check if mysql is available
try {
    $null = Get-Command mysql -ErrorAction Stop
} catch {
    Write-Host "MySQL client not found. Please install MySQL client." -ForegroundColor Red
    exit 1
}

# Run the SQL file
Write-Host "Seeding leave applications..." -ForegroundColor Green

$env:MYSQL_PWD = $dbPassword
mysql -h $dbHost -P $dbPort -u $dbUser $dbName -e "source seed-leave-data.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Leave applications seeded successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now view the leave applications at:" -ForegroundColor Cyan
    Write-Host "http://localhost:5173/attendance/leave" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Failed to seed leave applications" -ForegroundColor Red
    Write-Host "Please check your database connection and try again" -ForegroundColor Yellow
}

# Clear password from environment
$env:MYSQL_PWD = ""
