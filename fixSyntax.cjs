const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexLeftover = /\{hasPermission\('inventory'\) && \([\s\S]*?Categories\s*<\/button>\s*\)\}\s*<\/div>/;

if (regexLeftover.test(content)) {
  content = content.replace(regexLeftover, '');
  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed leftover syntax error");
} else {
  console.log("Could not find the leftover block");
}
