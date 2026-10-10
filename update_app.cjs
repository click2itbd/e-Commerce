const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('BulkDomainSearch')) {
  code = code.replace(
    "const DomainSearchResults = lazy(() => import('./pages/hosting/DomainSearchResults'));",
    "const DomainSearchResults = lazy(() => import('./pages/hosting/DomainSearchResults'));\nconst BulkDomainSearch = lazy(() => import('./pages/hosting/BulkDomainSearch'));"
  );
  
  code = code.replace(
    "<Route path=\"/domain/search\" element={<LazyWrapper><DomainSearchResults /></LazyWrapper>} />",
    "<Route path=\"/domain/search\" element={<LazyWrapper><DomainSearchResults /></LazyWrapper>} />\n                      <Route path=\"/domain/bulk\" element={<LazyWrapper><BulkDomainSearch /></LazyWrapper>} />"
  );
  
  fs.writeFileSync('src/App.tsx', code);
}