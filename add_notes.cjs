const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add lazy import
const lazyTarget = `const SupportTicketsTab = lazy(() => import('./admin/tabs/hosting/SupportTickets').then(m => ({ default: m.default })));`;
const lazyReplacement = `${lazyTarget}\nconst InternalNotesTab = lazy(() => import('./admin/tabs/notes/InternalNotes').then(m => ({ default: m.default })));`;
content = content.replace(lazyTarget, lazyReplacement);

// 2. Add 'internal_notes' to activeTab state
content = content.replace(`'tasks' | 'support_tickets' | 'hosting_support_tickets'>`, `'tasks' | 'support_tickets' | 'hosting_support_tickets' | 'internal_notes'>`);

// 3. Add sidebar button (under CRM or General section)
const btnTarget = `                  <button
                    onClick={() => setActiveTab('crm')}
                    className={cn(`;
const btnReplacement = `                  <button
                    onClick={() => setActiveTab('internal_notes')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} />
                    <span>Staff Notes</span>
                  </button>\n                  <button
                    onClick={() => setActiveTab('crm')}
                    className={cn(`;
content = content.replace(btnTarget, btnReplacement);

// 4. Add render logic
const renderTarget = `        ) : activeTab === 'tasks' ? (
          <TaskManager />`;
const renderReplacement = `        ) : activeTab === 'internal_notes' ? (
          <InternalNotesTab />\n        ) : activeTab === 'tasks' ? (
          <TaskManager />`;
content = content.replace(renderTarget, renderReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Added InternalNotes to AdminDashboard');
