# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

Write-Host "Creating staff_documents table..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor Yellow

# Run the SQL file
$mysqlCommand = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
Get-Content create-staff-documents-table.sql | & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER "-p$DB_PASSWORD" $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ staff_documents table created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create table. Error code: $LASTEXITCODE" -ForegroundColor Red
}
