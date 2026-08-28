const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/types.ts');
let content = fs.readFileSync(file, 'utf8');

// Add model to Product
content = content.replace(/export interface Product \{/, `export interface Product {\n  model?: string;`);

// Add saleSource to Order
content = content.replace(/export interface Order \{/, `export interface Order {\n  saleSource?: 'in_store' | 'online';`);

// Add InternalNote interface at the end
content += `\n\nexport interface InternalNote {\n  id: string;\n  content: string;\n  createdBy: string;\n  authorName: string;\n  createdAt: string;\n  status: 'pending' | 'resolved';\n}\n`;

fs.writeFileSync(file, content, 'utf8');
console.log('Updated src/types.ts');
