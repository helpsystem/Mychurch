# FlipBookBible Manual Test Plan

## Plain View Toggle Functionality Tests

### Test 1: Initial Render
**Objective**: Verify component renders in flipbook mode by default

**Steps**:
1. Navigate to Bible reader page
2. Select a book and chapter
3. Observe the initial view

**Expected Result**:
- FlipBook view with pages should be visible
- Plain view should NOT be visible
- Toggle button should show "نمایش ساده آیات" (Show plain view)

**Status**: ⬜ Pass ⬜ Fail

---

### Test 2: Toggle to Plain View
**Objective**: Verify switching from flipbook to plain view works correctly

**Steps**:
1. Click on "نمایش ساده آیات" button
2. Observe the view change

**Expected Result**:
- FlipBook view should be hidden
- Plain view should be visible showing all verses
- Toggle button text should change to "بازگشت به کتاب" (Back to flipbook)
- Page navigation buttons (prev/next page) should be disabled
- Chapter navigation buttons should remain enabled

**Status**: ⬜ Pass ⬜ Fail

---

### Test 3: Display All Verses in Plain View
**Objective**: Verify all verses are visible in plain view

**Steps**:
1. Toggle to plain view
2. Scroll through the verses
3. Count visible verses

**Expected Result**:
- All verses from the chapter should be visible
- Each verse should have a verse number
- Verses should be in a scrollable list
- No pagination should occur

**Status**: ⬜ Pass ⬜ Fail

---

### Test 4: Toggle Back to Flipbook
**Objective**: Verify switching from plain view back to flipbook works

**Steps**:
1. Toggle to plain view
2. Click "بازگشت به کتاب" button
3. Observe the view change

**Expected Result**:
- Plain view should be hidden
- FlipBook view should be visible again
- Page navigation buttons should be enabled
- Same chapter and verses should be displayed

**Status**: ⬜ Pass ⬜ Fail

---

### Test 5: Page Navigation Disabled in Plain View
**Objective**: Verify page navigation is disabled when in plain view

**Steps**:
1. Toggle to plain view
2. Try to click "صفحه قبل" (Previous page) button
3. Try to click "صفحه بعد" (Next page) button

**Expected Result**:
- Both page navigation buttons should be disabled
- Clicking them should have no effect
- Buttons should have a disabled visual state

**Status**: ⬜ Pass ⬜ Fail

---

### Test 6: Bilingual Display in Plain View
**Objective**: Verify bilingual mode works correctly in plain view

**Steps**:
1. Enable bilingual mode (toggle "دوزبانه" button)
2. Toggle to plain view
3. Observe verse display

**Expected Result**:
- Each verse should show both Persian (FA) and English (EN) text
- Persian text should be above English text (or clearly separated)
- Both texts should be properly aligned (RTL for Persian, LTR for English)

**Status**: ⬜ Pass ⬜ Fail

---

### Test 7: Book and Chapter Title Display
**Objective**: Verify correct book and chapter information is shown in plain view

**Steps**:
1. Select a specific book (e.g., Genesis / پیدایش)
2. Select a specific chapter (e.g., Chapter 3)
3. Toggle to plain view
4. Check the header information

**Expected Result**:
- Book name should be displayed correctly in current language
- Chapter number should be displayed correctly
- Header should be clearly visible at the top

**Status**: ⬜ Pass ⬜ Fail

---

### Test 8: Font Size Respect
**Objective**: Verify fontSize prop is respected in plain view

**Steps**:
1. Adjust font size using the +/- buttons
2. Toggle to plain view
3. Observe the font size of verses

**Expected Result**:
- Font size changes should be reflected in plain view
- All text should scale proportionally
- Text should remain readable

**Status**: ⬜ Pass ⬜ Fail

---

### Test 9: Chapter Navigation in Plain View
**Objective**: Verify chapter navigation works while in plain view

**Steps**:
1. Toggle to plain view
2. Click "فصل بعدی" (Next chapter) button
3. Observe the result

**Expected Result**:
- Chapter should change
- Plain view should remain active (not switch back to flipbook)
- New chapter's verses should be loaded and displayed in plain view

**Status**: ⬜ Pass ⬜ Fail

---

### Test 10: Chapter Selector Dropdown
**Objective**: Verify chapter selector dropdown works correctly

**Steps**:
1. Open chapter selector dropdown
2. Select a different chapter (e.g., change from Chapter 1 to Chapter 5)
3. Observe the result

**Expected Result**:
- Chapter should change immediately
- If in plain view, should remain in plain view
- Correct verses for selected chapter should load
- Chapter indicator should update

**Status**: ⬜ Pass ⬜ Fail

---

### Test 11: Empty Verses Handling
**Objective**: Verify component handles empty verses array gracefully

**Steps**:
1. Navigate to a book/chapter that might have no verses (edge case)
2. Toggle to plain view

**Expected Result**:
- Component should not crash
- Plain view should display an empty state or message
- Toggle button should still be functional

**Status**: ⬜ Pass ⬜ Fail

---

### Test 12: Language Switching
**Objective**: Verify plain view updates correctly when switching language

**Steps**:
1. Toggle to plain view
2. Switch site language from Persian to English (or vice versa)
3. Observe the changes

**Expected Result**:
- UI labels should update to new language
- Verse content should remain correct
- RTL/LTR direction should update appropriately
- Toggle button text should update

**Status**: ⬜ Pass ⬜ Fail

---

### Test 13: Page Indicator Update
**Objective**: Verify page indicator displays correct text in different modes

**Steps**:
1. Start in flipbook mode - check page indicator
2. Toggle to plain view - check page indicator again

**Expected Result**:
- In flipbook mode: Should show "جلد" (Cover) or "صفحه X از Y" (Page X of Y)
- In plain view: Should show "نمایش ساده" (Plain view)

**Status**: ⬜ Pass ⬜ Fail

---

### Test 14: Responsive Behavior
**Objective**: Verify plain view works on different screen sizes

**Steps**:
1. Toggle to plain view on desktop
2. Resize browser to mobile size
3. Check layout and functionality

**Expected Result**:
- Plain view should be responsive
- Verses should remain readable
- No horizontal scrolling should occur
- All buttons should remain accessible

**Status**: ⬜ Pass ⬜ Fail

---

### Test 15: State Persistence
**Objective**: Verify view mode persists during chapter changes

**Steps**:
1. Toggle to plain view
2. Change to next chapter
3. Check if still in plain view
4. Toggle back to flipbook
5. Change chapter again
6. Check if still in flipbook view

**Expected Result**:
- View mode (plain/flipbook) should persist across chapter changes
- No unexpected view switching should occur

**Status**: ⬜ Pass ⬜ Fail

---

## Test Summary

**Total Tests**: 15  
**Tests Passed**: ___  
**Tests Failed**: ___  
**Pass Rate**: ____%

**Tester Name**: ___________________  
**Date**: ___________________  
**Browser/Device**: ___________________  

**Notes**:
