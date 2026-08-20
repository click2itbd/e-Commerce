const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-sections/HostingPlansSection.jsx', 'utf8');

content = content.replace(/return \([\s\r\n]*<section className="py-24/g, 'if (specialPlans.length === 0) return null;\n\n  return (\n    <section className="py-24');

fs.writeFileSync('src/pages/hosting-sections/HostingPlansSection.jsx', content, 'utf8');
console.log('Patched');
