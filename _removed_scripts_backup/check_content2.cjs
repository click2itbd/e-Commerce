const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx', 'utf8');
const i = content.indexOf("activeTab === 'inventory' ? (");
console.log(content.slice(i - 100, i + 300));
