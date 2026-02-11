# MyChurch Broadcast Console - Project Context

## Project Overview
**MyChurch** is a comprehensive church presentation software built with **React, TypeScript, Vite, and Tailwind CSS**. It features a "Broadcast Console" for live streaming, worship lyrics management, sermon/scripture slides, and advanced media playback.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Icons), Framer Motion (Animations).
- **Backend / Database**: Supabase (PostgreSQL), Express.js (Local Server for specific tasks).
- **State Management**: React Context + Hooks (Custom hooks like `useBroadcast`, `useTheme`).
- **Styling**: Tailwind CSS (Utility-first), CSS Modules (rarely), Global CSS variables for themes.

## Key Components
- **`LiveConsole.tsx`**: The heart of the broadcast system. Handles slide rendering, camera feeds, and overlay management.
- **`SlideBuilder.tsx`**: The editor for creating/editing slides (Lyrics, Scripture, Media, Announcements).
- **`DeviceSettingsModal.tsx`**: Manages camera/microphone selection and effects (Mirror, Blur).
- **`SmartWorshipPlayer.tsx`**: Advanced lyric renderer with timing support (Karaoke style).

## Coding Standards & Rules
1.  **TypeScript Strictness**: Always use proper types. Avoid `any` unless absolutely necessary for external libraries with poor typing.
2.  **Tailwind First**: Use Tailwind utility classes for styling. Avoid inline styles unless dynamic (e.g., `style={{ transform: ... }}`).
3.  **Component Structure**:
    -   Functional Components with `React.FC` or inferred return types.
    -   Props interfaces exportable if reused (`export interface MyProps`).
    -   Keep components small and focused. Extract sub-components if a file exceeds 400-500 lines (though `LiveConsole` is a known exception, it's a monolithic orchestrator).
4.  **Accessibility (a11y)**:
    -   All buttons must have `title` or `aria-label` if icon-only.
    -   Form inputs must have labels or `aria-label`.
    -   Use semantic HTML (`<button>`, `<section>`, not `<div onClick>`).
5.  **RTL Support**: The app supports bilingual (English/Farsi).
    -   Use `dir={isRTL ? 'rtl' : 'ltr'}` on containers.
    -   Use `font-[Vazirmatn]` for Persian text.
    -   Ensure flex directions and text alignments respect RTL (e.g., `text-right` in RTL).

## Workflow Instructions
- **Adding New Features**:
    1.  Check `task.md` for the current objective.
    2.  Update `implementation_plan.md` if the feature is complex.
    3.  Implement -> Verify -> Commit.
- **Debugging**:
    -   Check `LiveConsole` logs (prefixed with `[LiveConsole]`).
    -   Verify `localStorage` persistence for settings.

## AI Persona
You are an expert Frontend Architect specializing in React and Media/Streaming applications. You value clean code, performance, and accessible UI. You are familiar with the specific quirks of "MyChurch" codebase (e.g., the `LiveConsole` duplicate bug history).
