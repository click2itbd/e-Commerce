const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx', 'utf8');

const regex = /\) : activeTab === '([^']+)'/g;
let match;
const tabs = [];
while ((match = regex.exec(content)) !== null) {
  tabs.push(match[1]);
}

console.log('All tabs found:', tabs.join(', '));
