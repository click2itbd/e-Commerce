const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '<ShieldAlert size={16} className={activeTab === \'brands\'',
  '<Tag size={16} className={activeTab === \'brands\''
);
fs.writeFileSync(file, content, 'utf8');
