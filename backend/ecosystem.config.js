const path = require('path');

module.exports = {
    apps: [{
        name: "church-api",
        script: "./server-wrapper.js",  // Use wrapper script
        cwd: path.resolve(__dirname),
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: "production",
        },
        env_production: {
            NODE_ENV: "production",
            DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/mychurch",
            DATABASE_URL_DISABLED: "false",
            JWT_SECRET: "MyChurchSuperSecretLocalJWTKey2024!"
        },
        // Log configuration
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
    }]
};
