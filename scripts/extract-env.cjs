// Extract current working env vars and print them
require('dotenv').config();

const keys = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET'
];

console.log('# Extracted from current running environment\n');

keys.forEach(key => {
  const value = process.env[key];
  if (value && !value.includes('YOUR') && !value.includes('your_')) {
    console.log(`${key}=${value}`);
  }
});
