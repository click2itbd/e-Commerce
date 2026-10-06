const fs = require('fs');
let c = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const wishlistBtn = `<button
            onClick={(e) => {
              e.preventDefault();
              if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
              } else {
                addToWishlist(product);
                toast.success('Added to wishlist!');
              }
            }}
            className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors cursor-pointer"
          >
            <Heart size={16} className={isInWishlist(product.id) ? 'fill-[#F97316] text-[#F97316]' : 'text-gray-400 hover:text-[#F97316]'} />
          </button>`;

const wishlistWithBadge = `<button
            onClick={(e) => {
              e.preventDefault();
              if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
              } else {
                addToWishlist(product);
                toast.success('Added to wishlist!');
              }
            }}
            className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors cursor-pointer"
          >
            <Heart size={16} className={isInWishlist(product.id) ? 'fill-[#F97316] text-[#F97316]' : 'text-gray-400 hover:text-[#F97316]'} />
          </button>
          
          {(product as any).condition === 'used' && (
            <div className="absolute top-2 left-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              USED
            </div>
          )}`;

if (c.includes(wishlistBtn) && !c.includes('USED')) {
  c = c.replace(wishlistBtn, wishlistWithBadge);
  fs.writeFileSync('src/components/ProductCard.tsx', c.replace(/\n/g, nl));
  console.log('Added Used badge to ProductCard');
} else {
  console.log('Could not find wishlist button or badge already exists');
}