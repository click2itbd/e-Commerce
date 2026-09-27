const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/ProductDetails.tsx', 'utf8');

if (!content.includes('const displayImages =')) {
    content = content.replace(
        'const { addToCart } = useCart();',
        'const { addToCart } = useCart();\n\n  const displayImages = product?.images?.length > 1 ? product.images : [product?.images?.[0], product?.images?.[0], product?.images?.[0], product?.images?.[0]].filter(Boolean);'
    );
}

// Ensure X is imported from lucide-react if not already
if (!content.includes('X } from \'lucide-react\'') && !content.includes('X } from "lucide-react"')) {
    content = content.replace('Star, ShieldCheck } from \'lucide-react\';', 'Star, ShieldCheck, X } from \'lucide-react\';');
}

fs.writeFileSync('src/pages/shop/ProductDetails.tsx', content, 'utf8');