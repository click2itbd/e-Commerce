const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\) : activeTab === 'services' && isAdmin \? \(\n([\s\S]*?)\n\s*\) : activeTab === 'settings' && isAdmin \? \(/;

if (regex.test(content)) {
    content = content.replace(regex, ") : activeTab === 'settings' && isAdmin ? (");
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully removed redundant services tab.");
} else {
    console.log("Could not find the redundant tabular block.");
}
