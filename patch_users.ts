import fs from 'fs';

const storePath = './src/services/store.ts';
let code = fs.readFileSync(storePath, 'utf8');

const replacements = [
  { oldEmail: 'medintegralbio@gmail.com', newEmail: 'superadmin@rutax.com' },
  { oldEmail: 'carlos.andrade@rutax.ec', newEmail: 'admin@rutax.com' },
  { oldEmail: 'wilson.sauces@rutax.ec', newEmail: 'baseA@rutax.com' },
  { oldEmail: 'edison.centro@rutax.ec', newEmail: 'baseB@rutax.com' },
  { oldEmail: 'manuel.holguin@gmail.com', newEmail: 'socio@rutax.com' },
  { oldEmail: 'juan.perez@rutax.ec', newEmail: 'chofer@rutax.com' },
];

replacements.forEach(rep => {
  code = code.replace(rep.oldEmail, rep.newEmail);
});

fs.writeFileSync(storePath, code);
