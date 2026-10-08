const fs = require('fs');
let c = fs.readFileSync('src/components/AnalyticsDashboard.tsx', 'utf8');

c = c.replace(/:\s*\(productCostMap\.get\(item\.id\)\s*\|\|\s*Number\(\(item\s*as\s*any\)\.purchasePrice\)\s*\|\|\s*\(rawItemTotal\s*\*\s*0\.82\)\);/, ": (productCostMap.get(item.id) || Number((item as any).purchasePrice) || ((Number(item.price) || 0) * 0.82));");

fs.writeFileSync('src/components/AnalyticsDashboard.tsx', c);
console.log('Fixed unit cost fallback');