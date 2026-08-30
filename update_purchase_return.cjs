const fs = require('fs');
let file = 'src/pages/admin/tabs/sales/PurchaseReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

const scanComponent = `
            {/* Items Table */}
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
                      if (item.returnQty < item.currentStock) {
                        const newReturnItems = [...returnItems];
                        newReturnItems[itemIndex].returnQty += 1;
                        setReturnItems(newReturnItems);
                        toast.success('Incremented return qty for ' + item.name);
                        
                        // Recalculate refund total
                        const newTotal = newReturnItems.reduce((sum, i) => sum + (i.returnQty * i.unitPrice), 0);
                        setRefundAmount(newTotal);
                      } else {
                        toast.error('Cannot return more than current stock (' + item.currentStock + ')');
                      }
                    } else {
                      toast.error('Item not found in this return list');
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#EF4444]"
              />
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
`;

content = content.replace('{/* Items Table */}\n            <div className="border border-gray-200 rounded-xl overflow-hidden">', scanComponent);
fs.writeFileSync(file, content, 'utf8');
