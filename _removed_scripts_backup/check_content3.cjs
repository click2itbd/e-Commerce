const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/AdminDashboard.tsx', 'utf8');
const i = content.indexOf("activeTab === 'inventory' ? (");
// Find the next tab after inventory
const rest = content.slice(i);
const salesMatch = rest.match(/\) : activeTab === 'sales' \(\n/);
console.log('Sales match:', salesMatch ? 'found' : 'not found');
if (salesMatch) {
  console.log('Sales index in rest:', salesMatch.index);
}
// Find what comes after inventory inline JSX
const nextActiveTab = rest.indexOf(") : activeTab === '");
console.log('Next activeTab index:', nextActiveTab);
console.log(rest.slice(nextActiveTab, nextActiveTab + 100));
