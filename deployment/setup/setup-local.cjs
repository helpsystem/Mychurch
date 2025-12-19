#!/usr/bin/env node

/**
 * MyChurch Local Development Setup Script
 * This script sets up the local development environment for MyChurch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Starting MyChurch Local Development Setup');
console.log('============================================');

async function checkNodeVersion() {
    try {
        const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
        const version = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        
        if (version < 18) {
            console.log('❌ Node.js version 18 or higher is required. Current version:', nodeVersion);
            process.exit(1);
        }
        
        console.log('✅ Node.js', nodeVersion, 'is installed');
        return true;
    } catch (error) {
        console.log('❌ Node.js is not installed. Please install Node.js 18+ first.');
        console.log('Download from: https://nodejs.org/');
        return false;
    }
}

async function checkNpmVersion() {
    try {
        const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
        console.log('✅ npm', npmVersion, 'is installed');
        return true;
    } catch (error) {
        console.log('❌ npm is not installed. Please install npm first.');
        return false;
    }
}

async function checkPostgreSQL() {
    try {
        execSync('psql --version', { stdio: 'ignore' });
        console.log('✅ PostgreSQL is installed');
        return true;
    } catch (error) {
        console.log('⚠️  PostgreSQL is not installed. Please install PostgreSQL first.');
        console.log('Install PostgreSQL from: https://www.postgresql.org/download/');
        console.log('Create a database named \'mychurch_local\' during installation.');
        console.log('Then run this script again.');
        return false;
    }
}

async function createEnvFile() {
    const envPath = '.env';
    
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file already exists');
        return true;
    }
    
    console.log('📝 Creating .env file...');
    
    const envContent = `# MyChurch Environment Configuration
# Local Development Settings

# API Configuration
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database Configuration
DATABASE_URL=postgresql://postgres:mychurch_password@localhost:5432/mychurch_local

# JWT Secret
JWT_SECRET=MyChurchSuperSecretLocalJWTKey2024!

# Gemini AI API Key (replace with your actual key)
GEMINI_API_KEY=your_gemini_api_key_here

# TTS Configuration
GOOGLE_CLOUD_TTS_API_KEY=your_google_tts_api_key_here
HUGGINGFACE_TTS_API_KEY=your_huggingface_tts_api_key_here

# FTP Configuration
FTP_HOST=localhost
FTP_PORT=21
FTP_USER=mychurch_user
FTP_PASS=mychurch_password
FTP_REMOTE_PATH=/public_html

# Admin Credentials
ADMIN_EMAIL=admin@mychurch.local
ADMIN_PASSWORD=MyChurchSecureAdmin2024!

# Development Settings
NODE_ENV=development
PORT=3001
VITE_PORT=5173
`;
    
    try {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created with default configuration');
        return true;
    } catch (error) {
        console.log('❌ Failed to create .env file:', error.message);
        return false;
    }
}

async function installDependencies() {
    console.log('📦 Installing dependencies...');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
        return true;
    } catch (error) {
        console.log('❌ Failed to install dependencies:', error.message);
        return false;
    }
}

async function checkDatabase() {
    try {
        execSync('psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = \'mychurch_local\'" | grep -q 1', { stdio: 'ignore' });
        console.log('✅ Database already exists');
        return true;
    } catch (error) {
        console.log('🗄️  Creating database...');
        try {
            execSync('createdb mychurch_local', { stdio: 'ignore' });
            console.log('✅ Database created successfully');
            return true;
        } catch (dbError) {
            console.log('❌ Failed to create database:', dbError.message);
            return false;
        }
    }
}

async function initializeDatabase() {
    console.log('🗄️  Initializing database...');
    
    try {
        process.chdir('backend');
        execSync('node initDB-postgres.js', { stdio: 'inherit' });
        process.chdir('..');
        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        process.chdir('..');
        console.log('❌ Failed to initialize database:', error.message);
        return false;
    }
}

async function createStartupScripts() {
    const scripts = [
        {
            name: 'start-backend.sh',
            content: `#!/bin/bash
echo "🚀 Starting MyChurch Backend Server..."
cd backend
npm run dev`
        },
        {
            name: 'start-frontend.sh',
            content: `#!/bin/bash
echo "🚀 Starting MyChurch Frontend Server..."
npm run dev`
        },
        {
            name: 'start-all.sh',
            content: `#!/bin/bash
echo "🚀 Starting MyChurch Full Stack..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
concurrently --kill-others-on-fail "npm run backend" "npm run dev"`
        },
        {
            name: 'test-local.sh',
            content: `#!/bin/bash
echo "🧪 Running MyChurch Local Tests..."
npm run test:local`
        }
    ];
    
    const windowsScripts = [
        {
            name: 'start-backend.bat',
            content: `@echo off
echo 🚀 Starting MyChurch Backend Server...
cd backend
npm run dev`
        },
        {
            name: 'start-frontend.bat',
            content: `@echo off
echo 🚀 Starting MyChurch Frontend Server...
npm run dev`
        },
        {
            name: 'start-all.bat',
            content: `@echo off
echo 🚀 Starting MyChurch Full Stack...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.
npm run dev:all`
        },
        {
            name: 'test-local.bat',
            content: `@echo off
echo 🧪 Running MyChurch Local Tests...
npm run test:local`
        }
    ];
    
    try {
        // Create Unix scripts
        scripts.forEach(script => {
            fs.writeFileSync(script.name, script.content);
            if (process.platform !== 'win32') {
                fs.chmodSync(script.name, '755');
            }
        });
        
        // Create Windows scripts
        windowsScripts.forEach(script => {
            fs.writeFileSync(script.name, script.content);
        });
        
        console.log('✅ Startup scripts created');
        return true;
    } catch (error) {
        console.log('❌ Failed to create startup scripts:', error.message);
        return false;
    }
}

async function main() {
    const results = [];
    
    results.push(await checkNodeVersion());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await checkNpmVersion());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await checkPostgreSQL());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await createEnvFile());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await installDependencies());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await checkDatabase());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await initializeDatabase());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    results.push(await createStartupScripts());
    if (!results[results.length - 1]) {
        process.exit(1);
    }
    
    // Display summary
    console.log('\n🎉 MyChurch Local Development Setup Complete!');
    console.log('============================================\n');
    console.log('📋 Quick Start Commands:');
    console.log('  • Start backend:   ' + (process.platform === 'win32' ? 'start-backend.bat' : './start-backend.sh'));
    console.log('  • Start frontend:  ' + (process.platform === 'win32' ? 'start-frontend.bat' : './start-frontend.sh'));
    console.log('  • Start all:       ' + (process.platform === 'win32' ? 'start-all.bat' : './start-all.sh'));
    console.log('  • Run tests:       ' + (process.platform === 'win32' ? 'test-local.bat' : './test-local.sh'));
    console.log('\n🌐 Access Points:');
    console.log('  • Frontend: http://localhost:5173');
    console.log('  • Backend API: http://localhost:3001');
    console.log('  • Admin Login: admin@mychurch.local / MyChurchSecureAdmin2024!');
    console.log('\n📝 Configuration:');
    console.log('  • Environment file: .env');
    console.log('  • Database: mychurch_local');
    console.log('  • Node.js: ' + execSync('node -v', { encoding: 'utf8' }).trim());
    console.log('  • npm: ' + execSync('npm -v', { encoding: 'utf8' }).trim());
    console.log('\n🔧 Next Steps:');
    console.log('  1. Update your .env file with actual API keys');
    console.log('  2. Configure your database connection if needed');
    console.log('  3. Start the servers using ' + (process.platform === 'win32' ? 'start-all.bat' : './start-all.sh'));
    console.log('  4. Access the application in your browser');
    console.log('\n📚 Documentation:');
    console.log('  • README.md - Project documentation');
    console.log('  • TESTING_GUIDE.md - Testing instructions');
    console.log('  • QUICK_FIX_GUIDE.md - Quick deployment guide');
    console.log('\nGood luck with your MyChurch project! 🙏');
}

// Run the setup
main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});