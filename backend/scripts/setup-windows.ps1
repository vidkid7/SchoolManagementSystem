# School Management System - Windows Setup Script

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   🏫 School Management System - Windows Setup             ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "📦 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    
    # Generate secrets
    Write-Host "🔐 Generating secure secrets..." -ForegroundColor Yellow
    
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $encryptionKey = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Update .env file
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "your_super_secret_jwt_key_min_32_chars_here_change_this_in_production", $jwtSecret
    $envContent = $envContent -replace "your_refresh_token_secret_min_32_chars_change_this_in_production", $jwtRefreshSecret
    $envContent = $envContent -replace "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", $encryptionKey
    $envContent = $envContent -replace "your_session_secret_key_here_change_this_in_production", $sessionSecret
    $envContent = $envContent -replace "your_secure_password_here", "Dhire12345@@"
    
    Set-Content ".env" $envContent
    
    Write-Host "✅ .env file created with secure secrets" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
}
Write-Host ""

# Create directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
$directories = @("logs", "uploads", "backups")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}
Write-Host "✅ Directories created" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║   ✅ Setup Complete!                                       ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create MySQL database:" -ForegroundColor White
Write-Host "   - Option A: Use MySQL Workbench (easiest)" -ForegroundColor Cyan
Write-Host "   - Option B: Run: .\scripts\create-database.ps1" -ForegroundColor Cyan
Write-Host "   - See DATABASE_SETUP_WINDOWS.md for details" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
