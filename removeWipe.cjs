const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /useEffect\(\(\) => \{\s*const wipeData = async \(\) => \{[\s\S]*?\}, \[\]\);\s*/;
content = content.replace(regex, '');

fs.writeFileSync(file, content, 'utf8');
