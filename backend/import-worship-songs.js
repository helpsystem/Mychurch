// Import worship songs from JSON to database (only local files)
require('dotenv').config();
const { pool } = require('./db-postgres');
const fs = require('fs');
const path = require('path');

async function importWorshipSongs() {
  const client = await pool.connect();
  
  try {
    console.log('📂 Reading worship songs JSON file...\n');
    
    // خواندن فایل JSON
    const jsonPath = path.join(__dirname, '../public/worship/data/worship_songs.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${jsonData.length} songs in JSON file\n`);
    console.log('� Updating songs with matched files...\n');
    
    let updated = 0;
    let withAudio = 0;
    let withPDF = 0;
    let errors = 0;
    
    for (const song of jsonData) {
      const songTitle = song.title?.fa || song.title?.en || 'Unknown';
      
      // فقط اگر audioUrl یا pdfFileUrl از kalameh باشد
      const hasKalamehAudio = song.audioUrl && song.audioUrl.includes('/kalameh/');
      const hasKalamehPDF = song.pdfFileUrl && song.pdfFileUrl.includes('/kalameh/');
      
      if (!hasKalamehAudio && !hasKalamehPDF) {
        continue;
      }
      
      try {
        // به‌روزرسانی فقط audioUrl و pdfFileUrl
        const query = `
          UPDATE worship_songs 
          SET 
            audiourl = COALESCE($1, audiourl),
            pdf_file_url = COALESCE($2, pdf_file_url)
          WHERE id = $3
        `;
        
        const result = await client.query(query, [
          hasKalamehAudio ? song.audioUrl : null,
          hasKalamehPDF ? song.pdfFileUrl : null,
          song.id
        ]);
        
        if (result.rowCount > 0) {
          updated++;
          if (hasKalamehAudio) withAudio++;
          if (hasKalamehPDF) withPDF++;
          
          if (updated % 20 === 0) {
            console.log(`   ✅ Updated ${updated} songs...`);
          }
        }
        
      } catch (err) {
        errors++;
        console.error(`   ❌ Error updating ${songTitle}: ${err.message}`);
      }
    }
    
    console.log('\n📊 ==================== UPDATE SUMMARY ====================');
    console.log(`   ✅ Songs updated: ${updated}`);
    console.log(`   🎵 With audio files: ${withAudio}`);
    console.log(`   📄 With PDF files: ${withPDF}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('==========================================================\n');
    
    if (errors === 0 && updated > 0) {
      console.log('🎉 All matched files imported successfully!');
      console.log('🌐 Visit http://localhost:5173/#/worship to see changes\n');
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// اجرای import
if (require.main === module) {
  importWorshipSongs()
    .then(() => {
      console.log('\n✅ Done');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { importWorshipSongs };
