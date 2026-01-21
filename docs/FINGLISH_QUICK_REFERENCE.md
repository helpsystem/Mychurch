# Finglish Transliteration - Quick Reference

## Persian to Finglish Mapping

### Common Vowels
- ا → a/aa (آرامی → Aarami)
- و → o/u/v (دلها → delhaa)  
- ی → i/y/ee (دلهایی → delhaayi)

### Common Consonants
- ب → b | پ → p | ت/ط → t
- ث/س/ص → s | ج → j | چ → ch
- ح/ه → h | خ → kh | د → d
- ذ/ز/ض/ظ → z | ر → r | ژ → zh
- ش → sh | ع/ء → ' | غ → gh
- ف → f | ق → gh/q | ک/گ → k/g
- ل → l | م → m | ن → n | و → v/w

## Special Rules
1. **Divine names capitalized** (خدا → Khoda, عیسی → Eisa)
2. **Phonetic accuracy** over literal transliteration
3. **Maintain spacing** as in Persian
4. **Omit elongation marks** (آرامــی → Aarami)

## Code Location
- Service: `backend/services/precisionTimingService.js`
- Method: `addFinglishTransliterations()`
- Output: `frontend/public/worship/data/timings/song_[ID]_timing.json`

## Testing
```bash
# Test single song (ID 335)
cd backend
node test-finglish-song335.js

# Batch process all songs
node batch-generate-worship-timing.js
```

## Full Documentation
See [FINGLISH_TRANSLITERATION.md](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/docs/FINGLISH_TRANSLITERATION.md) for complete details.
