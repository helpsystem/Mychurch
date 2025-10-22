# Simple HTTP Server for serving the dist folder
$port = 8080
$path = "$PSScriptRoot\dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MyChurch Simple Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Serving from: $path" -ForegroundColor Yellow
Write-Host "URL: http://localhost:$port" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server is running..." -ForegroundColor Green

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestUrl = $request.Url.LocalPath
        if ($requestUrl -eq '/') {
            $requestUrl = '/index.html'
        }
        
        $filePath = Join-Path $path $requestUrl.TrimStart('/')
        
        Write-Host "Request: $requestUrl" -ForegroundColor Cyan
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            
            # Set content type based on file extension
            $ext = [System.IO.Path]::GetExtension($filePath)
            switch ($ext) {
                '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
                '.js'   { $response.ContentType = 'application/javascript; charset=utf-8' }
                '.json' { $response.ContentType = 'application/json; charset=utf-8' }
                '.png'  { $response.ContentType = 'image/png' }
                '.jpg'  { $response.ContentType = 'image/jpeg' }
                '.jpeg' { $response.ContentType = 'image/jpeg' }
                '.gif'  { $response.ContentType = 'image/gif' }
                '.svg'  { $response.ContentType = 'image/svg+xml' }
                '.ico'  { $response.ContentType = 'image/x-icon' }
                '.woff' { $response.ContentType = 'font/woff' }
                '.woff2' { $response.ContentType = 'font/woff2' }
                '.ttf'  { $response.ContentType = 'font/ttf' }
                '.xml'  { $response.ContentType = 'text/xml' }
                default { $response.ContentType = 'application/octet-stream' }
            }
            
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            Write-Host "File not found: $filePath" -ForegroundColor Red
            $response.StatusCode = 404
            $content = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
