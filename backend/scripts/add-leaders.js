const { pool } = require('../db-postgres');

const leaders = [
  {
    name: 'Rev. Javad Pishghadamian',
    title: { fa: 'کشیش ارشد', en: 'Senior Pastor' },
    imageUrl: 'https://i.pravatar.cc/400?u=javad'
  },
  {
    name: 'Nazi Rasti',
    title: { fa: 'رهبر مطالعه کتاب مقدس بانوان', en: "Women's Bible Study Leader" },
    imageUrl: 'https://i.pravatar.cc/400?u=nazi'
  }
];

async function addLeaders() {
  try {
    console.log('🔗 Connecting to database...');
    
    // Clear existing leaders
    await pool.query('DELETE FROM leaders');
    console.log('🗑️  Cleared existing leaders');
    
    // Add new leaders
    for (const leader of leaders) {
      await pool.query(
        'INSERT INTO leaders (name, title, imageUrl) VALUES ($1, $2, $3)',
        [
          leader.name,
          JSON.stringify(leader.title),
          leader.imageUrl
        ]
      );
      console.log(`✅ Added: ${leader.name}`);
    }
    
    console.log('\n🎉 Successfully added all leaders!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addLeaders();
