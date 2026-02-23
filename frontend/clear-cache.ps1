# Clear Vite cache and restart dev server
Write-Host "Clearing Vite cache..." -ForegroundColor Yellow

# Remove .vite cache directory
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✓ Cleared node_modules/.vite" -ForegroundColor Green
}

# Remove dist directory
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleared dist" -ForegroundColor Green
}

Write-Host "`nCache cleared! Now restart your dev server with: npm run dev" -ForegroundColor Cyan
