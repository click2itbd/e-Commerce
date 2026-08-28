const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/POS/index.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `setIsRedeemingPoints={setIsRedeemingPoints}\n          />`,
  `setIsRedeemingPoints={setIsRedeemingPoints}\n            saleSource={saleSource}\n            setSaleSource={setSaleSource}\n          />`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Passed saleSource in POS/index.tsx');
