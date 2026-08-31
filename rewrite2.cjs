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

content = content.replace("const docNumber = await generateDocumentNumber('PUR');", newLogic);

const stockUpdateOld = `      // 1. Update Product Inventory & Stock & Cost Price
      for (const item of purchaseForm.items) {`;
const stockUpdateNew = `      // 1. Update Product Inventory & Stock & Cost Price
      if (purchaseForm.status === 'Received' || purchaseForm.status === 'Partially Received') {
        for (const item of purchaseForm.items) {`;
content = content.replace(stockUpdateOld, stockUpdateNew);

const saveRecOld = `      // 2. Save Purchase Record to Firestore \`purchases\`
      const selectedAcc = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);`;
const saveRecNew = `      }

      // 2. Save Purchase Record to Firestore \`purchases\`
      const selectedAcc = paymentAccounts.find(a => a.id === purchaseForm.paymentAccountId);`;
content = content.replace(saveRecOld, saveRecNew);

const purchaseRecOld = `      const purchaseRecord: Omit<PurchaseRecord, 'id'> = {
        documentNumber: docNumber,
        vendorId: purchaseForm.vendorId,
        vendorName: purchaseForm.vendorName,
        date: new Date(purchaseForm.date).toISOString(),
        items: purchaseForm.items,
        subtotal: billTotal,
        total: billTotal,`;
const purchaseRecNew = `      const purchaseRecord: Omit<PurchaseRecord, 'id'> = {
        documentNumber: docNumber,
        vendorId: purchaseForm.vendorId,
        vendorName: purchaseForm.vendorName,
        date: new Date(purchaseForm.date).toISOString(),
        status: purchaseForm.status,
        invoiceUrl: invoiceUrl,
        items: purchaseForm.items,
        subtotal: subtotal,
        taxTotal: totalTax,
        discountTotal: totalDiscount,
        total: billTotal,`;
content = content.replace(purchaseRecOld, purchaseRecNew);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf-8');
