const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/reports/AuditLogs.tsx', 'utf8');

// Change titles
code = code.replace("Admin Audit Logs (Delete History)", "Admin Audit Logs (Edit & Delete History)");
code = code.replace("Record of all permanent deletions performed by Administrators.", "Record of edits and deletions performed by Administrators.");
code = code.replace("No deletion logs found for the selected criteria.", "No audit logs found for the selected criteria.");

// Replace red trash icon style with dynamic one based on action
const rowRegex = /<span className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">\s*<Trash2 size=\{12\} \/> \{log\.action\}\s*<\/span>/;

const dynamicBadge = `{log.action === 'DELETE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                        <Trash2 size={12} /> {log.action}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
                        <Edit2 size={12} /> {log.action}
                      </span>
                    )}`;

code = code.replace(rowRegex, dynamicBadge);

// Ensure Edit2 is imported
if (!code.includes('Edit2')) {
  code = code.replace(/import \{ Loader2, ShieldAlert, Trash2, Clock, User, Filter \} from 'lucide-react';/, "import { Loader2, ShieldAlert, Trash2, Clock, User, Filter, Edit2 } from 'lucide-react';");
}

fs.writeFileSync('src/pages/admin/tabs/reports/AuditLogs.tsx', code, 'utf8');
console.log('Updated AuditLogs.tsx');
