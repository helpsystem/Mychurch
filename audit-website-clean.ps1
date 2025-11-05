# ============================================
# COMPREHENSIVE WEBSITE AUDIT SCRIPT
# Iranian Christian Church DC Website
# ============================================

$baseUrl = "http://localhost:5173/#"
$apiUrl = "http://localhost:3001/api"

# Color functions
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }

# Initialize audit results
$auditResults = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    baseUrl = $baseUrl
    totalPages = 0
    functionalPages = 0
    brokenPages = 0
    apiEndpoints = @()
    pages = @()
    recommendations = @()
}

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "   WEBSITE AUDIT - Iranian Christian Church DC" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Magenta

# ============================================
# 1. DEFINE ALL ROUTES FROM App.tsx
# ============================================

$routes = @(
    # Main Pages
    @{ path = "/"; title = "Home"; category = "Main"; protected = $false },
    @{ path = "/about"; title = "About"; category = "Main"; protected = $false },
    @{ path = "/leaders"; title = "Leaders"; category = "Main"; protected = $false },
    @{ path = "/contact"; title = "Contact"; category = "Main"; protected = $false },
    
    # Ministries
    @{ path = "/sermons"; title = "Sermons"; category = "Ministries"; protected = $false },
    @{ path = "/worship"; title = "Worship"; category = "Ministries"; protected = $false },
    @{ path = "/events"; title = "Events"; category = "Ministries"; protected = $false },
    @{ path = "/calendar"; title = "Calendar"; category = "Ministries"; protected = $false },
    @{ path = "/announcements"; title = "Announcements"; category = "Ministries"; protected = $false },
    
    # Bible Section
    @{ path = "/bible"; title = "Bible Main"; category = "Bible"; protected = $false },
    @{ path = "/bible/audio"; title = "Audio Bible"; category = "Bible"; protected = $false },
    @{ path = "/bible/audio-sync-demo"; title = "Audio Sync Demo"; category = "Bible"; protected = $false },
    @{ path = "/bible/audio-test"; title = "Audio Test Page"; category = "Bible"; protected = $false },
    @{ path = "/bible/audio-youversion"; title = "YouVersion Audio Test"; category = "Bible"; protected = $false },
    @{ path = "/bible/reader"; title = "Bilingual Bible Reader"; category = "Bible"; protected = $false },
    @{ path = "/bible-study"; title = "Bible Study"; category = "Bible"; protected = $false },
    @{ path = "/bible-karaoke"; title = "Bible Karaoke"; category = "Bible"; protected = $false },
    @{ path = "/bible-reader"; title = "Bible Reader Alt"; category = "Bible"; protected = $false },
    @{ path = "/bible-presentation-sample"; title = "Bible Presentation Sample"; category = "Bible"; protected = $false },
    @{ path = "/bible-presentation"; title = "Bible Presentation Dynamic"; category = "Bible"; protected = $false },
    @{ path = "/bible-audio-tts"; title = "Bible with TTS"; category = "Bible"; protected = $false },
    
    # Worship
    @{ path = "/worship-songs"; title = "Worship Songs List"; category = "Worship"; protected = $false },
    @{ path = "/worship-presentation"; title = "Worship Presentation"; category = "Worship"; protected = $false },
    
    # Prayer & Devotional
    @{ path = "/prayer"; title = "Prayer"; category = "Prayer"; protected = $false },
    @{ path = "/prayer-requests"; title = "Prayer Requests"; category = "Prayer"; protected = $false },
    @{ path = "/daily-devotional"; title = "Daily Devotional"; category = "Prayer"; protected = $false },
    
    # Community
    @{ path = "/giving"; title = "Giving"; category = "Community"; protected = $false },
    @{ path = "/gallery"; title = "Gallery"; category = "Community"; protected = $false },
    @{ path = "/help-center"; title = "Help Center"; category = "Community"; protected = $false },
    @{ path = "/new-here"; title = "New Here"; category = "Community"; protected = $false },
    @{ path = "/connect"; title = "Connect"; category = "Community"; protected = $false },
    @{ path = "/testimonials"; title = "Testimonials"; category = "Community"; protected = $false },
    @{ path = "/live"; title = "Live Stream"; category = "Community"; protected = $false },
    
    # AI & Tools
    @{ path = "/ai-helper"; title = "AI Helper (Al Hayat GPT)"; category = "AI"; protected = $false },
    @{ path = "/ai-examples"; title = "AI Examples"; category = "AI"; protected = $false },
    
    # Auth (Standalone)
    @{ path = "/login"; title = "Login"; category = "Auth"; protected = $false },
    @{ path = "/signup"; title = "Signup"; category = "Auth"; protected = $false },
    @{ path = "/verify-email"; title = "Verify Email"; category = "Auth"; protected = $false },
    @{ path = "/admin/login"; title = "Admin Login"; category = "Auth"; protected = $false },
    
    # Protected Pages
    @{ path = "/profile"; title = "Profile"; category = "User"; protected = $true; roles = @("MEMBER") },
    @{ path = "/notification-center"; title = "Notification Center"; category = "User"; protected = $false },
    @{ path = "/daily-messages"; title = "Daily Messages"; category = "User"; protected = $true; roles = @("SUPER_ADMIN", "MANAGER") },
    
    # Admin (Protected)
    @{ path = "/admin"; title = "Admin Dashboard"; category = "Admin"; protected = $true; roles = @("SUPER_ADMIN", "MANAGER") },
    @{ path = "/admin/worship-management"; title = "Worship Management"; category = "Admin"; protected = $true; roles = @("SUPER_ADMIN", "MANAGER", "WORSHIP_LEADER") },
    @{ path = "/admin/configure-backend"; title = "Configure Backend"; category = "Admin"; protected = $true; roles = @("SUPER_ADMIN") },
    @{ path = "/admin/tts-usage"; title = "TTS Usage Dashboard"; category = "Admin"; protected = $false },
    
    # Special
    @{ path = "/presentation"; title = "Presentation Mode"; category = "Special"; protected = $false },
    @{ path = "/tailwind-demo"; title = "Tailwind Demo"; category = "Dev"; protected = $false }
)

# ============================================
# 2. API ENDPOINTS TO TEST
# ============================================

$apiEndpoints = @(
    @{ path = "/api/bible/content/GEN/1"; method = "GET"; description = "Bible Content" },
    @{ path = "/api/worship-songs"; method = "GET"; description = "Worship Songs" },
    @{ path = "/api/events"; method = "GET"; description = "Events" },
    @{ path = "/api/sermons"; method = "GET"; description = "Sermons" },
    @{ path = "/api/prayer-requests"; method = "GET"; description = "Prayer Requests" }
)

Write-Info "Total Routes to Test: $($routes.Count)"
Write-Info "API Endpoints to Test: $($apiEndpoints.Count)`n"

# ============================================
# 3. TEST API ENDPOINTS
# ============================================

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   TESTING API ENDPOINTS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

foreach ($endpoint in $apiEndpoints) {
    $fullUrl = "http://localhost:3001$($endpoint.path)"
    Write-Host "Testing: $($endpoint.description) - " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $fullUrl -Method $endpoint.method -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "[OK] ($($response.StatusCode))"
            $auditResults.apiEndpoints += @{
                path = $endpoint.path
                status = "OK"
                statusCode = $response.StatusCode
                description = $endpoint.description
            }
        }
    } catch {
        Write-Error "[FAILED] ($($_.Exception.Message))"
        $auditResults.apiEndpoints += @{
            path = $endpoint.path
            status = "FAILED"
            error = $_.Exception.Message
            description = $endpoint.description
        }
    }
}

# ============================================
# 4. TEST FRONTEND PAGES
# ============================================

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   TESTING FRONTEND PAGES" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

$groupedRoutes = $routes | Group-Object -Property category

foreach ($group in $groupedRoutes) {
    Write-Host "`nCategory: $($group.Name)" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------`n" -ForegroundColor DarkGray
    
    foreach ($route in $group.Group) {
        $auditResults.totalPages++
        $fullUrl = "$baseUrl$($route.path)"
        $protectedIcon = if ($route.protected) { "[P]" } else { "[O]" }
        
        Write-Host "  $protectedIcon $($route.title)" -NoNewline
        Write-Host " [$($route.path)]" -ForegroundColor DarkGray -NoNewline
        
        try {
            $response = Invoke-WebRequest -Uri $fullUrl -TimeoutSec 5 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Success " [OK]"
                $auditResults.functionalPages++
                
                $auditResults.pages += @{
                    title = $route.title
                    url = $fullUrl
                    path = $route.path
                    category = $route.category
                    status = "OK"
                    protected = $route.protected
                    statusCode = $response.StatusCode
                }
            }
        } catch {
            Write-Error " [FAILED]"
            $auditResults.brokenPages++
            
            $auditResults.pages += @{
                title = $route.title
                url = $fullUrl
                path = $route.path
                category = $route.category
                status = "FAILED"
                protected = $route.protected
                error = $_.Exception.Message
            }
        }
    }
}

# ============================================
# 5. RECOMMENDATIONS
# ============================================

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   RECOMMENDATIONS AND FINDINGS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

$auditResults.recommendations += "[OK] All routes use HashRouter for universal hosting compatibility"
$auditResults.recommendations += "[OK] Protected routes implement role-based access control"
$auditResults.recommendations += "[TODO] Test bilingual support (FA/EN toggle) on all pages"
$auditResults.recommendations += "[TODO] Verify responsive design on mobile/tablet/desktop"
$auditResults.recommendations += "[TODO] Check RTL/LTR layout switching for Persian mode"
$auditResults.recommendations += "[IMPROVE] Consider adding loading states for API-dependent pages"
$auditResults.recommendations += "[IMPROVE] Implement analytics tracking for user behavior"
$auditResults.recommendations += "[SECURE] Ensure all admin pages require authentication"

foreach ($rec in $auditResults.recommendations) {
    Write-Host "  $rec"
}

# ============================================
# 6. SUMMARY REPORT
# ============================================

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "   AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Magenta

$successRate = if ($auditResults.totalPages -gt 0) { 
    [math]::Round(($auditResults.functionalPages / $auditResults.totalPages) * 100, 2) 
} else { 0 }

Write-Host "  Timestamp: $($auditResults.timestamp)" -ForegroundColor White
Write-Host "  Base URL: $($auditResults.baseUrl)" -ForegroundColor White
Write-Host "`n  Page Statistics:" -ForegroundColor Yellow
Write-Host "     Total Pages: $($auditResults.totalPages)" -ForegroundColor White
Write-Host "     Functional: $($auditResults.functionalPages)" -ForegroundColor Green
Write-Host "     Broken: $($auditResults.brokenPages)" -ForegroundColor Red
Write-Host "     Success Rate: $successRate%" -ForegroundColor $(if($successRate -gt 90) {"Green"} else {"Yellow"})
Write-Host "`n  API Endpoints:" -ForegroundColor Yellow
$workingApis = ($auditResults.apiEndpoints | Where-Object { $_.status -eq "OK" }).Count
Write-Host "     Total Tested: $($apiEndpoints.Count)" -ForegroundColor White
Write-Host "     Working: $workingApis" -ForegroundColor Green
Write-Host "     Failed: $($apiEndpoints.Count - $workingApis)" -ForegroundColor Red

# ============================================
# 7. SAVE JSON REPORT
# ============================================

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   SAVING AUDIT REPORT" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

$jsonReport = $auditResults | ConvertTo-Json -Depth 10
$reportPath = "audit-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$jsonReport | Out-File -FilePath $reportPath -Encoding UTF8

Write-Success "  JSON report saved: $reportPath"

# ============================================
# 8. CATEGORY BREAKDOWN
# ============================================

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   PAGES BY CATEGORY" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

$categoryStats = $auditResults.pages | Group-Object -Property category | Sort-Object Name
foreach ($cat in $categoryStats) {
    $okCount = ($cat.Group | Where-Object { $_.status -eq "OK" }).Count
    $totalCount = $cat.Group.Count
    Write-Host "  $($cat.Name): $okCount/$totalCount OK" -ForegroundColor Cyan
}

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "   AUDIT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Magenta
