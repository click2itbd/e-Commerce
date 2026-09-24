const fs = require('fs');
const glob = require('glob'); // Not available? Let's just pass specific files
const files = [
    'src/pages/shop/Home.tsx',
    'src/components/home/HomeSections.tsx',
    'src/components/ProductCard.tsx',
    'src/pages/shop/CategoryPage.tsx',
    'src/pages/shop/SearchPage.tsx',
    'src/pages/shop/Brands.tsx'
];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // The file is currently saved as UTF-8, but its content is double-encoded or corrupted ANSI.
        // Wait, if PowerShell's Set-Content saved ANSI as UTF-8, it means what we read now is UTF-8 containing ANSI characters.
        // We can encode it to 'binary' (latin1) to get the original bytes, then decode as utf8!
        const buffer = Buffer.from(content, 'latin1');
        const restored = buffer.toString('utf8');
        
        // If the restored text contains replacement characters or looks bad, this might fail, but let's check one first!
        console.log('Testing', file.substring(0, 20), '...');
        if (restored.includes('')) {
            console.log('Failed to restore perfectly, contains replacement char');
        } else {
            console.log('Restored cleanly!');
            fs.writeFileSync(file, restored, 'utf8');
        }
    } catch(e) { console.log(e.message); }
});
