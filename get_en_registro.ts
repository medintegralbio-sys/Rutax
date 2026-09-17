import fs from 'fs';

const storePath = './src/services/store.ts';
let code = fs.readFileSync(storePath, 'utf8');

const matches = code.match(/estado:\s*'en_registro'/g);
console.log(matches ? matches.length : 0);
