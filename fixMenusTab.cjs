const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexMenus = /<MenusTab menus=\{menus\}[\s\S]*?fetchData=\{fetchData\} \/>/;
if(regexMenus.test(content)) {
  content = content.replace(regexMenus, '<MenusTab />');
  fs.writeFileSync(file, content, 'utf8');
  console.log("Updated AdminDashboard for MenusTab");
} else {
  console.log("Failed to match MenusTab");
}
