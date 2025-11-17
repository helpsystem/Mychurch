#!/usr/bin/env node

/**
 * 🔍 Site Health Check Report
 * بررسی جامع تمام صفحات و قابلیت‌های سایت
 * 
 * این اسکریپت:
 * 1. تمام صفحات رو لیست می‌کنه
 * 2. ارورهای احتمالی رو پیدا می‌کنه
 * 3. مشکلات loading تصاویر رو چک می‌کنه
 * 4. API calls رو بررسی می‌کنه
 * 5. گزارش کامل تهیه می‌کنه
 */

const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// لیست صفحات از App.tsx
const PAGES_TO_CHECK = {
  'صفحات اصلی': [
    { name: 'Home', path: 'pages/HomePage.tsx', route: '/' },
    { name: 'About', path: 'pages/AboutPage.tsx', route: '/about' },
    { name: 'Contact', path: 'pages/ContactPage.tsx', route: '/contact' }
  ],
  'سرودهای پرستشی': [
    { name: 'Worship Main', path: 'pages/WorshipPage.tsx', route: '/worship' },
    { name: 'Worship Songs', path: 'pages/WorshipSongsPage.tsx', route: '/worship-songs' },
    { name: 'Worship Song Viewer', path: 'pages/WorshipSongViewerPage.tsx', route: '/worship/:id' },
    { name: 'Worship Presentation', path: 'pages/WorshipPresentationPage.tsx', route: '/worship-presentation' },
    { name: 'Worship Audio Suite', path: 'pages/WorshipAudioSuitePage.tsx', route: '/worship/audio-suite' },
    { name: 'Worship Sync Test', path: 'pages/WorshipSyncTestPage.tsx', route: '/worship/sync-test' }
  ],
  'کتاب مقدس': [
    { name: 'Bible Main', path: 'pages/BiblePage.tsx', route: '/bible' },
    { name: 'Bible Reader (Bilingual)', path: 'pages/BilingualBibleReader.tsx', route: '/bible/reader' },
    { name: 'Bible Study', path: 'pages/BibleStudyPage.tsx', route: '/bible-study' },
    { name: 'Bible Karaoke', path: 'pages/BibleKaraokeReader.tsx', route: '/bible-karaoke' },
    { name: 'Bible Text Only', path: 'pages/BibleTextOnlyPage.tsx', route: '/bible/text-only' },
    { name: 'Bible Viewer', path: 'pages/BibleViewer.tsx', route: '/' },
    { name: 'Bible Flipbook 3D', path: 'pages/BibleFlipbook3DPage.tsx', route: '/' }
  ],
  'کتاب مقدس صوتی': [
    { name: 'Audio Bible', path: 'pages/AudioBiblePage.tsx', route: '/bible/audio' },
    { name: 'Bible Audio Suite', path: 'pages/BibleAudioSuitePage.tsx', route: '/bible/audio-suite' },
    { name: 'Bible Audio Sync', path: 'pages/BibleAudioSyncPage.tsx', route: '/bible/audio-sync' },
    { name: 'Bible Audio Sync Demo', path: 'pages/BibleAudioSyncDemoPage.tsx', route: '/bible/audio-sync-demo' },
    { name: 'Bible Audio Test', path: 'pages/BibleAudioTestPage.tsx', route: '/bible/audio-test' },
    { name: 'Bible With TTS', path: 'pages/BibleWithTTS.tsx', route: '/bible-audio-tts' },
    { name: 'Bible TTS', path: 'pages/BibleTTSPage.tsx', route: '/' },
    { name: 'Persian Bible TTS', path: 'pages/PersianBibleTTSPage.tsx', route: '/' },
    { name: 'Bible Voice Chat', path: 'pages/BibleVoiceChatPage.tsx', route: '/bible/voice-chat' }
  ],
  'هوش مصنوعی الحیات': [
    { name: 'AI Helper', path: 'pages/AiHelperPage.tsx', route: '/ai-helper' },
    { name: 'AI Examples', path: 'pages/AlHayatGPTExamplesPage.tsx', route: '/ai-examples' },
    { name: 'Bible AI Chat (Component)', path: 'components/BibleAIChatWidget.tsx', route: '/* (همه صفحات)' }
  ],
  'صفحات کاربران': [
    { name: 'Login', path: 'pages/LoginPage.tsx', route: '/login' },
    { name: 'Signup', path: 'pages/SignupPage.tsx', route: '/signup' },
    { name: 'Profile', path: 'pages/ProfilePage.tsx', route: '/profile' },
    { name: 'Verify Email', path: 'pages/VerifyEmailPage.tsx', route: '/verify-email' }
  ],
  'Admin Dashboard': [
    { name: 'Admin Login', path: 'pages/AdminLoginPage.tsx', route: '/admin/login' },
    { name: 'Admin Dashboard', path: 'pages/AdminDashboardPage.tsx', route: '/admin' },
    { name: 'Admin Worship Management', path: 'pages/AdminWorshipManagementPage.tsx', route: '/admin/worship-management' },
    { name: 'Admin Configure Backend', path: 'pages/ConfigureBackendPage.tsx', route: '/admin/configure-backend' },
    { name: 'Admin N8N Automation', path: 'pages/AdminN8NAutomationPage.tsx', route: '/admin/automations' },
    { name: 'Admin Audio Dashboard', path: 'pages/AdminAudioDashboardPage.tsx', route: '/admin/audio-manager' },
    { name: 'Admin Sync Management', path: 'pages/AdminSyncManagementPage.tsx', route: '/admin/sync-management' },
    { name: 'Admin TTS Usage', path: 'pages/TTSUsageDashboard.tsx', route: '/admin/tts-usage' },
    { name: 'Bible Admin Upload', path: 'pages/BibleAdminUpload.tsx', route: '/' }
  ],
  'صفحات رهبران و اعضا': [
    { name: 'Leaders', path: 'pages/LeadersPage.tsx', route: '/leaders' },
    { name: 'Sermons', path: 'pages/SermonsPage.tsx', route: '/sermons' },
    { name: 'Events', path: 'pages/EventsPage.tsx', route: '/events' },
    { name: 'Calendar', path: 'pages/CalendarPage.tsx', route: '/calendar' },
    { name: 'Announcements', path: 'pages/AnnouncementsPage.tsx', route: '/announcements' },
    { name: 'Prayer', path: 'pages/PrayerPage.tsx', route: '/prayer' },
    { name: 'Prayer Requests', path: 'pages/PrayerRequestsPage.tsx', route: '/prayer-requests' },
    { name: 'Giving', path: 'pages/GivingPage.tsx', route: '/giving' }
  ],
  'صفحات دیگر': [
    { name: 'Gallery', path: 'pages/GalleryPage.tsx', route: '/gallery' },
    { name: 'Help Center', path: 'pages/HelpCenterPage.tsx', route: '/help-center' },
    { name: 'New Here', path: 'pages/NewHerePage.tsx', route: '/new-here' },
    { name: 'Connect', path: 'pages/ConnectPage.tsx', route: '/connect' },
    { name: 'Testimonials', path: 'pages/TestimonialsPage.tsx', route: '/testimonials' },
    { name: 'Live', path: 'pages/LivePage.tsx', route: '/live' },
    { name: 'Daily Devotional', path: 'pages/DailyDevotionalPage.tsx', route: '/daily-devotional' },
    { name: 'Daily Messages', path: 'pages/DailyMessagesPage.tsx', route: '/daily-messages' },
    { name: 'Notification Center', path: 'pages/NotificationCenterPage.tsx', route: '/notification-center' },
    { name: 'Presentation', path: 'pages/PresentationPage.tsx', route: '/presentation' },
    { name: 'Presentation Creator', path: 'pages/PresentationCreatorPage.tsx', route: '/presentation-creator' }
  ]
};

/**
 * بررسی یک فایل برای یافتن مشکلات
 */
async function analyzeFile(filePath) {
  const issues = {
    errors: [],
    warnings: [],
    imageIssues: [],
    apiCalls: [],
    missingHandlers: []
  };

  try {
    const content = await fs.readFile(filePath, 'utf8');

    // 1. پیدا کردن console.error
    const errorMatches = content.match(/console\.(error|warn)\([^)]+\)/g);
    if (errorMatches) {
      issues.errors.push(...errorMatches);
    }

    // 2. پیدا کردن try-catch بدون error handling
    const tryCatchMatches = content.match(/catch\s*\([^)]*\)\s*{[^}]*}/g);
    if (tryCatchMatches) {
      tryCatchMatches.forEach(match => {
        if (!match.includes('console.error') && !match.includes('setError')) {
          issues.missingHandlers.push('Empty catch block found');
        }
      });
    }

    // 3. پیدا کردن مشکلات تصاویر
    const imgMatches = content.match(/<img[^>]*src=['"]([^'"]+)['"]/g);
    if (imgMatches) {
      imgMatches.forEach(match => {
        const src = match.match(/src=['"]([^'"]+)['"]/)?.[1];
        if (src && !src.startsWith('http') && !src.startsWith('/')) {
          issues.imageIssues.push(`Relative image path: ${src}`);
        }
      });
    }

    // 4. پیدا کردن API calls
    const apiMatches = content.match(/(fetch|axios\.(get|post|put|delete))\([^)]+\)/g);
    if (apiMatches) {
      issues.apiCalls.push(...apiMatches.slice(0, 3)); // فقط 3 تا اول
    }

    // 5. بررسی استفاده از useEffect بدون dependency array
    const useEffectMatches = content.match(/useEffect\([^,]+\)/g);
    if (useEffectMatches) {
      issues.warnings.push(`${useEffectMatches.length} useEffect without dependencies`);
    }

    return issues;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { fileNotFound: true };
    }
    return { readError: error.message };
  }
}

/**
 * نمایش گزارش یک دسته
 */
async function checkCategory(categoryName, pages) {
  console.log(`\n${colors.cyan}${colors.bright}═══ ${categoryName} ═══${colors.reset}\n`);

  const results = [];

  for (const page of pages) {
    process.stdout.write(`  Checking ${page.name}... `);

    const issues = await analyzeFile(page.path);

    if (issues.fileNotFound) {
      process.stdout.write(`${colors.red}✗ File Not Found${colors.reset}\n`);
      results.push({ page, status: 'missing' });
    } else if (issues.readError) {
      process.stdout.write(`${colors.red}✗ Read Error${colors.reset}\n`);
      results.push({ page, status: 'error', error: issues.readError });
    } else {
      const hasIssues = issues.errors.length > 0 || 
                       issues.warnings.length > 0 || 
                       issues.imageIssues.length > 0 ||
                       issues.missingHandlers.length > 0;

      if (hasIssues) {
        process.stdout.write(`${colors.yellow}⚠ Issues Found${colors.reset}\n`);
        results.push({ page, status: 'warning', issues });
      } else {
        process.stdout.write(`${colors.green}✓ OK${colors.reset}\n`);
        results.push({ page, status: 'ok', issues });
      }
    }
  }

  return results;
}

/**
 * نمایش خلاصه نهایی
 */
function displaySummary(allResults) {
  console.log(`\n${colors.cyan}${colors.bright}
╔════════════════════════════════════════════╗
║         📊 SITE HEALTH SUMMARY             ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  let totalPages = 0;
  let okPages = 0;
  let warningPages = 0;
  let missingPages = 0;
  let errorPages = 0;

  Object.entries(allResults).forEach(([category, results]) => {
    totalPages += results.length;
    okPages += results.filter(r => r.status === 'ok').length;
    warningPages += results.filter(r => r.status === 'warning').length;
    missingPages += results.filter(r => r.status === 'missing').length;
    errorPages += results.filter(r => r.status === 'error').length;

    console.log(`${colors.bright}${category}:${colors.reset}`);
    console.log(`  ✅ OK:       ${colors.green}${results.filter(r => r.status === 'ok').length}${colors.reset}`);
    console.log(`  ⚠️  Warning:  ${colors.yellow}${results.filter(r => r.status === 'warning').length}${colors.reset}`);
    console.log(`  ❌ Missing:  ${colors.red}${results.filter(r => r.status === 'missing').length}${colors.reset}`);
    console.log(`  🔴 Error:    ${colors.red}${results.filter(r => r.status === 'error').length}${colors.reset}\n`);
  });

  console.log(`${colors.magenta}${colors.bright}
─────────────────────────────────────────────
TOTAL:
  📄 Pages:    ${totalPages}
  ✅ OK:       ${okPages} (${Math.round(okPages/totalPages*100)}%)
  ⚠️  Warning:  ${warningPages} (${Math.round(warningPages/totalPages*100)}%)
  ❌ Missing:  ${missingPages}
  🔴 Error:    ${errorPages}
─────────────────────────────────────────────${colors.reset}
`);
}

/**
 * نمایش جزئیات صفحات با مشکل
 */
function displayDetailedIssues(allResults) {
  console.log(`\n${colors.yellow}${colors.bright}⚠️  DETAILED ISSUES:${colors.reset}\n`);

  let hasAnyIssues = false;

  Object.entries(allResults).forEach(([category, results]) => {
    const problemPages = results.filter(r => r.status === 'warning' || r.status === 'missing' || r.status === 'error');
    
    if (problemPages.length > 0) {
      hasAnyIssues = true;
      console.log(`${colors.cyan}${category}:${colors.reset}`);

      problemPages.forEach(({ page, status, issues, error }) => {
        console.log(`\n  📄 ${colors.bright}${page.name}${colors.reset} (${page.route})`);
        console.log(`     File: ${page.path}`);

        if (status === 'missing') {
          console.log(`     ${colors.red}❌ File not found${colors.reset}`);
        } else if (status === 'error') {
          console.log(`     ${colors.red}🔴 Read error: ${error}${colors.reset}`);
        } else if (issues) {
          if (issues.errors.length > 0) {
            console.log(`     ${colors.red}Errors: ${issues.errors.length}${colors.reset}`);
          }
          if (issues.warnings.length > 0) {
            console.log(`     ${colors.yellow}Warnings: ${issues.warnings.join(', ')}${colors.reset}`);
          }
          if (issues.imageIssues.length > 0) {
            console.log(`     ${colors.yellow}Image Issues: ${issues.imageIssues.length}${colors.reset}`);
          }
          if (issues.missingHandlers.length > 0) {
            console.log(`     ${colors.yellow}Missing Handlers: ${issues.missingHandlers.length}${colors.reset}`);
          }
          if (issues.apiCalls.length > 0) {
            console.log(`     ${colors.cyan}API Calls: ${issues.apiCalls.length}+${colors.reset}`);
          }
        }
      });
    }
  });

  if (!hasAnyIssues) {
    console.log(`${colors.green}✅ No issues found!${colors.reset}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════╗
║      🔍 SITE HEALTH CHECK REPORT           ║
║   بررسی جامع تمام صفحات و قابلیت‌ها        ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  console.log(`${colors.yellow}Starting comprehensive site analysis...${colors.reset}`);

  const allResults = {};

  // بررسی هر دسته
  for (const [categoryName, pages] of Object.entries(PAGES_TO_CHECK)) {
    allResults[categoryName] = await checkCategory(categoryName, pages);
  }

  // نمایش خلاصه
  displaySummary(allResults);

  // نمایش جزئیات مشکلات
  displayDetailedIssues(allResults);

  console.log(`\n${colors.cyan}📝 Next Steps:${colors.reset}`);
  console.log(`1. Fix missing files`);
  console.log(`2. Review warnings and improve error handling`);
  console.log(`3. Test image loading on actual site`);
  console.log(`4. Check API endpoints`);
  console.log(`5. Review empty catch blocks\n`);
}

main();
