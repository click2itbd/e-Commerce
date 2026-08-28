const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

// I will make it super clear:
const target = `<span className="text-xs font-bold text-slate-500 uppercase">Months</span>`;
const replacement = `<span className="text-xs font-bold text-slate-500 uppercase">Months</span>`;

if (content.includes(target)) {
  console.log("Already says Months");
}
