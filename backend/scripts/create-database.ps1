# School Management System - Database Creation Script for Windows
# This script automatically finds MySQL and creates the database

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   🏫 School Management System - Database Setup            ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Common MySQL installation paths
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "C:\wamp\bin\mysql\mysql8.0.31\bin\mysql.exe"
)

# Try to find MySQL
Write-Host "🔍 Searching for MySQL installation..." -ForegroundColor Yellow
$mysqlExe = $null

foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "✅ Found MySQL at: $path" -ForegroundColor Green
        break
    }
}

if ($null -eq $mysqlExe) {
    Write-Host ""
    Write-Host "❌ MySQL executable not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use one of these methods instead:" -ForegroundColor Yellow
    Write-Host "1. Open MySQL Workbench and create database manually" -ForegroundColor White
    Write-Host "2. Add MySQL to PATH and run: mysql -u root -p" -ForegroundColor White
    Write-Host ""
    Write-Host "See DATABASE_SETUP_WINDOWS.md for detailed instructions" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Database credentials
$dbUser = "root"
$dbPassword = "Dhire12345@@"
$dbName = "school_management_system"

# Check if MySQL service is running
Write-Host ""
Write-Host "🔍 Checking MySQL service status..." -ForegroundColor Yellow

$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($null -eq $mysqlService) {
    Write-Host "⚠️  MySQL service not found. Attempting to connect anyway..." -ForegroundColor Yellow
} elseif ($mysqlService.Status -ne "Running") {
    Write-Host "⚠️  MySQL service is not running. Starting..." -ForegroundColor Yellow
    try {
        Start-Service -Name $mysqlService.Name
        Write-Host "✅ MySQL service started" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start MySQL service. Please start it manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ MySQL service is running" -ForegroundColor Green
}

# Test connection
Write-Host ""
Write-Host "🔍 Testing MySQL connection..." -ForegroundColor Yellow

$testSql = "SELECT 1;"
$testResult = & $mysqlExe -u $dbUser -p$dbPassword -e $testSql 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to connect to MySQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Wrong password (current: $dbPassword)" -ForegroundColor White
    Write-Host "2. MySQL service not running" -ForegroundColor White
    Write-Host "3. User 'root' doesn't have access" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ MySQL connection successful" -ForegroundColor Green

# Create database
Write-Host ""
Write-Host "🗄️  Creating database '$dbName'..." -ForegroundColor Yellow

$createDbSql = "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$createResult = & $mysqlExe -u $dbUser -p$dbPassword -e $createDbSql 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to create database!" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ Database created successfully" -ForegroundColor Green

# Verify database exists
Write-Host ""
Write-Host "🔍 Verifying database..." -ForegroundColor Yellow

$showDbSql = "SHOW DATABASES LIKE '$dbName';"
$verifyResult = & $mysqlExe -u $dbUser -p$dbPassword -e $showDbSql 2>&1

if ($verifyResult -match $dbName) {
    Write-Host "✅ Database verified: $dbName" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database verification failed" -ForegroundColor Yellow
}

# Show all databases
Write-Host ""
Write-Host "📋 Available databases:" -ForegroundColor Cyan
$allDbSql = "SHOW DATABASES;"
& $mysqlExe -u $dbUser -p$dbPassword -e $allDbSql

# Success message
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║   ✅ Database Setup Complete!                              ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Cyan
Write-Host "  Name: $dbName" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 3306" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host "  Charset: utf8mb4" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure .env file has correct database credentials" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""
