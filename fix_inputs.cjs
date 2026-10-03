const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationManager.tsx', 'utf8');

const oldUpdateItem = `    const updateItem = (idx: number, field: string, value: any) => {
      const newItems = [...formData.items];
      if (field === 'quantity' && value < 1) value = 1;
      if (field === 'discount' && value < 0) value = 0;
      if (field === 'price' && value < 0) value = 0;
      
      (newItems[idx] as any)[field] = value;
      setFormData({ ...formData, items: newItems });
    };`;

const newUpdateItem = `    const updateItem = (idx: number, field: string, value: any) => {
      const newItems = [...formData.items];
      if (field === 'quantity' && value < 1) value = 1;
      if (field === 'discount' && value < 0) value = 0;
      if (field === 'price' && value < 0) value = 0;
      
      if (field === 'warranty') {
        (newItems[idx] as any).warranty = value;
        delete (newItems[idx] as any).warrantyMonths;
        if (!(newItems[idx] as any).specs) (newItems[idx] as any).specs = {};
        (newItems[idx] as any).specs.Warranty = value;
      } else {
        (newItems[idx] as any)[field] = value;
      }
      
      setFormData({ ...formData, items: newItems });
    };`;

code = code.replace(oldUpdateItem, newUpdateItem);

const oldTd = `                              <input 
                                type="text"
                                className="w-full border border-gray-200 p-1.5 rounded mt-1 text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description (Optional)"
                                value={item.description || ''}
                                onChange={e => updateItem(idx, 'description', e.target.value)}
                              />
                              {!(item as any).isCustomService && item.sku && (
                                 <div className="text-[10px] text-gray-400 font-normal mt-1">SKU: {item.sku}</div>
                              )}`;

const newTd = `                              <input 
                                type="text"
                                className="w-full border border-gray-200 p-1.5 rounded mt-1 text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description (Optional)"
                                value={item.description || ''}
                                onChange={e => updateItem(idx, 'description', e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Brand (Optional)"
                                  value={item.brand || ''}
                                  onChange={e => updateItem(idx, 'brand', e.target.value)}
                                />
                                <input 
                                  type="text"
                                  className="w-full border border-gray-200 p-1.5 rounded text-xs text-gray-600 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Warranty (Optional)"
                                  value={(item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? \`\${(item as any).warrantyMonths / 12} Yrs\` : \`\${(item as any).warrantyMonths} Mos\`) : '') || ''}
                                  onChange={e => updateItem(idx, 'warranty', e.target.value)}
                                />
                              </div>
                              {!(item as any).isCustomService && item.sku && (
                                 <div className="text-[10px] text-gray-400 font-normal mt-1">SKU: {item.sku}</div>
                              )}`;

code = code.replace(oldTd, newTd);

fs.writeFileSync('src/components/QuotationManager.tsx', code);
console.log('Fixed QuotationManager.tsx inputs');
