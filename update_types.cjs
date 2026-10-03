const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('preparedBy?: string;')) {
  code = code.replace(
    'export interface Order {\n  createdBy?: string;',
    'export interface Order {\n  createdBy?: string;\n  preparedBy?: string;'
  );
  fs.writeFileSync('src/types.ts', code);
  console.log('Added preparedBy to Order type');
}
