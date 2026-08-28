const fs = require('fs');
const file = 'src/pages/admin/tabs/hr/Users.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<div className="flex flex-col gap-3 mb-6 max-h-\[60vh\] overflow-y-auto pr-2">[\s\S]*?<\/div>/;
const regex2 = /<div className="flex flex-col gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">[\s\S]*?<\/div>/;

const renderTreeEdit = `<div className="flex flex-col gap-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                  {(() => {
                    const currentPerms = editingUserPermissions.permissions || [];
                    const onChangePerms = (newPerms: string[]) => {
                      setEditingUserPermissions({...editingUserPermissions, permissions: newPerms});
                    };
                    return permissionsTree.map((parent) => {
                      const isParentChecked = currentPerms.includes(parent.id);
                      const allChildIds = parent.sub.map(s => s.id);
                      const isPartiallyChecked = (!allChildIds.every(id => currentPerms.includes(id)) && allChildIds.some(id => currentPerms.includes(id))) || (isParentChecked && !allChildIds.every(id => currentPerms.includes(id)));
                      
                      return (
                        <div key={parent.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isParentChecked || allChildIds.every(id => currentPerms.includes(id))}
                                ref={(el) => { if (el) el.indeterminate = isPartiallyChecked; }}
                                onChange={() => handleParentCheck(parent, currentPerms, onChangePerms)}
                                className="rounded text-[#EF4444] focus:ring-[#EF4444]"
                              />
                              <span className="font-bold text-sm text-gray-800">{parent.label}</span>
                            </label>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); toggleExpand(parent.id); }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedPerms[parent.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </div>
                          
                          {expandedPerms[parent.id] && (
                            <div className="p-3 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {parent.sub.map(child => (
                                <label key={child.id} className="flex items-center gap-2 cursor-pointer text-sm p-1.5 hover:bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                    checked={currentPerms.includes(child.id) || currentPerms.includes(parent.id)}
                                    onChange={() => handleChildCheck(parent.id, child.id, currentPerms, onChangePerms)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-600">{child.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>`;

const renderTreeAdd = renderTreeEdit.replace(/editingUserPermissions/g, 'userFormData').replace(/setEditingUserPermissions\(\{\.\.\.editingUserPermissions/g, 'setUserFormData({...userFormData').replace(/text-\[\#EF4444\] focus:ring-\[\#EF4444\]/g, 'text-blue-600 focus:ring-blue-500').replace(/<div className="flex flex-col gap-3 mb-6 max-h-\[60vh\] overflow-y-auto pr-2">/, '<div className="flex flex-col gap-3 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-md">');

if (regex1.test(content)) {
    content = content.replace(regex1, renderTreeEdit);
    console.log('Replaced regex1');
}

if (regex2.test(content)) {
    content = content.replace(regex2, renderTreeAdd);
    console.log('Replaced regex2');
}

if (!content.includes('ChevronDown')) {
    content = content.replace("import { Users as UsersIcon, Mail, X, Trash2, Shield, Key } from 'lucide-react';",
                              "import { Users as UsersIcon, Mail, X, Trash2, Shield, Key, ChevronDown, ChevronRight } from 'lucide-react';");
}
if (!content.includes('const [expandedPerms, setExpandedPerms]')) {
    content = content.replace("const [userFormData", "const [expandedPerms, setExpandedPerms] = useState<Record<string, boolean>>({});\n  const [userFormData");
}


fs.writeFileSync(file, content, 'utf8');
