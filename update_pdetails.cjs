const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');

// 1. Add state for image zoom modal
if (!content.includes('const [isImageZoomed, setIsImageZoomed] = useState(false);')) {
    content = content.replace(
        'const [selectedImage, setSelectedImage] = useState(0);',
        'const [selectedImage, setSelectedImage] = useState(0);\n  const [isImageZoomed, setIsImageZoomed] = useState(false);'
    );
}

// 2. Add X icon import if missing
if (!content.includes('X,')) {
    content = content.replace(
        'import { ShoppingCart, Star, Heart, GitCompare, ChevronRight, Check, AlertTriangle, Play, Shield, Truck, RefreshCw } from "lucide-react";',
        'import { ShoppingCart, Star, Heart, GitCompare, ChevronRight, Check, AlertTriangle, Play, Shield, Truck, RefreshCw, X } from "lucide-react";'
    );
}

// 3. Define displayImages
if (!content.includes('const displayImages =')) {
    content = content.replace(
        'const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();',
        'const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();\n\n  const displayImages = product?.images?.length > 1 ? product.images : [product?.images?.[0], product?.images?.[0], product?.images?.[0], product?.images?.[0]].filter(Boolean);'
    );
}

// 4. Update the Image renderer
const oldImageHTML = `<div className="aspect-square border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4 relative group cursor-crosshair">
                <img
                  src={product.images?.[selectedImage] || product.images?.[0] || undefined}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-150"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        "w-20 h-20 border rounded-md p-1 flex-shrink-0 transition-all",
                        selectedImage === idx ? "border-[#F97316] shadow-sm" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}`;

const newImageHTML = `<div 
                className="aspect-square border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4 relative cursor-zoom-in bg-white hover:border-[#F97316] transition-colors"
                onClick={() => setIsImageZoomed(true)}
              >
                <img
                  src={displayImages?.[selectedImage] || undefined}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {displayImages && displayImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pt-2">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        "w-20 h-20 border rounded-lg p-2 flex-shrink-0 transition-all bg-white",
                        selectedImage === idx 
                          ? "border-[#F97316] shadow-[0_0_0_1px_#F97316]" 
                          : "border-gray-200 hover:border-[#F97316]/50"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}`;

content = content.replace(oldImageHTML, newImageHTML);

// 5. Add Modal HTML at the end of the container (just before the last closing tags)
const modalHTML = `
      {/* Zoom Modal */}
      {isImageZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <button 
            onClick={() => setIsImageZoomed(false)}
            className="absolute top-4 right-4 text-white hover:text-orange-500 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
          
          <img
            src={displayImages?.[selectedImage] || undefined}
            alt={product.name}
            className="w-full max-w-5xl max-h-[80vh] object-contain cursor-zoom-out"
            onClick={() => setIsImageZoomed(false)}
            referrerPolicy="no-referrer"
          />
          
          {displayImages && displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto mt-6 pb-2 px-4 w-full max-w-3xl justify-center">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(idx);
                  }}
                  className={cn(
                    "w-16 h-16 border rounded-lg p-1.5 flex-shrink-0 transition-all bg-white",
                    selectedImage === idx 
                      ? "border-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.5)] scale-110" 
                      : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
`;

content = content.replace('</Layout>', modalHTML + '\n    </Layout>');

fs.writeFileSync('src/pages/shop/ProductDetails.tsx', content, 'utf8');
console.log('ProductDetails.tsx updated');