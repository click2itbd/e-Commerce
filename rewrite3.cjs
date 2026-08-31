const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf-8');

const newLogic = `const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
      const docNumber = \`PO-\${dateStr}-\${randomStr}\`;
      
      let invoiceUrl = '';
      if (purchaseForm.invoiceFile) {
        const fileRef = ref(storage, \`purchases/invoices/\${docNumber}_\${purchaseForm.invoiceFile.name}\`);
        await uploadBytes(fileRef, purchaseForm.invoiceFile);
        invoiceUrl = await getDownloadURL(fileRef);
      }`;

content = content.replace(/const docNumber = await generateDocumentNumber\('PUR'\);/g, newLogic);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf-8');
