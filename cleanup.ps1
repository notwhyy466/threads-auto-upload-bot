# Thread Bot Project Cleanup Script
# Jalankan script ini untuk membersihkan file temporary dan testing

Write-Host "Membersihkan Thread Post Puppeter Project..." -ForegroundColor Green

# Hapus file test dan debug
Write-Host "Menghapus file testing dan debug..." -ForegroundColor Yellow
Remove-Item "test-*.js" -ErrorAction SilentlyContinue
Remove-Item "debug-*.js" -ErrorAction SilentlyContinue  
Remove-Item "debug-*.png" -ErrorAction SilentlyContinue
Remove-Item "*_backup.js" -ErrorAction SilentlyContinue
Remove-Item "*.backup" -ErrorAction SilentlyContinue

# Bersihkan logs
Write-Host "Membersihkan logs..." -ForegroundColor Yellow
Remove-Item "logs\*.log" -ErrorAction SilentlyContinue

# Bersihkan chrome profile cache (kecuali Default untuk session)
Write-Host "Membersihkan Chrome profile cache..." -ForegroundColor Yellow
Get-ChildItem "data\chrome-profile\" -Exclude "Default" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Hitung ukuran folder
$size = (Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size/1MB,2)

Write-Host "Pembersihan selesai!" -ForegroundColor Green
Write-Host "Ukuran project: $sizeMB MB" -ForegroundColor Cyan
Write-Host "Tip: Jalankan script ini secara berkala untuk menjaga project tetap ringan" -ForegroundColor Blue

pause
