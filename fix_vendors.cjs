const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Vendors.tsx', 'utf8');

if (content.includes('type="email"\n                  required')) {
  content = content.replace(/type="email"\n                  required/g, 'type="email"');
  fs.writeFileSync('src/pages/admin/tabs/purchase/Vendors.tsx', content, 'utf8');
  console.log("Fixed Vendors.tsx");
} else if (content.includes('type="email"')) {
   console.log("Found email, but required not matched properly");
}
