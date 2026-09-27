const fs = require('fs');
let pd = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');

const stateVars = `  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);`;
const fbtState = `  const [fbtFullProducts, setFbtFullProducts] = useState<Product[]>([]);`;

if (!pd.includes('fbtFullProducts')) {
    pd = pd.replace(stateVars, stateVars + '\n' + fbtState);
}

const relatedFetch = `            // Fetch related`;
const fbtFetch = `            // Fetch FBT products
            if (pData.fbtProducts && pData.fbtProducts.length > 0) {
              try {
                const fbtSnaps = await Promise.all(pData.fbtProducts.map(fid => getDoc(doc(db, 'products', fid))));
                const fbtArr = fbtSnaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() } as Product));
                setFbtFullProducts(fbtArr);
              } catch (e) {
                console.error("Error fetching fbt", e);
              }
            }

`;
if (!pd.includes('Fetch FBT products')) {
    pd = pd.replace(relatedFetch, fbtFetch + relatedFetch);
}

const relatedUI = `        {/* Related Products */}`;
const fbtUI = `        {/* Frequently Bought Together (FBT) / Combo Offer */}
        {fbtFullProducts.length > 0 && (
          <div className="mt-8 mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <h3 className="text-xl font-black text-[#081621] mb-6 flex items-center gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">COMBO OFFER</span>
              Frequently Bought Together
            </h3>
            
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Products Row */}
              <div className="flex-1 flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-center gap-2 max-w-[120px]">
                  <img src={product.images?.[0]} className="w-24 h-24 object-contain bg-white rounded-lg border border-gray-200 p-2" alt="Main" />
                  <span className="text-xs font-bold text-center line-clamp-2">{product.name}</span>
                  <span className="text-sm font-bold text-orange-500">{formatCurrency(displayPrice)}</span>
                </div>
                
                {fbtFullProducts.map(fbtP => (
                  <React.Fragment key={fbtP.id}>
                    <div className="text-gray-400 font-bold text-2xl">+</div>
                    <div className="flex flex-col items-center gap-2 max-w-[120px]">
                      <img src={fbtP.images?.[0]} className="w-24 h-24 object-contain bg-white rounded-lg border border-gray-200 p-2" alt="FBT" />
                      <span className="text-xs font-bold text-center line-clamp-2">{fbtP.name}</span>
                      <span className="text-sm font-bold text-orange-500">{formatCurrency(fbtP.discountPrice || fbtP.price)}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              
              {/* Action Box */}
              <div className="w-full lg:w-72 bg-white p-6 rounded-xl border border-blue-200 shadow-sm text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Price:</p>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {product.fbtDiscount ? (
                    <>
                      <span className="text-lg text-gray-400 line-through decoration-red-500 font-bold">
                        {formatCurrency(
                          displayPrice + fbtFullProducts.reduce((sum, p) => sum + (p.discountPrice || p.price), 0)
                        )}
                      </span>
                      <span className="text-2xl font-black text-[#081621]">
                        {formatCurrency(
                          displayPrice + fbtFullProducts.reduce((sum, p) => sum + (p.discountPrice || p.price), 0) - product.fbtDiscount
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-[#081621]">
                      {formatCurrency(
                        displayPrice + fbtFullProducts.reduce((sum, p) => sum + (p.discountPrice || p.price), 0)
                      )}
                    </span>
                  )}
                </div>
                {product.fbtDiscount && (
                  <p className="text-sm font-bold text-green-600 mb-4">You Save {formatCurrency(product.fbtDiscount)}!</p>
                )}
                
                <button 
                  onClick={() => {
                    // Add main product
                    // If there's a discount, we apply it to the main product for simplicity
                    const comboMain = { ...product };
                    if (comboMain.fbtDiscount) {
                      comboMain.discountPrice = displayPrice - comboMain.fbtDiscount;
                    }
                    addToCart(comboMain);
                    // Add FBT products
                    fbtFullProducts.forEach(fP => addToCart(fP));
                    toast.success('Combo added to cart successfully!');
                  }}
                  className="w-full bg-[#081621] hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Buy Both & Save
                </button>
              </div>
            </div>
          </div>
        )}
`;

if (!pd.includes('COMBO OFFER')) {
    pd = pd.replace(relatedUI, fbtUI + '\n' + relatedUI);
    fs.writeFileSync('src/pages/shop/ProductDetails.tsx', pd, 'utf8');
    console.log('Added FBT UI to ProductDetails');
}