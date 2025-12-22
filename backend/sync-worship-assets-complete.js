// اسکریپت جامع sync و سازماندهی asset های سرودهای پرستشی
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWorshipAssetsComplete() {
    console.log('🎵 سازماندهی کامل Asset های سرودهای پرستشی\n');
    console.log('='.repeat(80) + '\n');

    const report = {
        totalSongs: 0,
        synced: {
            timing: 0,
            audio: 0,
            powerpoint: 0,
            pdf: 0,
            youtube: 0,
            chords: 0,
            lyrics: 0
        },
        missing: {
            timing: [],
            audio: [],
            powerpoint: [],
            pdf: []
        },
        errors: []
    };

    try {
        // خواندن فایل JSON محلی
        const jsonPath = path.join(__dirname, '../storage/data/worship_songs.json');

        if (!fs.existsSync(jsonPath)) {
            console.error(`❌ فایل یافت نشد: ${jsonPath}`);
            return;
        }

        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(`📖 تعداد سرودها در فایل JSON: ${jsonData.length}\n`);
        report.totalSongs = jsonData.length;

        // خواندن فایل‌های تایمینگ موجود
        const timingsDir = path.join(__dirname, '../storage/data/timings');
        const timingFiles = {};

        if (fs.existsSync(timingsDir)) {
            const files = fs.readdirSync(timingsDir);
            files.forEach(file => {
                const match = file.match(/^song_(\d+)_timing\.json$/);
                if (match) {
                    const songId = parseInt(match[1]);
                    timingFiles[songId] = path.join(timingsDir, file);
                }
            });
        }

        console.log(`⏱️  فایل‌های تایمینگ موجود: ${Object.keys(timingFiles).length}\n`);

        // به‌روزرسانی هر سرود
        console.log('🔄 شروع sync...\n');

        for (const song of jsonData) {
            try {
                const songId = song.id;
                const updateData = {
                    updated_at: new Date().toISOString()
                };

                // 1. بررسی و sync تایمینگ
                if (timingFiles[songId]) {
                    const timingData = JSON.parse(fs.readFileSync(timingFiles[songId], 'utf8'));
                    updateData.timing_file = `/storage/data/timings/song_${songId}_timing.json`;
                    updateData.timing_data = timingData;
                    updateData.has_timing = true;
                    updateData.duration = timingData.metadata?.totalDuration || null;
                    report.synced.timing++;
                } else {
                    report.missing.timing.push(songId);
                }

                // 2. بررسی و sync فایل صوتی
                if (song.audioUrl) {
                    updateData.audio_url = song.audioUrl;
                    report.synced.audio++;
                } else {
                    report.missing.audio.push(songId);
                }

                // 3. بررسی و sync PowerPoint
                if (song.presentationFileUrl) {
                    updateData.powerpoint_url = song.presentationFileUrl;
                    report.synced.powerpoint++;
                } else {
                    report.missing.powerpoint.push(songId);
                }

                // 4. بررسی و sync PDF
                if (song.pdfFileUrl) {
                    updateData.pdf_url = song.pdfFileUrl;
                    report.synced.pdf++;
                } else {
                    report.missing.pdf.push(songId);
                }

                // 5. بررسی و sync YouTube
                if (song.youtubeId || song.youtubeUrl) {
                    updateData.youtube_id = song.youtubeId || null;
                    updateData.youtube_url = song.youtubeUrl || null;
                    updateData.video_url = song.videoUrl || null;
                    report.synced.youtube++;
                }

                // 6. بررسی و sync Lyrics
                if (song.lyrics) {
                    if (song.lyrics.fa) {
                        updateData.persian_lyrics = song.lyrics.fa;
                        report.synced.lyrics++;
                    }
                    // استخراج متن بدون آکورد برای finglish_lyrics
                    const lyricsText = song.lyrics.fa || '';
                    const cleanLyrics = lyricsText.replace(/\[.*?\]/g, '').trim();
                    if (cleanLyrics) {
                        updateData.finglish_lyrics = cleanLyrics;
                    }
                }

                // 7. بررسی و sync Chords
                if (song.chord || song.lyrics?.fa?.includes('[')) {
                    // استخراج آکوردها از متن
                    const chordsInText = extractChordsFromLyrics(song.lyrics?.fa || '');
                    if (chordsInText.length > 0 || song.chord) {
                        updateData.chords = JSON.stringify({
                            key: song.chord || null,
                            mode: song.mode || null,
                            chords: chordsInText
                        });
                        report.synced.chords++;
                    }
                }

                // 8. Metadata اضافی
                updateData.title = song.title;
                updateData.artist = song.artist || '';
                updateData.composer = song.composer || '';
                updateData.language = song.language || 'fa';
                updateData.tags = song.tags || ['worship'];
                updateData.slug = song.slug || `song-${songId}`;

                // به‌روزرسانی در Supabase
                const { error } = await supabase
                    .from('worship_songs')
                    .upsert({
                        id: songId,
                        ...updateData
                    }, {
                        onConflict: 'id'
                    });

                if (error) {
                    console.error(`  ❌ خطا در sync سرود ${songId}:`, error.message);
                    report.errors.push({ songId, error: error.message });
                } else {
                    console.log(`  ✅ سرود ${songId}: ${song.title?.fa || 'بدون نام'} - sync موفق`);
                }

            } catch (songError) {
                console.error(`  ❌ خطا در پردازش سرود ${song.id}:`, songError.message);
                report.errors.push({ songId: song.id, error: songError.message });
            }
        }

        // گزارش نهایی
        console.log('\n\n📊 گزارش نهایی sync');
        console.log('='.repeat(80));

        console.log(`\n✅ موفق:`);
        console.log(`   • تایمینگ: ${report.synced.timing} سرود`);
        console.log(`   • فایل صوتی: ${report.synced.audio} سرود`);
        console.log(`   • PowerPoint: ${report.synced.powerpoint} سرود`);
        console.log(`   • PDF: ${report.synced.pdf} سرود`);
        console.log(`   • YouTube: ${report.synced.youtube} سرود`);
        console.log(`   • لیریک: ${report.synced.lyrics} سرود`);
        console.log(`   • آکورد: ${report.synced.chords} سرود`);

        if (report.missing.timing.length > 0) {
            console.log(`\n⚠️  سرودهای بدون تایمینگ (${report.missing.timing.length}):`);
            console.log(`   ${report.missing.timing.slice(0, 10).join(', ')}${report.missing.timing.length > 10 ? '...' : ''}`);
        }

        if (report.missing.audio.length > 0) {
            console.log(`\n⚠️  سرودهای بدون فایل صوتی (${report.missing.audio.length}):`);
            console.log(`   ${report.missing.audio.slice(0, 10).join(', ')}${report.missing.audio.length > 10 ? '...' : ''}`);
        }

        if (report.missing.powerpoint.length > 0) {
            console.log(`\n⚠️  سرودهای بدون PowerPoint (${report.missing.powerpoint.length}):`);
            console.log(`   ${report.missing.powerpoint.slice(0, 10).join(', ')}${report.missing.powerpoint.length > 10 ? '...' : ''}`);
        }

        if (report.errors.length > 0) {
            console.log(`\n❌ خطاها (${report.errors.length}):`);
            report.errors.slice(0, 5).forEach(e => {
                console.log(`   سرود ${e.songId}: ${e.error}`);
            });
        }

        console.log('\n' + '='.repeat(80));

        // ذخیره گزارش
        const reportPath = path.join(__dirname, '../storage/data/worship_sync_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 گزارش کامل ذخیره شد: ${reportPath}`);

        return report;

    } catch (error) {
        console.error('\n❌ خطای کلی:', error);
        throw error;
    }
}

// تابع کمکی برای استخراج آکوردها از متن
function extractChordsFromLyrics(lyrics) {
    if (!lyrics) return [];

    const chordPattern = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]|add\d+|7|9|11|13)?)\]/g;
    const chords = [];
    let match;

    while ((match = chordPattern.exec(lyrics)) !== null) {
        if (!chords.includes(match[1])) {
            chords.push(match[1]);
        }
    }

    return chords;
}

// اجرا
if (require.main === module) {
    syncWorshipAssetsComplete()
        .then(() => {
            console.log('\n✅ sync با موفقیت تکمیل شد');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ خطا:', error);
            process.exit(1);
        });
}

module.exports = { syncWorshipAssetsComplete };
