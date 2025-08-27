const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('Saman@1989', 10);
  console.log("🔐 Hash:", hash);
})();
