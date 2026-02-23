# Student Module Seeding Script for Windows
# Run this script to seed all student data for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Student Module Seeding Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Seeding Students..." -ForegroundColor Yellow
Write-Host "This will create 100 sample students with realistic data" -ForegroundColor Gray
Write-Host ""

try {
    npx ts-node -r tsconfig-paths/register src/scripts/seed-student-module.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Students seeded successfully!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Step 2: Seeding Related Data..." -ForegroundColor Yellow
        Write-Host "This will create attendance, grades, fees, ECA, library, and other data" -ForegroundColor Gray
        Write-Host ""
        
        npx ts-node -r tsconfig-paths/register src/scripts/seed-student-data.ts
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✅ ALL DATA SEEDED SUCCESSFULLY!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 What was created:" -ForegroundColor Cyan
            Write-Host "  • 100 students across all classes (1-12)" -ForegroundColor White
            Write-Host "  • Attendance records (90%+ attendance)" -ForegroundColor White
            Write-Host "  • Exam grades and results" -ForegroundColor White
            Write-Host "  • Fee invoices and payments" -ForegroundColor White
            Write-Host "  • ECA and Sports participation" -ForegroundColor White
            Write-Host "  • Library borrowing history" -ForegroundColor White
            Write-Host "  • Certificates" -ForegroundColor White
            Write-Host "  • Teacher remarks" -ForegroundColor White
            Write-Host ""
            Write-Host "🎯 You can now test all 21 features:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Student Records (11 features):" -ForegroundColor Yellow
            Write-Host "  1. ✅ Create new students" -ForegroundColor White
            Write-Host "  2. ✅ View all students (100 students available)" -ForegroundColor White
            Write-Host "  3. ✅ Update student information" -ForegroundColor White
            Write-Host "  4. ✅ Delete students" -ForegroundColor White
            Write-Host "  5. ✅ Bulk import (template available)" -ForegroundColor White
            Write-Host "  6. ✅ Download template" -ForegroundColor White
            Write-Host "  7. ✅ Upload photos (sample avatars included)" -ForegroundColor White
            Write-Host "  8. ✅ Upload documents" -ForegroundColor White
            Write-Host "  9. ✅ Promote students (active students ready)" -ForegroundColor White
            Write-Host "  10. ✅ Transfer students" -ForegroundColor White
            Write-Host "  11. ✅ View statistics" -ForegroundColor White
            Write-Host ""
            Write-Host "Academic History (6 features):" -ForegroundColor Yellow
            Write-Host "  1. ✅ Complete academic history" -ForegroundColor White
            Write-Host "  2. ✅ Attendance records (200+ records per student)" -ForegroundColor White
            Write-Host "  3. ✅ Exam results (3 exams, 7-8 subjects)" -ForegroundColor White
            Write-Host "  4. ✅ Grade reports" -ForegroundColor White
            Write-Host "  5. ✅ Fee payment history (6 months)" -ForegroundColor White
            Write-Host "  6. ✅ Library borrowing (5-15 books per student)" -ForegroundColor White
            Write-Host ""
            Write-Host "CV Management (4 features):" -ForegroundColor Yellow
            Write-Host "  1. ✅ Generate CVs" -ForegroundColor White
            Write-Host "  2. ✅ View achievements" -ForegroundColor White
            Write-Host "  3. ✅ ECA participation (1-3 activities)" -ForegroundColor White
            Write-Host "  4. ✅ Sports participation (1-2 sports)" -ForegroundColor White
            Write-Host ""
            Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
            Write-Host "  1. Start the backend: npm run dev" -ForegroundColor White
            Write-Host "  2. Start the frontend: cd ../frontend && npm run dev" -ForegroundColor White
            Write-Host "  3. Login as School_Admin" -ForegroundColor White
            Write-Host "  4. Navigate to Students section" -ForegroundColor White
            Write-Host "  5. Test all features!" -ForegroundColor White
            Write-Host ""
            Write-Host "📁 Mock data saved to:" -ForegroundColor Cyan
            Write-Host "  backend/src/data/student-mock-data.json" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "⚠️  Related data seeding had issues" -ForegroundColor Yellow
            Write-Host "But students were created successfully!" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "❌ Student seeding failed" -ForegroundColor Red
        Write-Host "Please check the error messages above" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error occurred during seeding:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
