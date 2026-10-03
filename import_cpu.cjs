const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

if (!code.includes("Cpu,")) {
  code = code.replace(/AlertCircle,/, "AlertCircle,\n  Cpu,");
  fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', code, 'utf8');
  console.log("Imported Cpu");
}
