/**
 * Apply only high-confidence audio matches (score > 70)
 * This ensures we only fix songs where we're very confident about the match
 */

const fs = require('fs');
const path = require('path');

// Paths
const REPORT_PATH = path.join(__dirname, '../logs/rematch-report.json');
const SONGS_PATH = path.join(__dirname, '../public/worship/data/worship_songs.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Minimum confidence score (70 = High Match or better)
const MIN_CONFIDENCE_SCORE = 70;

console.log('🎯 Applying HIGH CONFIDENCE matches only (score > 70)...\n');

// Load report
if (!fs.existsSync(REPORT_PATH)) {
  console.error('❌ Report file not found. Run rematch-all-songs.js first!');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
console.log('📊 Report Statistics:');
console.log(`   Perfect (90-100): ${report.stats.perfect}`);
console.log(`   High (70-89): ${report.stats.high}`);
console.log(`   Medium (50-69): ${report.stats.medium}`);
console.log(`   Low (30-49): ${report.stats.low}`);
console.log(`   Very Low (0-29): ${report.stats.veryLow}\n`);

// Filter high-confidence changes
const highConfidenceChanges = report.matches.filter(m => 
  m.changed && parseFloat(m.score) >= MIN_CONFIDENCE_SCORE
);

console.log(`✅ Found ${highConfidenceChanges.length} high-confidence changes to apply\n`);

if (highConfidenceChanges.length === 0) {
  console.log('✨ No high-confidence changes to apply!');
  process.exit(0);
}

// Show summary by category
const perfectChanges = highConfidenceChanges.filter(m => parseFloat(m.score) >= 90);
const highChanges = highConfidenceChanges.filter(m => parseFloat(m.score) >= 70 && parseFloat(m.score) < 90);

console.log(`📈 Breakdown:`);
console.log(`   Perfect (90-100): ${perfectChanges.length} changes`);
console.log(`   High (70-89): ${highChanges.length} changes\n`);

// Show first 10 changes
console.log('🔍 First 10 changes to apply:\n');
highConfidenceChanges.slice(0, 10).forEach((m, i) => {
  console.log(`${i + 1}. [${m.score}] ${m.titleFA || m.titleEN}`);
  console.log(`   Old: ${m.oldFile}`);
  console.log(`   New: ${m.newFile}\n`);
});

if (highConfidenceChanges.length > 10) {
  console.log(`... and ${highConfidenceChanges.length - 10} more\n`);
}

// Ask for confirmation
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('❓ Apply these changes? (yes/no): ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    process.exit(0);
  }
  
  applyChanges();
});

function applyChanges() {
  console.log('\n📦 Creating backup...');
  
  // Load current songs
  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  
  // Create backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const backupPath = path.join(BACKUP_DIR, `worship_songs_before_high_confidence_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(songs, null, 2));
  console.log(`✅ Backup created: ${backupPath}\n`);
  
  // Apply changes
  console.log('🔄 Applying changes...\n');
  
  let appliedCount = 0;
  let errorCount = 0;
  
  highConfidenceChanges.forEach(change => {
    try {
      const song = songs.find(s => s.id === change.id);
      if (!song) {
        console.log(`⚠️  Song ${change.id} not found`);
        errorCount++;
        return;
      }
      
      // Update audioUrl
      const oldUrl = song.audioUrl;
      song.audioUrl = `/worship/audio/kalameh/${change.newFile}`;
      
      console.log(`✅ [${change.score}] Updated: ${change.titleFA || change.titleEN}`);
      console.log(`   ${path.basename(oldUrl)} → ${change.newFile}`);
      
      appliedCount++;
    } catch (error) {
      console.error(`❌ Error updating song ${change.id}:`, error.message);
      errorCount++;
    }
  });
  
  // Save updated songs
  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
  
  console.log('\n📊 ==================== SUMMARY ====================');
  console.log(`   ✅ Changes applied: ${appliedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Backup: ${backupPath}`);
  console.log('======================================================\n');
  
  console.log('✨ Done! Now import to database:');
  console.log('   node backend/import-worship-songs.js\n');
}
