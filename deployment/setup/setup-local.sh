#!/bin/bash

# MyChurch Local Development Setup Script
# This script sets up the local development environment for MyChurch

echo "🚀 Starting MyChurch Local Development Setup"
echo "============================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) is installed"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Install PostgreSQL and create a database named 'mychurch_local'"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# MyChurch Environment Configuration
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
EOF
    echo "✅ .env file created with default configuration"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create database if it doesn't exist
echo "🗄️  Checking database..."
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'mychurch_local'" | grep -q 1

if [ $? -ne 0 ]; then
    echo "🗄️  Creating database..."
    createdb mychurch_local
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
else
    echo "✅ Database already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
cd backend
node initDB-postgres.js

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Failed to initialize database"
    exit 1
fi

cd ..

# Create startup scripts
echo "📝 Creating startup scripts..."

# Create start-backend.sh
cat > start-backend.sh << EOF
#!/bin/bash
echo "🚀 Starting MyChurch Backend Server..."
cd backend
npm run dev
EOF

# Create start-frontend.sh
cat > start-frontend.sh << EOF
#!/bin/bash
echo "🚀 Starting MyChurch Frontend Server..."
npm run dev
EOF

# Create start-all.sh
cat > start-all.sh << EOF
#!/bin/bash
echo "🚀 Starting MyChurch Full Stack..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
concurrently --kill-others-on-fail "npm run backend" "npm run dev"
EOF

chmod +x start-backend.sh start-frontend.sh start-all.sh

echo "✅ Startup scripts created"

# Create test script
cat > test-local.sh << EOF
#!/bin/bash
echo "🧪 Running MyChurch Local Tests..."
npm run test:local
EOF

chmod +x test-local.sh

echo "✅ Test script created"

# Display summary
echo ""
echo "🎉 MyChurch Local Development Setup Complete!"
echo "============================================"
echo ""
echo "📋 Quick Start Commands:"
echo "  • Start backend:   ./start-backend.sh"
echo "  • Start frontend:  ./start-frontend.sh"
echo "  • Start all:       ./start-all.sh"
echo "  • Run tests:       ./test-local.sh"
echo ""
echo "🌐 Access Points:"
echo "  • Frontend: http://localhost:5173"
echo "  • Backend API: http://localhost:3001"
echo "  • Admin Login: admin@mychurch.local / MyChurchSecureAdmin2024!"
echo ""
echo "📝 Configuration:"
echo "  • Environment file: .env"
echo "  • Database: mychurch_local"
echo "  • Node.js: $(node -v)"
echo "  • npm: $(npm -v)"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update your .env file with actual API keys"
echo "  2. Configure your database connection if needed"
echo "  3. Start the servers using ./start-all.sh"
echo "  4. Access the application in your browser"
echo ""
echo "📚 Documentation:"
echo "  • README.md - Project documentation"
echo "  • TESTING_GUIDE.md - Testing instructions"
echo "  • QUICK_FIX_GUIDE.md - Quick deployment guide"
echo ""
echo "Good luck with your MyChurch project! 🙏"