const fs = require('fs');
const path = require('path');

// Directory containing crawled Bible.com content
const bibleDir = 'C:\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.bible.com\\audio-bible-app-versions';

function scanAvailableVersions() {
    try {
        const files = fs.readdirSync(bibleDir);
        
        const versionFiles = files.filter(file => 
            file.endsWith('.html.tmp') && 
            file.includes('-') &&
            !file.includes('index')
        );
        
        console.log(`Found ${versionFiles.length} Bible versions:`);
        
        const versions = versionFiles.map(file => {
            const match = file.match(/^(\d+)-(.+)\.html\.tmp$/);
            if (match) {
                const id = match[1];
                const name = match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return {
                    id,
                    filename: file,
                    name,
                    fullPath: path.join(bibleDir, file)
                };
            }
            return null;
        }).filter(Boolean);
        
        // Group by potential language/type
        const grouped = {};
        versions.forEach(version => {
            const name = version.name.toLowerCase();
            let category = 'Other';
            
            if (name.includes('persian') || name.includes('farsi')) {
                category = 'Persian/Farsi';
            } else if (name.includes('arabic')) {
                category = 'Arabic';
            } else if (name.includes('english')) {
                category = 'English';
            } else if (name.includes('spanish') || name.includes('espanol')) {
                category = 'Spanish';
            } else if (name.includes('french') || name.includes('francais')) {
                category = 'French';
            } else if (name.includes('german') || name.includes('deutsch')) {
                category = 'German';
            } else if (name.includes('chinese') || name.includes('mandarin')) {
                category = 'Chinese';
            } else if (name.includes('korean')) {
                category = 'Korean';
            } else if (name.includes('japanese')) {
                category = 'Japanese';
            } else if (name.includes('russian')) {
                category = 'Russian';
            } else if (name.includes('hindi') || name.includes('urdu')) {
                category = 'Hindi/Urdu';
            } else if (name.includes('turkish')) {
                category = 'Turkish';
            }
            
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(version);
        });
        
        // Display grouped versions
        Object.keys(grouped).sort().forEach(category => {
            console.log(`\n📖 ${category}:`);
            grouped[category].forEach(version => {
                console.log(`  ${version.id}: ${version.name}`);
            });
        });
        
        // Save the catalog
        const catalogPath = path.join(__dirname, 'available-bible-versions.json');
        fs.writeFileSync(catalogPath, JSON.stringify({
            totalVersions: versions.length,
            categories: grouped,
            allVersions: versions
        }, null, 2));
        
        console.log(`\n📁 Version catalog saved to: ${catalogPath}`);
        console.log(`\n🎯 Recommended for extraction:`);
        
        // Highlight key versions
        const recommendations = versions.filter(v => {
            const name = v.name.toLowerCase();
            return name.includes('persian') || 
                   name.includes('arabic') || 
                   name.includes('english') ||
                   name.includes('spanish') ||
                   name.includes('french');
        });
        
        recommendations.slice(0, 10).forEach(version => {
            console.log(`  🔹 ${version.id}: ${version.name}`);
        });
        
        return versions;
        
    } catch (error) {
        console.error('Error scanning versions:', error.message);
        return [];
    }
}

// Extract specific version by ID or filename pattern
async function extractSpecificVersion(versionId) {
    const versions = scanAvailableVersions();
    const version = versions.find(v => v.id === versionId || v.filename.includes(versionId));
    
    if (!version) {
        console.error(`Version ${versionId} not found!`);
        return null;
    }
    
    console.log(`\nExtracting: ${version.name} (${version.id})`);
    
    try {
        const { extractBibleStructure } = require('./extract-bible-structure');
        
        // Temporarily modify the path in the extraction function
        const originalPath = 'C:\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.bible.com\\audio-bible-app-versions\\101-nav-new-arabic-version.html.tmp';
        
        // Read and modify the extraction script content
        const htmlContent = fs.readFileSync(version.fullPath, 'utf-8');
        
        // Check if this has the expected JSON structure
        if (!htmlContent.includes('__NEXT_DATA__')) {
            console.log(`⚠️  ${version.name} doesn't contain structured data - skipping`);
            return null;
        }
        
        console.log(`✅ ${version.name} contains structured data - ready for extraction`);
        return version;
        
    } catch (error) {
        console.error(`Error extracting ${version.name}:`, error.message);
        return null;
    }
}

// Main function to scan and report
if (require.main === module) {
    console.log('🔍 Scanning available Bible versions...\n');
    
    const versions = scanAvailableVersions();
    
    console.log(`\n📊 Summary:`);
    console.log(`Total versions found: ${versions.length}`);
    
    if (process.argv[2]) {
        const versionId = process.argv[2];
        console.log(`\nExtracting specific version: ${versionId}`);
        extractSpecificVersion(versionId);
    }
}

module.exports = {
    scanAvailableVersions,
    extractSpecificVersion
};