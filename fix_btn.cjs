const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/hr/Users.tsx', 'utf8');

code = code.replace(
  /className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2\.5 py-1\s*rounded transition-colors"\s*title="Edit Permissions"\s*>\s*Permissions\s*<\/button>/m,
  `className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded transition-colors"
                        title="Edit User Profile & Permissions"
                      >
                        Edit User
                      </button>`
);

fs.writeFileSync('src/pages/admin/tabs/hr/Users.tsx', code);
console.log('Fixed button text');
