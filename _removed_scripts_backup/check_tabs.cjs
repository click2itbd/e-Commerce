const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx', 'utf8');

// Find all activeTab markers and show surrounding context
const regex = /\) : activeTab === '([^']+)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = match.index;
  const context = content.slice(start, start + 200);
  console.log(`Tab: ${match[1]}`);
  console.log(context.split('\n').slice(0, 5).join('\n'));
  console.log('---');
}
