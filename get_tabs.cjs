const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regex = /<button onClick=\{\(\) => setActiveTab\('([^']+)'\)\}.*?>[\s\S]*?<\/button>/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const id = match[1];
  let text = match[0].replace(/<[^>]+>/g, '').trim();
  text = text.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');
  console.log(`- id: ${id} | label: ${text}`);
}
