const fs = require('fs');
let content = fs.readFileSync('src/components/admin/ModalRegistroBase.tsx', 'utf8');

content = content.replace(/            <div className="grid grid-cols-1 gap-3\.5">\n              <div className="grid grid-cols-1 md:grid-cols-2 gap-3\.5">/, `            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">`);

fs.writeFileSync('src/components/admin/ModalRegistroBase.tsx', content);
