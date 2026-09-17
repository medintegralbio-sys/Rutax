const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(/leer_en_voz_alta: true,/, "leer_en_voz_alta: true,\n      expira_en_min: 60,");

fs.writeFileSync('src/services/store.ts', content);
