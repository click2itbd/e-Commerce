const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');
const start = content.lastIndexOf('</React.Fragment>');
console.log(content.slice(start - 200, start + 500));