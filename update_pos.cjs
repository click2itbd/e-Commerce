const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/POS/index.tsx', 'utf8');

const target = `const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());`;
const replacement = `const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()) || (p.model && p.model.toLowerCase().includes(searchQuery.toLowerCase()));`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/admin/POS/index.tsx', content, 'utf8');
console.log("Updated POS search with model");
