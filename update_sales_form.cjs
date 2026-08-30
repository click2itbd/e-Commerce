const fs = require('fs');
let sfFile = 'src/pages/admin/tabs/sales/SalesForm.tsx';
let sfContent = fs.readFileSync(sfFile, 'utf8');

const replacement = `onChange={e => setProductSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = productSearch.trim().toLowerCase();
                    if (!val) return;
                    const matched = products.find(p => p.id.toLowerCase() === val || (p.model && p.model.toLowerCase() === val) || p.name.toLowerCase() === val);
                    if (matched) {
                      addItemToSale(matched);
                      setProductSearch('');
                      toast.success('Product added via barcode');
                    }
                  }
                }}
                className="w-full pl-8 pr-3 py-2 border`;

sfContent = sfContent.replace('onChange={e => setProductSearch(e.target.value)}\n                  className="w-full pl-8 pr-3 py-2 border', replacement);

fs.writeFileSync(sfFile, sfContent, 'utf8');
