const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/types.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace the strict type union with a string alias
const target = `export type UserPermission = 'view_dashboard' | 'manage_users' | 'manage_settings' | 'manage_inventory' | 'manage_orders' | 'manage_finances' | 'manage_reports' | 'manage_hr' | 'manage_services' | 'manage_marketing';`;
const replacement = `export type UserPermission = string; // Changed to string to support granular tab-level permissions while preserving legacy categories`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated types.ts');
} else {
  console.log('Could not find UserPermission target in types.ts');
}
