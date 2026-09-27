const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('function handleAddProduct'));
if (startIndex !== -1) {
    console.log(lines.slice(startIndex - 5, startIndex + 30).join('\n'));
} else {
    // try to find where products are added
    const idx = lines.findIndex(l => l.includes('addProduct'));
    console.log(lines.slice(idx - 5, idx + 20).join('\n'));
}