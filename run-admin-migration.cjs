/**
 * Admin Features Database Migration Runner
 * 
 * This script runs the admin-features-fix.sql migration to create
 * missing tables for admin panel features.
 * 
 * Usage: node run-admin-migration.cjs
 */

const fs = require('fs');
const path = require('path');

// Load environment variables FIRST (before requiring db-postgres)
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📋 Loaded environment from .env');
} else {
    // Try backend/.env
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
        dotenv.config({ path: backendEnvPath });
        console.log('📋 Loaded environment from backend/.env');
    }
}

// Now require db-postgres after env is loaded
const { pool } = require('./backend/db-postgres');

// ANSI colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

async function runMigration() {
    console.log(`${colors.cyan}🔄 Running Admin Features Migration...${colors.reset}\n`);
    
    const migrationPath = path.join(__dirname, 'backend', 'migrations', 'admin-features-fix.sql');
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
        console.error(`${colors.red}❌ Migration file not found: ${migrationPath}${colors.reset}`);
        process.exit(1);
    }
    
    console.log(`${colors.cyan}📚 Reading migration file...${colors.reset}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`${colors.cyan}🔗 Connecting to database...${colors.reset}`);
    
    const client = await pool.connect();
    
    try {
        console.log(`${colors.cyan}🔄 Executing migration...${colors.reset}\n`);
        
        // Split by semicolons but handle DO blocks properly
        // Using a simpler approach - just run the whole file
        await client.query(sql);
        
        console.log(`\n${colors.green}✅ Migration completed successfully!${colors.reset}\n`);
        
        // Verify tables were created
        console.log(`${colors.cyan}📋 Verifying created tables...${colors.reset}`);
        
        const tables = ['communications', 'settings', 'message_logs', 'church_announcements', 'testimonials', 'users'];
        
        for (const table of tables) {
            try {
                const result = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = $1
                    )
                `, [table]);
                
                const exists = result.rows[0].exists;
                console.log(`  ${exists ? '✅' : '❌'} ${table}`);
            } catch (err) {
                console.log(`  ⚠️  ${table} - check failed`);
            }
        }
        
        console.log(`\n${colors.green}🎉 Admin panel features are now ready!${colors.reset}`);
        console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
        console.log(`  1. Restart the backend server: npm run backend`);
        console.log(`  2. Test admin panel features at /#/admin`);
        
    } catch (error) {
        console.error(`\n${colors.red}❌ Migration error:${colors.reset}`, error.message);
        
        if (error.message.includes('syntax error')) {
            console.log(`\n${colors.yellow}Tip: The SQL file may contain syntax errors. Check the migration file.${colors.reset}`);
        }
        
        if (error.message.includes('does not exist')) {
            console.log(`\n${colors.yellow}Tip: Some referenced tables/columns may not exist yet.${colors.reset}`);
        }
        
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error(`\n${colors.red}Migration failed. See error above.${colors.reset}`);
        process.exit(1);
    });
