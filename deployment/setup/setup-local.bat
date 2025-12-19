@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM MyChurch Local Development Setup Script for Windows
REM This script sets up the local development environment for MyChurch

echo 🚀 Starting MyChurch Local Development Setup
echo ============================================

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo ✅ Node.js version: !NODE_VERSION!

REM Check if npm is installed
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm is installed
for /f "tokens=*" %%a in ('npm -v') do set NPM_VERSION=%%a
echo ✅ npm version: !NPM_VERSION!

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed. Please install PostgreSQL first.
    echo Install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Create a database named 'mychurch_local' during installation.
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file...
    (
        echo # MyChurch Environment Configuration
        echo # Local Development Settings
        echo.
        echo # API Configuration
        echo VITE_API_URL=http://localhost:3001
        echo VITE_SUPABASE_URL=http://localhost:54321
        echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
        echo VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
        echo.
        echo # Database Configuration
        echo DATABASE_URL=postgresql://postgres:mychurch_password@localhost:5432/mychurch_local
        echo.
        echo # JWT Secret
        echo JWT_SECRET=MyChurchSuperSecretLocalJWTKey2024!
        echo.
        echo # Gemini AI API Key (replace with your actual key)
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo.
        echo # TTS Configuration
        echo GOOGLE_CLOUD_TTS_API_KEY=your_google_tts_api_key_here
        echo HUGGINGFACE_TTS_API_KEY=your_huggingface_tts_api_key_here
        echo.
        echo # FTP Configuration
        echo FTP_HOST=localhost
        echo FTP_PORT=21
        echo FTP_USER=mychurch_user
        echo FTP_PASS=mychurch_password
        echo FTP_REMOTE_PATH=/public_html
        echo.
        echo # Admin Credentials
        echo ADMIN_EMAIL=admin@mychurch.local
        echo ADMIN_PASSWORD=MyChurchSecureAdmin2024!
        echo.
        echo # Development Settings
        echo NODE_ENV=development
        echo PORT=3001
        echo VITE_PORT=5173
    ) > .env
    echo ✅ .env file created with default configuration
) else (
    echo ✅ .env file already exists
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create database if it doesn't exist
echo 🗄️  Checking database...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'mychurch_local'" | find "1" >nul

if %errorlevel% neq 0 (
    echo 🗄️  Creating database...
    createdb mychurch_local
    if %errorlevel% equ 0 (
        echo ✅ Database created successfully
    ) else (
        echo ❌ Failed to create database
        pause
        exit /b 1
    )
) else (
    echo ✅ Database already exists
)

REM Initialize database
echo 🗄️  Initializing database...
cd backend
node initDB-postgres.js

if %errorlevel% equ 0 (
    echo ✅ Database initialized successfully
) else (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)

cd ..

REM Create startup scripts
echo 📝 Creating startup scripts...

REM Create start-backend.bat
(
    echo @echo off
    echo echo 🚀 Starting MyChurch Backend Server...
    echo cd backend
    echo npm run dev
) > start-backend.bat

REM Create start-frontend.bat
(
    echo @echo off
    echo echo 🚀 Starting MyChurch Frontend Server...
    echo npm run dev
) > start-frontend.bat

REM Create start-all.bat
(
    echo @echo off
    echo echo 🚀 Starting MyChurch Full Stack...
    echo echo Backend: http://localhost:3001
    echo echo Frontend: http://localhost:5173
    echo echo.
    echo echo Press Ctrl+C to stop all servers
    echo echo.
    echo npm run dev:all
) > start-all.bat

REM Create test-local.bat
(
    echo @echo off
    echo echo 🧪 Running MyChurch Local Tests...
    echo npm run test:local
) > test-local.bat

echo ✅ Startup scripts created

REM Display summary
echo.
echo 🎉 MyChurch Local Development Setup Complete!
echo ============================================
echo.
echo 📋 Quick Start Commands:
echo   • Start backend:   start-backend.bat
echo   • Start frontend:  start-frontend.bat
echo   • Start all:       start-all.bat
echo   • Run tests:       test-local.bat
echo.
echo 🌐 Access Points:
echo   • Frontend: http://localhost:5173
echo   • Backend API: http://localhost:3001
echo   • Admin Login: admin@mychurch.local / MyChurchSecureAdmin2024!
echo.
echo 📝 Configuration:
echo   • Environment file: .env
echo   • Database: mychurch_local
echo   • Node.js: !NODE_VERSION!
echo   • npm: !NPM_VERSION!
echo.
echo 🔧 Next Steps:
echo   1. Update your .env file with actual API keys
echo   2. Configure your database connection if needed
echo   3. Start the servers using start-all.bat
echo   4. Access the application in your browser
echo.
echo 📚 Documentation:
echo   • README.md - Project documentation
echo   • TESTING_GUIDE.md - Testing instructions
echo   • QUICK_FIX_GUIDE.md - Quick deployment guide
echo.
echo Good luck with your MyChurch project! 🙏
echo.
pause