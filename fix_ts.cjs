const fs = require('fs');

// Fix Profile.tsx
let profile = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
profile = profile.replace(/const data = snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);/g, "const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));");
fs.writeFileSync('src/pages/Profile.tsx', profile);

// Fix CategoryPage.tsx
let cat = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');
cat = cat.replace(/const specs = \{\};/g, "const specs: Record<string, string[]> = {};");
cat = cat.replace(/const itemVariants = \{/g, "const itemVariants: any = {");
cat = cat.replace(/const containerVariants = \{/g, "const containerVariants: any = {");
fs.writeFileSync('src/pages/shop/CategoryPage.tsx', cat);

console.log('Fixed #3');