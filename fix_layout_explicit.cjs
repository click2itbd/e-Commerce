const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

layout = layout.replace(
    "pathname.startsWith('/pre-book')", 
    "pathname.startsWith('/pre-book') ||\n    pathname.startsWith('/track-order')"
);

fs.writeFileSync('src/components/Layout.tsx', layout, 'utf8');
console.log('Added /track-order to explicit EcommerceNavbar block!');