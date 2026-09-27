const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');
const searchIndex = content.indexOf('placeholder="Search products by name or barcode"');
if (searchIndex !== -1) {
    const lines = content.substring(0, searchIndex).split('\n');
    const startLine = lines.length - 10;
    const allLines = content.split('\n');
    console.log(allLines.slice(startLine, startLine + 30).join('\n'));
} else {
    console.log("Could not find search input");
}