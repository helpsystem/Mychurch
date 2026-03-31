# Broadcast E2E Checklist (Deploy-Ready)

## 1) Access & Auth
- Login as Admin/Leader/Operator.
- Open /admin/presentations and verify list loads.
- Open /broadcast and verify console opens.
- Login as User role and verify restricted actions fail for save/delete presentation.

## 2) Presentation CRUD
- Create a new presentation in /admin/presentations.
- Open builder, add 3 slides (Scripture, Lyrics, Announcement), save.
- Refresh page and confirm content persists.
- Delete presentation and verify it disappears from list.

## 3) Live Console Load
- In /broadcast, click Cloud Load and load saved presentation.
- Verify monitor shows slide count and first slide is selectable.
- Toggle Go Live and ensure Program Monitor updates.

## 4) Secure Viewer Link
- In /broadcast click Viewer Link and paste in a new browser/device.
- Confirm URL has session and token query params.
- Viewer should pass access check and show waiting screen.
- Edit token manually and refresh: viewer must show invalid access screen.

## 5) Real-time Sync
- In console change slide quickly 10-20 times.
- Viewer must follow changes with no crash.
- Scroll-sync and audio-sync should update on viewer when applicable.

## 6) Socket Rate Limits
- Run rapid slide_change spam from devtools (if applicable).
- Verify server drops excessive events (no viewer flood/lockup).
- Verify normal operator pace remains smooth.

## 7) Content Rendering
- Scripture: verse numbers/text align in both FA/EN.
- Lyrics: timing mode and non-timing mode both render.
- Media: image/video sizing and position obey config.
- Announcement: title/content/image render without layout break.

## 8) Failure Cases
- Stop DB or break DB connection in dev.
- Save/Delete must return failure (no fake success toast).
- Reconnect DB and re-test save.

## 9) Browser Matrix
- Chrome latest (Windows)
- Edge latest (Windows)
- Safari (if used by projection machine)

## 10) Pre-Deploy Final
- Confirm env vars: NEXT_PUBLIC_SITE_URL, BROADCAST_VIEWER_SECRET.
- Confirm no TypeScript errors in modified files.
- Confirm production URL can generate secure viewer links.
