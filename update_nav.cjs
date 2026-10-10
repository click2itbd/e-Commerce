const fs = require('fs');
let code = fs.readFileSync('src/components/navbars/HostingNavbar.tsx', 'utf8');

if (!code.includes('Bulk Domain Search')) {
  code = code.replace(
    "{ name: \"Domain Renewal\", path: \"/domain-renewal\", icon: Globe },",
    "{ name: \"Domain Renewal\", path: \"/domain-renewal\", icon: Globe },\n          { name: \"Bulk Domain Search\", path: \"/domain/bulk\", icon: Globe },\n          { name: \"SSL Certificates\", path: \"/ssl\", icon: Shield },"
  );
  fs.writeFileSync('src/components/navbars/HostingNavbar.tsx', code);
}