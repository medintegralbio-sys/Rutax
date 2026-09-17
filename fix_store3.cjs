const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

content = content.replace(/cooperativaId: baseData.cooperativaId,/g, "cooperativaId: baseData.cooperativaId,\n      cedula: '0000000000',\n      rol_secundario: null,");
content = content.replace(/cooperativaId: base.cooperativaId,/g, "cooperativaId: base.cooperativaId,\n          cedula: '0000000000',\n          rol_secundario: null,");

fs.writeFileSync('src/services/store.ts', content);
