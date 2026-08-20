const fs = require('fs');

let content = fs.readFileSync('src/components/MyDomainsTab.tsx', 'utf8');

if (!content.includes('useCart')) {
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useCart } from '../context/CartContext';\nimport { useNavigate } from 'react-router-dom';");
    content = content.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);\n  const { addToCart } = useCart();\n  const navigate = useNavigate();");
}

const renewFn = `
  const handleRenewDomain = (domainOrder: any) => {
    addToCart({
      id: \`renew_\${domainOrder.domain}\`,
      name: \`Domain Renewal - \${domainOrder.domain}\`,
      description: '1 Year Renewal',
      price: domainOrder.price || 1200,
      category: 'Hosting & Domains',
      stock: 999,
      images: [],
      createdAt: new Date().toISOString(),
      itemType: 'domain_renewal',
      domain: domainOrder.domain,
      termYears: 1
    } as any);
    toast.success('Renewal added to cart');
    navigate('/hosting-checkout');
  };
`;

if (!content.includes('handleRenewDomain')) {
    content = content.replace("const fetchDomains = async () => {", renewFn + "\n  const fetchDomains = async () => {");
}

const renewBtn = `
                <button 
                  onClick={() => handleRenewDomain(domainOrder)}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2"
                >
                  <CalendarClock size={16} /> Renew
                </button>
`;

if (!content.includes('Renew</button>')) {
    content = content.replace("<button \n                  onClick={() => setManagingDns(domainOrder)}", renewBtn + "\n                <button \n                  onClick={() => setManagingDns(domainOrder)}");
}

fs.writeFileSync('src/components/MyDomainsTab.tsx', content, 'utf8');
console.log('Patched MyDomainsTab');
