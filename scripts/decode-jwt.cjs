require('dotenv').config();
const jwt = require('jsonwebtoken');

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

console.log('=== Service Role Key ===');
if (serviceKey) {
  try {
    const decoded = jwt.decode(serviceKey);
    console.log(JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log('Invalid JWT:', e.message);
  }
} else {
  console.log('NOT FOUND');
}

console.log('\n=== Anon Key ===');
if (anonKey) {
  try {
    const decoded = jwt.decode(anonKey);
    console.log(JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log('Invalid JWT:', e.message);
  }
} else {
  console.log('NOT FOUND');
}
