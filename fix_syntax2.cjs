const fs = require('fs');
let c = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
const lines = c.split(/\r?\n/);

// Remove the extra </div> at line 491
// Wait, to be safe, let's just find it contextually
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Delete Selected') && lines[i+2].includes(')}')) {
    if (lines[i+3].trim() === '</div>') {
      lines[i+3] = ''; // Remove the extra div
      found = true;
      break;
    }
  }
}

if (found) {
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', lines.join(nl));
  console.log('Fixed syntax error in EcommerceInventory.tsx');
} else {
  console.log('Could not find the extra div');
}