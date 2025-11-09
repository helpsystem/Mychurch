const bcrypt = require('bcrypt');
bcrypt.hash('Samyar@1989', 10).then(h => console.log(h));
