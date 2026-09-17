import fs from 'fs';

const patchFile = (path) => {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/window\.location\.href = '\/login';/g, "rutaxStore.logout(); window.location.href = '/login';");
  fs.writeFileSync(path, code);
};

patchFile('./src/App.tsx');
patchFile('./src/components/layouts/LayoutAdminCoop.tsx');
patchFile('./src/components/layouts/LayoutSuperAdmin.tsx');
