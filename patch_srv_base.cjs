const fs = require('fs');
let srv = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

srv = srv.replace(
  "const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);",
  "const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);\n  const [customers, setCustomers] = useState<any[]>([]);\n  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);"
);

srv = srv.replace(
  "setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));",
  "setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));\n        const custSnap = await getDocs(query(collection(db, 'customers')));\n        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));"
);

srv = srv.replace(
  "      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };",
  "      const existingCustomer = customers.find(c => c.name.toLowerCase() === serviceFormData.customerName.toLowerCase());\n      if (!existingCustomer && serviceFormData.customerName.trim() !== '') {\n         await addDoc(collection(db, 'customers'), {\n           name: serviceFormData.customerName,\n           phone: serviceFormData.customerPhone || '',\n           email: '',\n           address: '',\n           type: 'retail',\n           createdAt: new Date().toISOString()\n         });\n      }\n      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };"
);
fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', srv);
