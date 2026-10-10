const fs = require('fs');

let code = fs.readFileSync('src/pages/hosting/BulkDomainSearch.tsx', 'utf8');

// Replace res.status === 'available' with res.available
code = code.replace(/res\.status === 'available'/g, 'res.available === true');
// Replace res.status === 'error' with res.error
code = code.replace(/res\.status === 'error'/g, 'res.error');
// In the array `available.forEach(domainObj => ...`
code = code.replace(/r\.status === 'available'/g, 'r.available === true');

// Replace domainObj.price.registration with domainObj.price (or domainObj.priceBdt)
// The backend returns price: 1480.
code = code.replace(/domainObj\.price\.registration/g, 'domainObj.price');

// For the display string: "Available" : res.status === 'premium' ? "Premium" : ...
code = code.replace(
  /res\.status === 'premium' \? 'Premium \(Not Supported\)' : res\.status === 'error' \? 'Error' : 'Taken'/,
  "res.error ? 'Error' : 'Taken'"
);
// And the status check:
code = code.replace(
  /res\.status === 'premium' && \(/g,
  "false && (" // premium check not needed if not provided by openprovider yet
);

// We should also replace the res.price check:
code = code.replace(
  /res\.price\.registration/g,
  "res.price"
);

fs.writeFileSync('src/pages/hosting/BulkDomainSearch.tsx', code);
