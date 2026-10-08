const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting-dashboard/tabs/DashboardTab.tsx', 'utf8');
const startIndex = code.indexOf('{/* Bottom Row */}');
if (startIndex !== -1) {
  let safeCode = code.substring(0, startIndex);
  let replacement = fs.readFileSync('new_row.txt', 'utf8');
  fs.writeFileSync('src/pages/hosting-dashboard/tabs/DashboardTab.tsx', safeCode + replacement);
  console.log('UTF8_SUCCESS');
}
