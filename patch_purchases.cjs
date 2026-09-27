const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// 1. Update PurchaseItem interface
content = content.replace(
  'subCategory?: string;\n}', 
  'subCategory?: string;\n  variantName?: string;\n}'
);

// 2. Update handleBarcodeScan
const scanOld = `const existingProduct = products.find(p => p.sku === scannedCode || p.availableSerials?.includes(scannedCode));
    if (existingProduct) {
       setPurchaseForm(prev => ({
          ...prev, 
          items: [...prev.items, {
            id: existingProduct.id,
            name: existingProduct.name,`;

const scanNew = `let matchedVariant: any = null;
    const existingProduct = products.find(p => {
       if (p.sku === scannedCode || p.availableSerials?.includes(scannedCode)) return true;
       if (p.variants?.some(v => v.sku === scannedCode)) {
           matchedVariant = p.variants.find(v => v.sku === scannedCode);
           return true;
       }
       return false;
    });

    if (existingProduct) {
       setPurchaseForm(prev => ({
          ...prev, 
          items: [...prev.items, {
            id: existingProduct.id,
            name: existingProduct.name,
            variantName: matchedVariant ? matchedVariant.name : undefined,`;

content = content.replace(scanOld, scanNew);

const newFallbackOld = `if (!name) { toast.error('Product Name is required for new items'); return; }
    setPurchaseForm(prev => ({
      ...prev, 
      items: [...prev.items, {
        id: 'NEW_' + Math.random().toString(36).substring(2, 9),
        name: name + (model ? ' ' + model : '') + (variant ? ' ' + variant : ''),`;

const newFallbackNew = `if (!name) { toast.error('Product Name is required for new items'); return; }
    setPurchaseForm(prev => ({
      ...prev, 
      items: [...prev.items, {
        id: 'NEW_' + Math.random().toString(36).substring(2, 9),
        name: name + (model ? ' ' + model : ''),
        variantName: variant || undefined,`;

content = content.replace(newFallbackOld, newFallbackNew);

// 3. Update table rendering
content = content.replace(
  '<span className="font-bold text-gray-900 block text-xs">{item.name}</span>',
  '<span className="font-bold text-gray-900 block text-xs">{item.name}{item.variantName ? ` - ${item.variantName}` : ""}</span>'
);

// 4. Group logic in handleSavePurchase
// We replace the loop logic. 
const saveLoopStartIdx = content.indexOf('for (let i = 0; i < updatedItems.length; i++) {');
const saveLoopEndIdx = content.indexOf('// 2. Save Purchase Record to Firestore `purchases`');

const newSaveLoop = `
      // Map to hold newly created/updated products within this transaction
      const localProductsMap = new Map<string, any>();

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        
        const effectivePurchasePrice = Number(item.purchasePrice) + shippingPerUnit;
        updatedItems[i].purchasePrice = effectivePurchasePrice;
        
        let currentProduct = localProductsMap.get(item.id) || products.find(p => p.id === item.id);

        if (!currentProduct && item.id.startsWith('NEW_')) {
           currentProduct = Array.from(localProductsMap.values()).find(p => 
              p.name.toLowerCase() === item.name.toLowerCase() &&
              (p.category || '').toLowerCase() === (item.category || '').toLowerCase() &&
              (p.brand || '').toLowerCase() === (item.brand || '').toLowerCase()
           ) || products.find(p => 
              p.name.toLowerCase() === item.name.toLowerCase() &&
              (p.category || '').toLowerCase() === (item.category || '').toLowerCase() &&
              (p.brand || '').toLowerCase() === (item.brand || '').toLowerCase()
           );
        }

        if (currentProduct) {
          const oldStock = Number(currentProduct.stock) || 0;
          const oldCost = Number(currentProduct.costPrice) || 0;
          const newStock = Number(item.quantity) || 0;
          const newCost = effectivePurchasePrice;
          
          const totalStock = oldStock + newStock;
          const averageCostPrice = totalStock > 0 
            ? ((oldStock * oldCost) + (newStock * newCost)) / totalStock 
            : newCost;

          const productRef = doc(db, 'products', currentProduct.id);
          const updates: any = {
            stock: totalStock,
            costPrice: averageCostPrice,
          };

          if (item.variantName) {
             let existingVariants = currentProduct.variants || [];
             const vIndex = existingVariants.findIndex((v: any) => v.name.toLowerCase() === item.variantName?.toLowerCase() || (item.sku && v.sku === item.sku));
             if (vIndex > -1) {
               existingVariants[vIndex].stock = (Number(existingVariants[vIndex].stock) || 0) + Number(item.quantity);
               if (item.salesPrice) existingVariants[vIndex].price = Number(item.salesPrice);
             } else {
               existingVariants.push({
                 id: crypto.randomUUID(),
                 name: item.variantName,
                 sku: item.sku || '',
                 price: Number(item.salesPrice) || 0,
                 stock: Number(item.quantity) || 0
               });
             }
             updates.variants = existingVariants;
             currentProduct.variants = existingVariants;
          } else {
             if (item.salesPrice) updates.price = Number(item.salesPrice);
             if (item.sku && !currentProduct.sku) updates.sku = item.sku;
          }

          if (item.hasWarranty && item.warrantyYears) {
            updates.warrantyMonths = Number(item.warrantyYears) * 12;
          }

          if (currentProduct.hasSerialTracking && item.newSerials) {
            const addedSerials = Array.isArray(item.newSerials)
              ? item.newSerials.filter((s: string) => s.trim())
              : String(item.newSerials)
                  .split(/[\\n,]/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s);

            updates.availableSerials = [...(currentProduct.availableSerials || []), ...addedSerials];
          }

          await updateDoc(productRef, updates);
          
          currentProduct.stock = totalStock;
          currentProduct.costPrice = averageCostPrice;
          localProductsMap.set(currentProduct.id, currentProduct);
          updatedItems[i].id = currentProduct.id;

        } else {
          // Completely new product
          const addedSerials = Array.isArray(item.newSerials)
             ? item.newSerials.filter((s: string) => s.trim())
             : String(item.newSerials || '')
                 .split(/[\\n,]/)
                 .map((s: string) => s.trim())
                 .filter((s: string) => s);
                 
          const newProductData: any = {
             name: item.name,
             category: item.category || 'General',
             subCategory: item.subCategory || '',
             brand: item.brand || '',
             description: item.name,
             images: [],
             sku: item.variantName ? '' : (item.sku || ''),
             costPrice: Number(item.purchasePrice) || 0,
             price: Number(item.salesPrice) || 0,
             stock: Number(item.quantity) || 0,
             hasWarranty: Boolean(item.hasWarranty),
             warrantyMonths: item.hasWarranty && item.warrantyYears ? Number(item.warrantyYears) * 12 : 0,
             hasSerialTracking: Boolean(item.hasSerialTracking),
             availableSerials: addedSerials,
             createdAt: new Date().toISOString()
          };

          if (item.variantName) {
             newProductData.variants = [{
                id: crypto.randomUUID(),
                name: item.variantName,
                sku: item.sku || '',
                price: Number(item.salesPrice) || 0,
                stock: Number(item.quantity) || 0
             }];
          }
          
          const docRef = await addDoc(collection(db, 'products'), newProductData);
          newProductData.id = docRef.id;
          localProductsMap.set(docRef.id, newProductData);
          updatedItems[i].id = docRef.id;
        }
      }

      `;

content = content.slice(0, saveLoopStartIdx) + newSaveLoop + content.slice(saveLoopEndIdx);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf8');
console.log('Patched handleSavePurchase successfully');