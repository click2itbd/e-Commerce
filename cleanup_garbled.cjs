const fs = require('fs');
const path = require('path');

function replaceGarbled(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\( 3\)/g, ''); // Removes "( 3)"
  content = content.replace(/\?"/g, '-');   // Replaces ?" with -
  content = content.replace(/\?"\?\?"\?/g, '---'); 
  // Let's just use regex for any non-ascii that is messing up
  content = content.replace(/Sale Price \(.*?\)/g, 'Sale Price');
  content = content.replace(/Manual Discount \(.*?\)/g, 'Manual Discount');
  content = content.replace(/Paid Amount \(.*?\) .*? Total/g, 'Paid Amount - Total');
  content = content.replace(/\{\/\* .*? LEFT: SALES ORDER INVOICE FORM \(7 COLS\) .*? \*\/\}/g, '{/* --- LEFT: SALES ORDER INVOICE FORM (7 COLS) --- */}');
  content = content.replace(/\{\/\* .*? RIGHT: PRODUCT CATALOG & QUICK SELECT \(5 COLS\) .*? \*\/\}/g, '{/* --- RIGHT: PRODUCT CATALOG & QUICK SELECT (5 COLS) --- */}');
  content = content.replace(/\/\/ Send email invoice \(non-blocking .*? never prevents sale from saving\)/g, '// Send email invoice (non-blocking - never prevents sale from saving)');
  fs.writeFileSync(file, content, 'utf8');
}

replaceGarbled(path.join(__dirname, 'src/pages/admin/tabs/sales/SalesForm.tsx'));

const posFile = path.join(__dirname, 'src/pages/admin/POS/index.tsx');
let posContent = fs.readFileSync(posFile, 'utf8');
posContent = posContent.replace(/toast\.error\('Item is out of stock', \{ icon: '.*?' \}\);/g, "toast.error('Item is out of stock', { icon: '⚠️' });");
fs.writeFileSync(posFile, posContent, 'utf8');

console.log('Cleaned up garbled text');
