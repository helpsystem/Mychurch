import json, sqlite3, os

db = r'C:\Users\SamYar\Desktop\Bible\bible_output\bible_complete.db'
conn = sqlite3.connect(db)
cur = conn.cursor()

print('=== VERSIONS IN DATABASE ===')
for r in cur.execute('SELECT version_id, abbr, name, language FROM versions ORDER BY language, version_id'):
    v_count = cur.execute('SELECT COUNT(*) FROM verses WHERE version_id=?', (r[0],)).fetchone()[0]
    b_count = cur.execute('SELECT COUNT(*) FROM books WHERE version_id=?', (r[0],)).fetchone()[0]
    a_count = cur.execute("SELECT COUNT(*) FROM audio WHERE version_id=? AND mp3_url != ''", (r[0],)).fetchone()[0]
    lang = 'FA' if r[3]=='fa' else 'EN'
    print(f'  [{lang}] {r[1]:<10} (ID:{r[0]:<5}) {r[2]:<45} | {b_count:>2} books | {v_count:>6} verses | {a_count:>4} audio')

print()
total_v = cur.execute('SELECT COUNT(*) FROM verses').fetchone()[0]
total_a = cur.execute("SELECT COUNT(*) FROM audio WHERE mp3_url != ''").fetchone()[0]
print(f'TOTAL: {total_v:,} verses | {total_a:,} audio links')

print()
print('=== MISSING (not yet extracted) ===')
expected_en = {3034:'BSB',1:'KJV',111:'NIV',59:'ESV',116:'NLT',114:'NKJV',100:'NASB95',2692:'NASB20',97:'MSG',1713:'CSB',12:'ASV',72:'HCSB',90:'LEB',206:'WEB',68:'GNT',2079:'EASY'}
existing = set(r[0] for r in cur.execute('SELECT version_id FROM versions'))
missing = {k:v for k,v in expected_en.items() if k not in existing}
if missing:
    print(f'  {len(missing)} English versions NOT YET extracted:')
    for vid, abbr in sorted(missing.items()):
        print(f'    [EN] {abbr} (ID:{vid})')
else:
    print('  All English versions extracted!')

conn.close()

total_size = 0
for root, dirs, files in os.walk(r'C:\Users\SamYar\Desktop\Bible\bible_output'):
    for f in files:
        total_size += os.path.getsize(os.path.join(root, f))
print(f'\nDisk usage: {total_size/1024/1024:.1f} MB')
