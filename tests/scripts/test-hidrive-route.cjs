// تست ساده برای hidriveRoutes
require('dotenv').config();

console.log('🔍 Testing HiDrive route loading...\n');

console.log('Environment vars:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('HIDRIVE_HOST:', process.env.HIDRIVE_HOST);
console.log('HIDRIVE_USER:', process.env.HIDRIVE_USER);
console.log('');

try {
  console.log('Loading hidriveRoutes...');
  const hidriveRoutes = require('./backend/routes/hidriveRoutes');
  console.log('✅ HiDrive routes loaded successfully!');
  console.log('Type:', typeof hidriveRoutes);
  console.log('Stack length:', hidriveRoutes.stack ? hidriveRoutes.stack.length : 'N/A');
  
  // لیست routes
  if (hidriveRoutes.stack) {
    console.log('\n📋 Registered routes:');
    hidriveRoutes.stack.forEach((layer, index) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`  ${index + 1}. ${methods} ${layer.route.path}`);
      }
    });
  }
} catch (error) {
  console.error('❌ Error loading hidriveRoutes:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
}
