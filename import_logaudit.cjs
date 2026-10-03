const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes("import { logAudit }")) {
  code = code.replace(/import \{ db \} from '\.\.\/firebase';/, "import { db } from '../firebase';\nimport { logAudit } from '../lib/audit';");
  fs.writeFileSync('src/pages/AdminDashboard.tsx', code, 'utf8');
  console.log("Imported logAudit");
}
