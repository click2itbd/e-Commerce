const fs = require('fs');
const files = [
    'src/pages/shop/Home.tsx',
    'src/components/home/HomeSections.tsx',
    'src/components/ProductCard.tsx',
    'src/pages/shop/CategoryPage.tsx',
    'src/pages/shop/SearchPage.tsx',
    'src/pages/shop/Brands.tsx',
    'src/components/Layout.tsx',
    'src/components/navbars/EcommerceNavbar.tsx',
    'src/components/navbars/HostingNavbar.tsx',
    'src/components/navbars/PCBuildNavbar.tsx',
    'src/components/Footer.tsx',
    'src/components/Header.tsx'
];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) return;
        const content = fs.readFileSync(file, 'utf8');
        
        // Let's just decode it.
        const buffer = Buffer.from(content, 'latin1');
        const restored = buffer.toString('utf8');
        
        if (restored.includes('')) {
            console.log('Contains replacement char in', file);
            // Even if it does, it might be better than what we have now. Let's see if we see Bengali characters!
            // Let's print a substring that contains Bengali
            const idx = restored.indexOf('PC');
            console.log(restored.substring(Math.max(0, idx - 20), idx + 20));
        } else {
            console.log('Clean in', file);
        }
        
        // Write the restored version
        fs.writeFileSync(file, restored, 'utf8');
    } catch(e) { console.log(e.message); }
});
