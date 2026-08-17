const fs = require('fs');

const filePath = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the old sales form JSX from ") : (" after SalesForm to "})" before Confirm Modal
const oldBlock = content.substring(content.indexOf(') : (\n          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">'), content.indexOf('\n  {/* Confirm Modal */}'));

content = content.replace(oldBlock, '');

fs.writeFileSync(filePath, content);
console.log('Removed old sales form JSX');
