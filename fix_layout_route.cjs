const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layout = layout.replace(
    "pathname.startsWith('/login')", 
    "pathname.startsWith('/login') ||\n    pathname === '/track-order'"
);

fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');
console.log('Added /track-order to smart deduction list!');