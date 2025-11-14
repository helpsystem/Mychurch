# Admin Panel Testing Guide

## 🎯 Overview
This guide will help you test the Admin Panel for audio synchronization functionality.

## 📋 Prerequisites
1. Access to the website: https://samanabyar.online
2. Login credentials: help.system@ymail.com / Samyar@1989
3. Browser with developer tools (F12)

## 🧪 Testing Steps

### Step 1: Access the Admin Panel
1. Open your browser and navigate to: https://samanabyar.online
2. Clear the cache with `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Login with the provided credentials
4. Navigate to: `#/admin/sync-management`

### Step 2: Verify the Admin Panel Loads
1. Check that you see two tabs:
   - "سرودهای پرستشی" (Worship Songs)
   - "کتاب مقدس صوتی" (Bible Audio)
2. Verify you see the worship songs table with song data
3. Check that the "آپلود سرود جدید" (Upload New Song) button is visible

### Step 3: Test Single Song Processing
1. **Select a song for processing**:
   - Find a song that doesn't have timing data (look for the "نیاز به پردازش" status)
   - Click the checkbox next to the song
   - Click the refresh button (⚡) in the Actions column

2. **Monitor the processing**:
   - You should see a loading spinner and progress percentage
   - The status should change to "✅ همگام‌سازی موفق" (Sync successful)
   - The "وضعیت" (Status) column should show a green checkmark

3. **Verify the result**:
   - Check that the "آخرین همگام‌سازی" (Last Synced) date is updated
   - The song should now show a green checkmark instead of "نیاز به پردازش"

### Step 4: Test Batch Processing
1. **Select multiple songs**:
   - Check the box in the header to select all songs
   - Or select multiple individual songs

2. **Process the batch**:
   - Click the "پردازش دسته‌ای" (Batch Process) button
   - Monitor the progress for each song
   - Verify that all selected songs are processed successfully

### Step 5: Test Bible Audio Processing
1. Switch to the "کتاب مقدس صوتی" (Bible Audio) tab
2. Note that this section shows a placeholder message
3. This functionality is ready to be implemented when Bible audio files are available

## 🔍 Expected Results

### Successful Processing Output
When a song is processed successfully, the system should:
1. Extract word-level timing from the audio
2. Save timing data to the database
3. Update the song's `has_timing` status to `true`
4. Set the `timing_updated_at` timestamp

### Database Structure Verification
The processed songs should have:
```json
{
  "timing_data": [
    {"word": "خدایا", "startTime": 0.5, "endTime": 1.2},
    {"word": "میهن", "startTime": 1.3, "endTime": 1.8}
  ],
  "has_timing": true,
  "timing_updated_at": "2025-01-10T17:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Login Issues**:
   - Make sure you're using the correct credentials
   - Clear browser cache and cookies
   - Check that JavaScript is enabled

2. **Processing Issues**:
   - If processing fails, check the browser console (F12) for error messages
   - Verify that the audio files are accessible
   - Check that the Gemini AI API key is configured

3. **Network Issues**:
   - Ensure you have a stable internet connection
   - Check that the website is accessible
   - Try refreshing the page if the UI becomes unresponsive

### Debug Information

To debug issues:
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for error messages or warnings
4. Check the Network tab to see API requests

## 📊 Success Criteria

The test is successful if:
1. ✅ You can login and access the Admin Panel
2. ✅ You can see the worship songs list
3. ✅ You can process individual songs successfully
4. ✅ You can process multiple songs in batch
5. ✅ The timing data is saved to the database
6. ✅ The UI updates to reflect successful processing

## 🚀 Next Steps

Once testing is complete:
1. Process all 364 worship songs using batch processing
2. Monitor the processing progress and success rate
3. Verify that the timing data is accurate
4. Test the audio synchronization feature in the main application

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the backend is running (check `/api/health` endpoint)
3. Ensure all database tables exist and have the correct structure
4. Check that the Gemini AI API key is properly configured