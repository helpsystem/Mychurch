import https from 'https';

const url = 'https://www.bible.com/fa/audio-bible/118/GEN.1.NMV';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Data Length:', data.length);

        // Check for Next.js Data
        const nextDataMatch = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (nextDataMatch) {
            console.log('FOUND __NEXT_DATA__!');
            const json = JSON.parse(nextDataMatch[1]);
            // Try to find audio url in the deep nested object
            const jsonString = JSON.stringify(json);
            const mp3Matches = jsonString.match(/https?:\/\/[^"]+\.mp3/g);
            if (mp3Matches) {
                console.log('FOUND MP3 URLs:', mp3Matches.slice(0, 5)); // Show first 5
            } else {
                console.log('No direct MP3 URLs found in NEXT_DATA.');
            }
        } else {
            console.log('__NEXT_DATA__ NOT FOUND.');
        }

        // Check for simple MP3 string in whole body
        const simpleMp3 = data.match(/https?:\/\/[^"]+\.mp3/g);
        if (simpleMp3) {
            console.log('FOUND RAW MP3 STRINGS:', simpleMp3.slice(0, 5));
        }
    });

}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
