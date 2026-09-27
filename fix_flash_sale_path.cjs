const fs = require('fs');

// 1. Update EcommerceFlashSales.tsx
let admin = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceFlashSales.tsx', 'utf8');
admin = admin.replace(
  "doc(db, 'settings', 'ecommerce_flash_sale')",
  "doc(db, 'store_banners', 'ecommerce_flash_sale')"
);
admin = admin.replace(
  "doc(db, 'settings', 'ecommerce_flash_sale')",
  "doc(db, 'store_banners', 'ecommerce_flash_sale')"
);
fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceFlashSales.tsx', admin, 'utf8');

// 2. Update HomeSections.tsx
let home = fs.readFileSync('src/components/home/HomeSections.tsx', 'utf8');
home = home.replace(
  "doc(db, 'settings', 'ecommerce_flash_sale')",
  "doc(db, 'store_banners', 'ecommerce_flash_sale')"
);
fs.writeFileSync('src/components/home/HomeSections.tsx', home, 'utf8');

console.log('Fixed Firestore path');