# MyChurch Backend Context

## Overview
The backend for MyChurch is primarily built on **Supabase (PostgreSQL)** with some local Node.js/Express scripts for specific tasks (like file processing or local automation).

## Tech Stack
-   **Database**: Supabase (PostgreSQL)
-   **API**: RESTful APIs (via Supabase Client or Express)
-   **Runtime**: Node.js (for scripts and local server)
-   **ORM/Query Builder**: Supabase JS Client (`@supabase/supabase-js`)

## Key Directories
-   `/backend`: Contains Node.js scripts and Express server code.
-   `/backend/routes`: API route definitions (if using Express).
-   `/scripts`: Standalone utility scripts (PowerShell, Bash, Node.js).
-   `/supabase`: Supabase configuration and migration files.

## Coding Standards
1.  **Supabase Client**: Always use the singleton instance from `src/utils/supabaseClient.ts` (frontend) or equivalent in backend scripts.
2.  **Error Handling**:
    -   Always wrap async database calls in `try/catch`.
    -   Log errors clearly with context: `console.error('[Context] Error message:', err)`.
    -   Return standardized error responses to the frontend.
3.  **Security**:
    -   Never commit Service Role Keys to the client-side code.
    -   Use Row Level Security (RLS) policies in Supabase for data protection.
4.  **SQL formatting**: Use UPPERCASE for SQL keywords (SELECT, FROM, WHERE).

## Common Tasks
-   **Database Migrations**: SQL files are stored in `/migrations` or root.
-   **Audio Processing**: Python and Node.js scripts in `/scripts` handle audio generation and syncing.
