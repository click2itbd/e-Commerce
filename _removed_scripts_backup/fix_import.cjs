const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /from '\.\.\/firebase-applet-config\.json'/g,
    "from '../../firebase-applet-config.json'"
);

fs.writeFileSync(path, content, 'utf8');
