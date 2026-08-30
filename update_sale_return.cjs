const fs = require('fs');
let file = 'src/pages/admin/tabs/sales/SaleReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

const scanComponent = `
            {/* Items Return Table */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Scan barcode to automatically return item..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim().toLowerCase();
                    if (!val) return;
                    
                    const itemIndex = returnItems.findIndex(i => i.productId.toLowerCase() === val || (i.name && i.name.toLowerCase().includes(val)));
                    if (itemIndex > -1) {
                      const item = returnItems[itemIndex];
                      if (item.returnQty < item.soldQty) {
                        const newReturnItems = [...returnItems];
                        newReturnItems[itemIndex].returnQty += 1;
                        setReturnItems(newReturnItems);
                        toast.success('Incremented return qty for ' + item.name);
                      } else {
                        toast.error('Cannot return more than sold quantity (' + item.soldQty + ')');
                      }
                    } else {
                      toast.error('Item not found in this invoice');
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#EF4444]"
              />
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
`;

content = content.replace('{/* Items Return Table */}\n            <div className="border border-gray-200 rounded-xl overflow-hidden">', scanComponent);
fs.writeFileSync(file, content, 'utf8');
