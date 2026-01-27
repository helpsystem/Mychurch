import json

timing_file = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\timings\song_335_timing.json'

print('📖 Reading timing file...\n')
with open(timing_file, 'r', encoding='utf-8') as f:
    timing_data = json.load(f)

# Finglish mapping
finglish_map = {
    'آرامی': 'aarami', 'دل': 'del', 'هایی': 'haayi', 'سازنده': 'saazandeh', 
    'دریاها': 'daryaaha', 'روشنی': 'rowshani', 'خورشیدی': 'khorshidi',
    'زیبایی': 'zibaayi', 'رویاها': 'royaaha', 'از': 'az', 'تو': 'to',
    'امنیت': 'amniyat', 'دارم': 'daaram', 'در': 'dar', 'کشمکش': 'kashmakesh',
    'طوفان': 'toofaan', 'من': 'man', 'قایق': 'ghaayegh', 'پوسیده': 'poosideh',
    'رهبر': 'rahbar', 'این': 'in', 'سوکان': 'sokaan', 'سوهان': 'sokaan',
    'مقصد': 'maghsad', 'آزادی': 'aazaadi', 'سرباز': 'sarbaaz', 'میمانم': 'mimaanam',
    'نعمت': 'nemat', 'چاتم': 'chaatem', 'را': 'ra', 'فیض': 'feyz',
    'می': 'mi', 'دانم': 'daanam', 'آن': 'aan', 'دم': 'dam', 'که': 'ke',
    'جسمم': 'jesmam', 'غصه': 'ghosseh', 'قصه': 'ghesseh', 'و': 'va',
    'شادی': 'shaadi', 'ثروت': 'servat', 'فقر': 'faghr', 'ظلم': 'zolm',
    'ویرانی': 'viraani', 'آبادی': 'aabaadi', 'حاشا': 'haasha', 'اگر': 'agar',
    'جز': 'joz', 'یار': 'yaar', 'دیگری': 'digari', 'گیرم': 'giram',
    'زنده': 'zendeh', 'ام': 'am', 'عشق': 'eshgh', 'راه': 'raah', 'میرم': 'miram'
}

updated_count = 0
for line in timing_data['lines']:
    for word in line['words']:
        if word['word'] in finglish_map:
            word['finglish'] = finglish_map[word['word']]
            updated_count += 1

with open(timing_file, 'w', encoding='utf-8') as f:
    json.dump(timing_data, f, ensure_ascii=False, indent=2)

print(f'✅ SUCCESS! Added Finglish to {updated_count} words')
print(f'📄 File: {timing_file}')
