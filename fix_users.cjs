const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/hr/Users.tsx', 'utf8');

// Update the title
code = code.replace(
  '<h3 className="font-bold text-lg mb-4">Edit Permissions for {editingUserPermissions.displayName}</h3>',
  '<h3 className="font-bold text-lg mb-4">Edit Profile & Permissions</h3>'
);

// Add the display name input
code = code.replace(
  '<div className="grid grid-cols-2 gap-2 mb-6">',
  `<div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name / Nickname</label>
                <input
                  type="text"
                  required
                  className="w-full border-gray-300 rounded-md"
                  value={editingUserPermissions.displayName || ''}
                  onChange={e => setEditingUserPermissions({...editingUserPermissions, displayName: e.target.value})}
                  placeholder="e.g. System Admin, Muntasir..."
                />
              </div>
              <h4 className="font-bold text-sm mb-2 text-gray-700">App Permissions</h4>
              <div className="grid grid-cols-2 gap-2 mb-6">`
);

// Update the save logic
code = code.replace(
  'await updateDoc(doc(db, \'users\', editingUserPermissions.uid), { permissions: editingUserPermissions.permissions });',
  'await updateDoc(doc(db, \'users\', editingUserPermissions.uid), { permissions: editingUserPermissions.permissions, displayName: editingUserPermissions.displayName });'
);

// Update the button name from "Permissions" to "Edit User"
code = code.replace(
  '<button \n                        onClick={() => {\n                          setEditingUserPermissions(user);\n                          setShowPermissionsModal(true);\n                        }}\n                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1 rounded transition-colors"\n                        title="Edit Permissions"\n                      >\n                        Permissions\n                      </button>',
  `<button 
                        onClick={() => {
                          setEditingUserPermissions(user);
                          setShowPermissionsModal(true);
                        }}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded transition-colors"
                        title="Edit User Profile & Permissions"
                      >
                        Edit User
                      </button>`
);

// And update the button if formatting varies
code = code.replace(
  `                      <button \n                        onClick={() => {\n                          setEditingUserPermissions(user);\n                          setShowPermissionsModal(true);\n                        }}\n                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1 \nrounded transition-colors"\n                        title="Edit Permissions"\n                      >\n                        Permissions\n                      </button>`,
  `<button 
                        onClick={() => {
                          setEditingUserPermissions(user);
                          setShowPermissionsModal(true);
                        }}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded transition-colors"
                        title="Edit User Profile & Permissions"
                      >
                        Edit User
                      </button>`
);


fs.writeFileSync('src/pages/admin/tabs/hr/Users.tsx', code);
console.log('Fixed Users.tsx');
