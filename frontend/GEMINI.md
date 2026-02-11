# MyChurch Frontend Context

## Overview
The frontend is a **React 18** application powered by **Vite**, designed for high-performance presentation and streaming.

## Tech Stack
-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Animations**: Framer Motion

## Key Directories
-   `/src/components`: Reusable UI components.
    -   `/broadcast`: Components specific to the Broadcast Console (`LiveConsole`, `SlideBuilder`).
    -   `/worship`: Worship-related components (`WorshipSongSelector`, `SmartWorshipPlayer`).
-   `/src/hooks`: Custom React hooks (`useBroadcast`, `useTheme`).
-   `/src/context`: React Context providers.
-   `/src/utils`: Helper functions and constants.

## Component Standards
1.  **Functional Components**: Use `const Component: React.FC<Props> = (...) => { ... }`.
2.  **Strict Typing**: Define interfaces for all props. Avoid `any`.
3.  **Tailwind Usage**:
    -   Use utility classes for layout and spacing.
    -   Use `clsx` or template literals for conditional classes.
    -   Avoid `@apply` in CSS files unless creating a reusable atomic class.
4.  **Performance**:
    -   Memoize expensive calculations with `useMemo`.
    -   Memoize callback functions with `useCallback` to prevent unnecessary re-renders.
    -   Use `React.memo` for purely presentational components that receive frequent updates.

## Broadcast Console Specifics
-   **State**: `LiveConsole` manages complex state. Be careful when adding new state variables to avoid "prop drilling" hell. Consider moving shared state to `BroadcastContext`.
-   **Preview vs. Live**: Components often have a "Preview" mode. Ensure `renderSlideContent` handles both live and preview rendering logic efficiently.
