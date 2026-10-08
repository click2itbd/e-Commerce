const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const nl = c.includes('\r\n') ? '\r\n' : '\n';
  
  // Update Category Pills to flex-wrap
  // Replace `overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`
  // with `flex-wrap`
  c = c.replace(/overflow-x-auto pb-1 \[&::-webkit-scrollbar\]:hidden \[-ms-overflow-style:none\] \[scrollbar-width:none\]/g, 'flex-wrap');
  
  fs.writeFileSync(filePath, c);
}

updateFile('src/pages/ecommerceDashboard/EcommerceInventory.tsx');
updateFile('src/pages/admin/tabs/inventory/Inventory.tsx');
console.log('Updated category pills to wrap in both inventory files');