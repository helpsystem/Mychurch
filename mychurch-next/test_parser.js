const fs = require('fs');
const JSZip = require('jszip');

const zipPath = "C:\\Users\\SamYar\\Downloads\\Music\\Worship Center - MyChurch_2_all_files.zip";

async function test() {
    const data = fs.readFileSync(zipPath);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);

    const masterFileEntry = Object.values(loadedZip.files).find(f => f.name.endsWith('project_master.json'));
    const timingFileEntry = Object.values(loadedZip.files).find(f => f.name.endsWith('timing.json'));
    const chordsFileEntry = Object.values(loadedZip.files).find(f => f.name.endsWith('chords.txt'));

    let lyricsFa = "";
    let lyricsFinglish = "";
    let lyricsEn = "";
    let chords = "";
    let audioUrl = "";
    let convertedTimingData = null;
    let flatTimepoints = [];

    if (masterFileEntry) {
        console.log("Using project_master.json path...");
        const masterText = await masterFileEntry.async('text');
        const masterJson = JSON.parse(masterText);

        const originalLines = masterJson.original?.lines || [];
        const transFa = masterJson.translations?.persian || [];
        const transEn = masterJson.translations?.english || [];
        const transFinglish = masterJson.translations?.finglish || [];

        lyricsFa = originalLines.map((l) => l.content || "").join("\n");
        lyricsFinglish = transFinglish.length > 0 ? transFinglish.join("\n") : "";
        lyricsEn = transEn.length > 0 ? transEn.join("\n") : "";
        chords = masterJson.chords || "";

        if (masterJson.metadata?.fileName) {
            audioUrl = `/worship/audio/kalameh/${masterJson.metadata.fileName}`;
        } else if (masterJson.metadata?.filename) {
            audioUrl = `/worship/audio/kalameh/${masterJson.metadata.filename}`;
        }

        const convertedLines = originalLines.map((item, idx) => ({
            line: item.content || "",
            start: item.words?.[0]?.start_time !== undefined ? item.words[0].start_time : 0,
            end: item.words?.[item.words.length - 1]?.end_time !== undefined ? item.words[item.words.length - 1].end_time : 0,
            translations: {
                persian: transFa[idx] || "",
                english: transEn[idx] || "",
                finglish: transFinglish[idx] || ""
            },
            words: (item.words || []).map((w) => ({
                word: w.word || "",
                start: w.start_time !== undefined ? w.start_time : w.start,
                end: w.end_time !== undefined ? w.end_time : w.end
            }))
        }));

        convertedTimingData = {
            songId: 0,
            version: "2.0",
            totalDuration: 0,
            lines: convertedLines
        };

        convertedLines.forEach((line) => {
            if (Array.isArray(line.words)) {
                line.words.forEach((w) => {
                    flatTimepoints.push({
                        time: Number(w.start) || 0,
                        lyricFA: String(w.word),
                        lyricEN: w.finglish || undefined
                    });
                });
            }
        });
    }

    console.log("--- RESULTS ---");
    console.log("lyricsFa length:", lyricsFa.length, "lines count:", lyricsFa.split('\n').length);
    console.log("lyricsEn length:", lyricsEn.length, "lines count:", lyricsEn.split('\n').length);
    console.log("lyricsFinglish length:", lyricsFinglish.length, "lines count:", lyricsFinglish.split('\n').length);
    console.log("chords length:", chords.length);
    console.log("audioUrl:", audioUrl);
    console.log("flatTimepoints count:", flatTimepoints.length);
}

test().catch(console.error);
