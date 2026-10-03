const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const target = "<p><strong>Discount:</strong> ${q.discountAmount || 0}</p>";
const replacement = "<p><strong>Discount:</strong> ${(q.discountAmount || 0) + (q.items?.reduce((sum, item) => sum + (item.discount || 0), 0) || 0)}</p>";

code = code.replace(target, replacement);
fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Fixed email discount logic');
