const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/reports/AuditLogs.tsx', 'utf8');

if (!code.includes("import { Loader2, ShieldAlert, Trash2, Clock, User, Filter, Edit2 }")) {
  code = code.replace(/import \{ Loader2, ShieldAlert, Trash2, Clock, User, Filter \} from 'lucide-react';/, "import { Loader2, ShieldAlert, Trash2, Clock, User, Filter, Edit2 } from 'lucide-react';");
  fs.writeFileSync('src/pages/admin/tabs/reports/AuditLogs.tsx', code, 'utf8');
  console.log("Imported Edit2");
}
