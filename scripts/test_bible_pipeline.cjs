/**
 * TEST VERSION: Download only Genesis and Matthew
 * Tests the complete pipeline with limited data
 */

const { exec } = require('child_process');
const path = require('path');

// Set environment
process.env.NODE_ENV = 'test';

// Modify the main script to only process Genesis and Matthew
const BOOKS_TEST = {
    'GEN': { chapters: 3, name_fa: 'پیدایش', name_en: 'Genesis', order: 1 }, // Only first 3 chapters
    'MAT': { chapters: 2, name_fa: 'متی', name_en: 'Matthew', order: 40 } // Only first 2 chapters
};

console.log('🧪 Testing Bible Pipeline with Limited Data');
console.log('===========================================\n');
console.log('Books to download:');
console.log('- پیدایش (Genesis): chapters 1-3');
console.log('- متی (Matthew): chapters 1-2');
console.log('\nTotal: 5 chapters\n');

// Run the pipeline
const scriptPath = path.join(__dirname, 'complete_bible_pipeline.cjs');
exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }
    console.log(stdout);
});
