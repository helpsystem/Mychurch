const fs = require('fs');
const path = require('path');

// Get command line arguments
const versionId = process.argv[2] || '101';
const languageName = process.argv[3] || 'Arabic';

// Base path to the Bible versions directory
const baseBiblePath = 'C:\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.bible.com\\audio-bible-app-versions';

function extractBibleStructure(versionId, languageName) {
    try {
        // Find the HTML file for this version
        const files = fs.readdirSync(baseBiblePath);
        const versionFile = files.find(file => file.startsWith(`${versionId}-`));
        
        if (!versionFile) {
            throw new Error(`Could not find HTML file for version ${versionId}`);
        }
        
        const versionPath = path.join(baseBiblePath, versionFile);
        console.log(`📖 Reading file: ${versionPath}`);
        
        const htmlContent = fs.readFileSync(versionPath, 'utf-8');
        
        // Extract the JSON data from the __NEXT_DATA__ script tag
        const scriptTagStart = htmlContent.indexOf('<script id="__NEXT_DATA__"');
        if (scriptTagStart === -1) {
            throw new Error('Could not find __NEXT_DATA__ script tag');
        }
        
        const jsonStart = htmlContent.indexOf('>', scriptTagStart) + 1;
        const jsonEnd = htmlContent.indexOf('</script>', jsonStart);
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('Could not extract JSON from script tag');
        }
        
        const jsonStr = htmlContent.substring(jsonStart, jsonEnd).trim();
        const data = JSON.parse(jsonStr);
        
        // Extract version and books data
        const version = data.props.pageProps.version;
        const books = version.books;
        
        console.log(`Extracted Bible structure for: ${version.title} (${version.local_title})`);
        console.log(`Total books: ${books.length}`);
        
        // Structure the data for our database
        const bibleStructure = {
            version: {
                id: version.id,
                abbreviation: version.abbreviation,
                local_abbreviation: version.local_abbreviation,
                title: version.title,
                local_title: version.local_title,
                language: version.language,
                audio: version.audio,
                copyright_short: version.copyright_short,
                copyright_long: version.copyright_long,
                publisher: version.publisher
            },
            books: books.map(book => ({
                usfm: book.usfm,
                title: book.human,
                title_long: book.human_long,
                abbreviation: book.abbreviation,
                canon: book.canon,
                audio: book.audio,
                text: book.text,
                chapters: book.chapters.filter(ch => ch.canonical).map(ch => ({
                    usfm: ch.usfm,
                    number: ch.human,
                    canonical: ch.canonical
                }))
            }))
        };
        
        // Save the extracted structure
        const outputFileName = `bible-structure-${languageName.toLowerCase()}.json`;
        const outputPath = path.join(__dirname, outputFileName);
        fs.writeFileSync(outputPath, JSON.stringify(bibleStructure, null, 2));
        
        console.log(`Bible structure saved to: ${outputPath}`);
        console.log(`\nSample books extracted:`);
        bibleStructure.books.slice(0, 5).forEach(book => {
            console.log(`- ${book.title} (${book.usfm}) - ${book.chapters.length} chapters`);
        });
        
        return bibleStructure;
        
    } catch (error) {
        console.error('Error extracting Bible structure:', error.message);
        throw error;
    }
}

// Run the extraction
if (require.main === module) {
    extractBibleStructure(versionId, languageName);
}

module.exports = { extractBibleStructure };