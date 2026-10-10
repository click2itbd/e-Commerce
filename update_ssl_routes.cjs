const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('SslPage')) {
  code = code.replace(
    "const BulkDomainSearch = lazy(() => import('./pages/hosting/BulkDomainSearch'));",
    "const BulkDomainSearch = lazy(() => import('./pages/hosting/BulkDomainSearch'));\nconst SslPage = lazy(() => import('./pages/hosting/SslPage'));"
  );
  
  code = code.replace(
    "<Route path=\"/domain/bulk\" element={<LazyWrapper><BulkDomainSearch /></LazyWrapper>} />",
    "<Route path=\"/domain/bulk\" element={<LazyWrapper><BulkDomainSearch /></LazyWrapper>} />\n                      <Route path=\"/ssl\" element={<LazyWrapper><SslPage /></LazyWrapper>} />"
  );
  
  fs.writeFileSync('src/App.tsx', code);
}

// Add to Menus.ts
let menus = fs.readFileSync('src/components/Menus.ts', 'utf8');
if (!menus.includes('/ssl')) {
  menus = menus.replace(
    "{ title: 'Transfer Domain', path: '/domain/transfer' }",
    "{ title: 'Transfer Domain', path: '/domain/transfer' },\n      { title: 'SSL Certificates', path: '/ssl' }"
  );
  fs.writeFileSync('src/components/Menus.ts', menus);
}
