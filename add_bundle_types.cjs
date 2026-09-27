const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');

if (!types.includes('fbtProducts')) {
    types = types.replace(
        '  isOutOfStock?: boolean;',
        '  isOutOfStock?: boolean;\n  isBundle?: boolean;\n  bundleItems?: { productId: string; quantity: number }[];\n  fbtProducts?: string[];\n  fbtDiscount?: number;'
    );
    fs.writeFileSync('src/types.ts', types, 'utf8');
    console.log('Added bundle & FBT types');
}