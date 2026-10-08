const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
const lines = c.split(/\r?\n/);

let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Delete Selected')) {
    for (let j = i; j < i + 5; j++) {
      if (lines[j] !== undefined && lines[j].trim() === '</div>' && lines[j-1].trim() === ')}') {
        lines[j] = ''; // Remove it
        found = true;
        break;
      }
    }
    if (found) break;
  }
}

if (found) {
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', lines.join(nl));
  console.log('Fixed syntax error in EcommerceInventory.tsx');
} else {
  console.log('Could not find the extra div');
}