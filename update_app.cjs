const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

if (!c.includes('UsedItems')) {
  c = c.replace("const Brands = lazy(() => import('./pages/shop/Brands'));", "const Brands = lazy(() => import('./pages/shop/Brands'));\nconst UsedItems = lazy(() => import('./pages/shop/UsedItems'));");
  c = c.replace('<Route path="/brands" element={<LazyWrapper><Brands /></LazyWrapper>} />', '<Route path="/brands" element={<LazyWrapper><Brands /></LazyWrapper>} />\n                        <Route path="/used-items" element={<LazyWrapper><UsedItems /></LazyWrapper>} />');
  fs.writeFileSync('src/App.tsx', c.replace(/\n/g, nl));
  console.log('App.tsx updated');
} else {
  console.log('Already in App.tsx');
}