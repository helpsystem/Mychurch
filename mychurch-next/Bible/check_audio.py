import sqlite3

db = r'C:\Users\SamYar\Desktop\Bible\bible_output\bible_complete.db'
conn = sqlite3.connect(db)
cur = conn.cursor()

print('=== AUDIO STATUS PER VERSION ===\n')

for r in cur.execute('SELECT version_id, abbr, name, language FROM versions ORDER BY language, version_id'):
    vid = r[0]
    total_ch = cur.execute('SELECT COUNT(*) FROM chapters WHERE version_id=?', (vid,)).fetchone()[0]
    audio_ch = cur.execute("SELECT COUNT(*) FROM audio WHERE version_id=? AND mp3_url != ''", (vid,)).fetchone()[0]
    status = 'YES' if audio_ch > 0 else 'NO'
    lang = 'FA' if r[3]=='fa' else 'EN'
    pct = (audio_ch/total_ch*100) if total_ch > 0 else 0
    print(f'  [{lang}] {r[1]:<10} | {audio_ch:>4}/{total_ch:<4} chapters with audio ({pct:.0f}%) | {status}')

print('\n=== SAMPLE AUDIO LINKS ===\n')
for r in cur.execute("SELECT v.abbr, a.book_id, a.chapter_num, a.title, a.mp3_url, a.hls_url FROM audio a JOIN versions v ON a.version_id=v.version_id WHERE a.mp3_url != '' ORDER BY v.abbr, a.book_id, a.chapter_num LIMIT 10"):
    print(f'  {r[0]} {r[1]}.{r[2]}')
    print(f'    Title: {r[3]}')
    print(f'    MP3:   {r[4][:100]}...')
    print(f'    HLS:   {r[5][:100]}...')
    print()

# Count unique audio versions
print('=== AUDIO VERSION TITLES ===\n')
for r in cur.execute("SELECT DISTINCT v.abbr, a.title, a.dramatized FROM audio a JOIN versions v ON a.version_id=v.version_id WHERE a.mp3_url != '' ORDER BY v.abbr"):
    drama = ' (Dramatized)' if r[2] else ''
    print(f'  [{r[0]}] {r[1]}{drama}')

conn.close()
