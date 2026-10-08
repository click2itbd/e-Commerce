const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const oldEnd = `  // A_AA A_AAA_AA A_AA Hosting routes (default) A_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AAA_AA A_AA
  return <HostingNavbar />;
}
`;

// Wait, I can't rely on matching exact emoji strings from powershell output.
// I will use regex.
const regex = /return <HostingNavbar \/>;\s*\}/;

const replacement = `if (pathname.startsWith('/hosting') || pathname.startsWith('/domain') || pathname.startsWith('/web') || (isHostingDomain && pathname === '/')) {
    return <HostingNavbar />;
  }

  // Generic routes (/contact, /about, /terms, etc)
  if (siteContext === 'pc-build') return <PCBuildNavbar />;
  if (siteContext === 'ecommerce') return <EcommerceNavbar />;
  
  return <HostingNavbar />;
}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/components/Layout.tsx', c.replace(/\n/g, nl));
console.log('Layout.tsx updated to make generic routes dynamic');