const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<button onClick={() => setActiveTab('crm')}`;
const replacement = `<button onClick={() => setActiveTab('internal_notes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} /> Staff Notes
                </button>\n                <button onClick={() => setActiveTab('crm')}`;

if (!content.includes('setActiveTab(\'internal_notes\')')) {
  content = content.replace(target, replacement);
  
  // also make sure to add internal_notes to the union type
  content = content.replace(`'tasks' | 'support_tickets' | 'hosting_support_tickets'>`, `'tasks' | 'support_tickets' | 'hosting_support_tickets' | 'internal_notes'>`);
  
  // add the render logic if not there
  if (!content.includes('<InternalNotesTab />')) {
    const renderTarget = `) : activeTab === 'tasks' ? (`;
    const renderReplacement = `) : activeTab === 'internal_notes' ? (\n          <InternalNotesTab />\n        ) : activeTab === 'tasks' ? (`;
    content = content.replace(renderTarget, renderReplacement);
  }

  // add import if not there
  if (!content.includes('InternalNotesTab')) {
    const lazyTarget = `const SupportTicketsTab = lazy(() => import('./admin/tabs/hosting/SupportTickets').then(m => ({ default: m.default })));`;
    const lazyReplacement = `${lazyTarget}\nconst InternalNotesTab = lazy(() => import('./admin/tabs/notes/InternalNotes').then(m => ({ default: m.default })));`;
    content = content.replace(lazyTarget, lazyReplacement);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added Staff Notes properly');
