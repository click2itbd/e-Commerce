const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `              {hasPermission('internal_notes') && (
              <button onClick={() => setActiveTab('internal_notes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} /> Staff Notes
              </button>`;

const replacement = `              {hasPermission('internal_notes') && (
              <button onClick={() => setActiveTab('internal_notes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} /> Staff Notes
              </button>
              )}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
