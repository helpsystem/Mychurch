/**
 * List available Bibles from API.Bible
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getBibles } = require('../services/apiBibleService');

async function listBibles() {
  console.log('🔄 Fetching available Bibles from API.Bible...\n');

  try {
    const bibles = await getBibles();
    
    // Filter Persian Bibles
    const persianBibles = bibles.filter(b => 
      b.language.id === 'fas' || 
      b.language.id === 'pes' || 
      b.name.toLowerCase().includes('persian') ||
      b.name.toLowerCase().includes('farsi')
    );
    
    console.log('📖 Persian Bibles Available:\n');
    persianBibles.forEach(bible => {
      console.log(`   ID: ${bible.id}`);
      console.log(`   Name: ${bible.name}`);
      console.log(`   Language: ${bible.language.name} (${bible.language.id})`);
      console.log(`   Description: ${bible.description || 'N/A'}`);
      console.log('   ---');
    });
    
    console.log(`\n✅ Found ${persianBibles.length} Persian Bibles\n`);
    
    // Also show all available
    console.log(`📚 Total Bibles Available: ${bibles.length}\n`);
    console.log('To see all Bibles, check: bibles-full-list.json\n');
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('bibles-full-list.json', JSON.stringify(bibles, null, 2));
    console.log('✅ Full list saved to: bibles-full-list.json\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  listBibles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { listBibles };
