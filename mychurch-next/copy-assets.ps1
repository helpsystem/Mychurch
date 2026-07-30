$sourceDir = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\GALLERY\3D web church"
$destDir = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\mychurch-next\public"

Write-Host "Copying gallery files to public folder..." -ForegroundColor Cyan

Copy-Item -Path "$sourceDir\*" -Destination $destDir -Recurse -Force

Write-Host "Done! Files copied successfully." -ForegroundColor Green
