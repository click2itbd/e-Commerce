const fs = require('fs');
let pFile = 'src/pages/admin/tabs/purchase/Purchases.tsx';
let pContent = fs.readFileSync(pFile, 'utf8');

const replacement = `onChange={e => setProductCatalogSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = productCatalogSearch.trim().toLowerCase();
                        if (!val) return;
                        const matched = products.find(p => p.id.toLowerCase() === val || (p.model && p.model.toLowerCase() === val) || p.name.toLowerCase() === val);
                        if (matched) {
                          addItemToPurchase(matched);
                          setProductCatalogSearch('');
                          toast.success('Product added via barcode');
                        }
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2`;

pContent = pContent.replace('onChange={e => setProductCatalogSearch(e.target.value)}\n                      className="w-full pl-8 pr-3 py-2', replacement);

fs.writeFileSync(pFile, pContent, 'utf8');
