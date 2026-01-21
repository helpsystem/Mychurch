# Finglish Transliteration Feature

## Overview

The Finglish transliteration feature automatically converts Persian (Farsi) text to Latin script (Finglish) for all worship song timing data. This enables dual-language display in karaoke mode, making it easier for users who are more comfortable reading Latin script while maintaining the original Persian lyrics.

## Feature Details

### What is Finglish?

Finglish (also known as Pinglish or Penglisi) is a method of writing Persian using the Latin alphabet. This transliteration system uses English characters to phonetically represent Persian words, making them readable for those unfamiliar with the Persian script.

### Integration Points

The Finglish transliteration is integrated into the [`PrecisionTimingService`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/backend/services/precisionTimingService.js) and automatically processes worship song lyrics during timing generation. Each word in the timing data now includes:

- **`word`**: Original Persian text
- **`finglish`**: Latin script transliteration
- **`start`**: Word start time (seconds)
- **`end`**: Word end time (seconds)

### How It Works

1. **Timing Generation**: When [`generateWorshipTiming()`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/backend/services/precisionTimingService.js#L217-L222) is called, the service first generates word-level timing data with Persian text
2. **Finglish Addition**: The [`addFinglishTransliterations()`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/backend/services/precisionTimingService.js#L252-L256) method processes all words in the timing data
3. **AI Processing**: Gemini 2.5 Flash API transliterates Persian words to Finglish using specific transliteration rules
4. **Data Enhancement**: The timing JSON is enriched with `finglish` field for each word
5. **Storage**: Enhanced timing data is saved to `frontend/public/worship/data/timings/song_[ID]_timing.json`

## Transliteration Rules

The Finglish transliteration follows standardized rules to ensure consistency and readability:

### Vowel Mappings

| Persian | Finglish | Example |
|---------|----------|---------|
| ا (alef) | a/aa | آرامی → Aarami |
| و (vav) | o/u/v | دلها → delhaa |
| ی (ye) | i/y/ee | دلهایی → delhaayi |
| ای | ay/ai | |
| او | ow/ou | |

### Consonant Mappings

| Persian | Finglish | Notes |
|---------|----------|-------|
| ب | b | |
| پ | p | |
| ت، ط | t | |
| ث، س، ص | s | |
| ج | j | |
| چ | ch | |
| ح، ه | h | |
| خ | kh | |
| د | d | |
| ذ، ز، ض، ظ | z | |
| ر | r | |
| ژ | zh | |
| ش | sh | |
| ع، ء | ' (omitted in common usage) | |
| غ | gh | |
| ف | f | |
| ق | gh/q | |
| ک، گ | k, g | |
| ل | l | |
| م | m | |
| ن | n | |
| و | v/w | |
| ه | h/e | |
| ی | y | |

### Special Rules

1. **Capitalization**: Divine names (خدا, عیسی, روح القدس, etc.) are capitalized in Finglish
2. **Spacing**: Maintain word boundaries and spacing as in the original Persian text
3. **Phonetic Accuracy**: Prioritize phonetic accuracy over literal transliteration
4. **Naturalness**: Use common Finglish conventions familiar to Persian speakers
5. **Elongated Letters**: Persian words with elongated characters (e.g., آرامــی) are transliterated based on pronunciation, not visual appearance

### Example Transliterations

| Persian | Finglish | Context |
|---------|----------|---------|
| آرامــی | Aarami | From song 335 |
| دلــهــایــی | delhaayi | From song 335 |
| خدا | Khoda | Divine name |
| عیسی | Eisa | Divine name |
| محبت | mohabbat | Love |
| پرستش | parastesh | Worship |

## Technical Implementation

### Service Method: `addFinglishTransliterations()`

Located in [`precisionTimingService.js`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/backend/services/precisionTimingService.js#L252-L256), this method:

```javascript
async addFinglishTransliterations(timingData) {
  // 1. Collect all Persian words from timing data
  // 2. Create Gemini AI prompt with transliteration rules
  // 3. Send batch request to Gemini 2.5 Flash
  // 4. Map returned Finglish words back to timing data
  // 5. Return enhanced timing data with finglish field
}
```

### JSON Schema Update

The timing data schema now includes the `finglish` field:

```json
{
  "type": "object",
  "properties": {
    "lines": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "words": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "word": {"type": "string", "description": "Persian word"},
                "finglish": {"type": "string", "description": "Phonetic transliteration in Latin script"},
                "start": {"type": "number"},
                "end": {"type": "number"}
              },
              "required": ["word", "finglish", "start", "end"]
            }
          }
        }
      }
    }
  }
}
```

### Gemini API Configuration

- **Model**: `gemini-2.0-flash-exp`
- **System Instruction**: Detailed transliteration rules based on the [Audio-Visual-Presentation-Creator](https://github.com/helpsystem/Audio-Visual-Presentation-Creator) project
- **Response Format**: Structured JSON with word-to-Finglish mappings
- **Error Handling**: Graceful degradation if transliteration fails for specific words

## Usage

### Testing Individual Songs

Use the test script to regenerate timing with Finglish for a specific song:

```bash
cd backend
node test-finglish-song335.js
```

This script will:
1. Fetch song data from the database (song ID 335 by default)
2. Generate word-level timing with Finglish transliterations
3. Save to `frontend/public/worship/data/timings/song_335_timing.json`
4. Update the database to mark `has_timing = true`
5. Display sample Finglish words in console output

### Batch Processing All Songs

To regenerate timing data with Finglish for all worship songs:

```bash
cd backend
node batch-generate-worship-timing.js
```

> [!IMPORTANT]
> Batch processing will regenerate timing for ALL songs without existing timing data. Songs with `has_timing = true` will be skipped unless you modify the script.

### Accessing Timing Data

Timing files are stored at:
```
frontend/public/worship/data/timings/song_[SONG_ID]_timing.json
```

Example file structure:
```json
{
  "songId": 335,
  "generatedAt": "2026-01-19T18:30:00.000Z",
  "version": "1.0",
  "model": "gemini-2.0-flash-exp",
  "lines": [
    {
      "line": "آرامــی دلــهــایــی",
      "start": 0.5,
      "end": 3.2,
      "words": [
        {
          "word": "آرامــی",
          "finglish": "Aarami",
          "start": 0.5,
          "end": 1.8
        },
        {
          "word": "دلــهــایــی",
          "finglish": "delhaayi",
          "start": 1.9,
          "end": 3.2
        }
      ]
    }
  ]
}
```

## Frontend Integration (Pending)

The next step is to update the frontend karaoke components to display both Persian and Finglish text:

### Recommended Components to Update

1. **[`WorshipSongPlayer.tsx`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/frontend/src/components/WorshipSongPlayer.tsx)** - Display Finglish alongside Persian lyrics
2. **[`BibleKaraokeView.tsx`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/frontend/src/components/BibleKaraokeView.tsx)** - Similar pattern for Bible karaoke (if needed)

### Display Options

- **Dual-line**: Show Persian on top, Finglish below
- **Toggle**: Allow users to switch between Persian-only, Finglish-only, or both
- **Font sizing**: Use slightly smaller font for Finglish to emphasize Persian as primary

## Testing & Validation

### Manual Verification Checklist

- [x] Test script runs successfully for song 335
- [x] JSON file includes `finglish` field for all words
- [x] Transliteration follows documented rules
- [x] Divine names are properly capitalized
- [x] Database updated with `has_timing = true`
- [ ] Frontend displays Finglish in karaoke mode
- [ ] Batch processing generates Finglish for all songs

### Known Test Cases

**Song 335: "آرامی دلهایی"**
- Persian: `آرامــی` → Finglish: `Aarami` ✅
- Persian: `دلــهــایــی` → Finglish: `delhaayi` ✅

## Configuration

### Environment Variables

Ensure the following environment variable is set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Database Requirements

The `worship_songs` table must have:
- `has_timing` (boolean) - Tracks if timing data exists
- `timing_updated_at` (timestamp) - Last timing generation date

## Troubleshooting

### Common Issues

**Issue**: Finglish field is missing in generated timing
- **Solution**: Ensure you're using the updated `precisionTimingService.js` with `addFinglishTransliterations()` method

**Issue**: Gemini API timeout or errors
- **Solution**: Check API key validity and quota limits. The service includes retry logic and error handling.

**Issue**: Incorrect transliterations
- **Solution**: Review the system instruction in [`addFinglishTransliterations()`](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/backend/services/precisionTimingService.js#L252-L256) and adjust rules if needed

## Future Enhancements

- [ ] User-configurable transliteration style preferences
- [ ] Support for other Persian dialects (Dari, Tajik)
- [ ] Manual correction interface for transliterations
- [ ] Finglish-based search functionality
- [ ] Export karaoke with embedded Finglish subtitles

## References

- [Audio-Visual-Presentation-Creator Project](https://github.com/helpsystem/Audio-Visual-Presentation-Creator) - Original transliteration implementation
- [Wikipedia: Finglish](https://en.wikipedia.org/wiki/Finglish_(Persian)) - Background on Finglish writing system
- Gemini 2.5 Flash API Documentation

## Maintainers

For questions or issues with the Finglish transliteration feature, contact the development team.

---

**Last Updated**: January 19, 2026  
**Version**: 1.0  
**Status**: Production Ready (Backend) / Pending Frontend Integration
