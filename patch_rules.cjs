const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'firestore.rules');
let content = fs.readFileSync(file, 'utf8');

const oldMenus = `    match /menus/{menuId} {
      allow read: if true;
      allow create, update: if hasPermission('manage_settings') && isValidMenu(request.resource.data);
      allow delete: if hasPermission('manage_settings');
    }`;

const newMenus = `    match /menus/{menuId} {
      allow read: if true;
      allow create, update: if hasStaffAccess() && isValidMenu(request.resource.data);
      allow delete: if hasPermission('manage_settings');
    }`;

content = content.replace(oldMenus, newMenus);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed menus rules');
