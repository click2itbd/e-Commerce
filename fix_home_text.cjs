const fs = require('fs');
let content = fs.readFileSync('src/pages/shop/Home.tsx', 'utf8');

let newContent = content.replace(/<h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight drop-shadow-lg">[\s\S]*?<\/p>/, 
`<h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                আপনার স্বপ্নের পিসি বিল্ড করুন <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                  খুব সহজেই
                </span>{" "}
                আমাদের সাথে!
              </h2>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 opacity-90 drop-shadow-md">
                স্মার্ট পিসি বিল্ডার দিয়ে মাত্র কয়েক মিনিটেই চেক করে নিন আপনার পছন্দের পিসির বাজেট এবং পার্টসগুলোর সামঞ্জস্যতা!
              </p>`);

newContent = newContent.replace(/^\uFFFD/, '');
fs.writeFileSync('src/pages/shop/Home.tsx', newContent, 'utf8');
console.log('Fixed Home.tsx text');

const files = [
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
        let c = fs.readFileSync(file, 'utf8');
        if (c.charCodeAt(0) === 0xFFFD || c.charCodeAt(0) === 0xFEFF) {
            c = c.substring(1);
            fs.writeFileSync(file, c, 'utf8');
            console.log('Cleaned first char in', file);
        }
    } catch(e) {}
});