const fs = require('fs');

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(
  /'product' \| 'domain' \| 'hosting' \| 'domain_transfer' \| 'domain_renewal'/g,
  "'product' | 'domain' | 'hosting' | 'domain_transfer' | 'domain_renewal' | 'ssl'"
);
fs.writeFileSync('src/types.ts', types);

let sslPage = fs.readFileSync('src/pages/hosting/SslPage.tsx', 'utf8');
if (!sslPage.includes('Search,')) {
  sslPage = sslPage.replace('ShoppingCart', 'Search, ShoppingCart');
  fs.writeFileSync('src/pages/hosting/SslPage.tsx', sslPage);
}
