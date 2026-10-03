const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// 1. Add customers state
if (!code.includes('const [customers, setCustomers] = useState<any[]>([])')) {
  code = code.replace(
    'const [vendors, setVendors] = useState<any[]>([]);',
    'const [vendors, setVendors] = useState<any[]>([]);\n  const [customers, setCustomers] = useState<any[]>([]);'
  );
}

// 2. Fetch customers in fetchData
if (!code.includes('const custSnap = await getDocs')) {
  code = code.replace(
    "const vendorsSnap = await getDocs(query(collection(db, 'vendors')));",
    "const vendorsSnap = await getDocs(query(collection(db, 'vendors')));\n      setVendors(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));\n      const custSnap = await getDocs(query(collection(db, 'customers')));\n      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));"
  );
}

// 3. Update handleSaveService
if (!code.includes('Auto-save new customer')) {
  code = code.replace(
    "      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };",
    "      // Auto-save new customer\n      const existingCustomer = customers.find(c => c.name.toLowerCase() === serviceFormData.customerName.toLowerCase());\n      if (!existingCustomer && serviceFormData.customerName.trim() !== '') {\n         await addDoc(collection(db, 'customers'), {\n           name: serviceFormData.customerName,\n           phone: serviceFormData.customerPhone || '',\n           email: '',\n           address: '',\n           type: 'retail',\n           createdAt: new Date().toISOString()\n         });\n      }\n\n      const serviceData = {\n        ...serviceFormData,\n        receivedAt: new Date().toISOString(),\n      };"
  );
}

// 4. Update the input for customerName to include datalist
if (!code.includes('list="service-customers-list"')) {
  const oldInput = 'onChange={e => setServiceFormData({ ...serviceFormData, customerName: e.target.value })}';
  const newInput = 'list="service-customers-list"\n                      onChange={e => {\n                        const cName = e.target.value;\n                        const c = customers.find((x: any) => x.name === cName);\n                        setServiceFormData({ \n                          ...serviceFormData, \n                          customerName: cName,\n                          customerPhone: c ? c.phone : serviceFormData.customerPhone\n                        });\n                      }}';
  
  code = code.replace(oldInput, newInput);
  
  const endInput = 'className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"\n                    />\n                  </div>';
  const endInputReplacement = 'className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"\n                    />\n                    <datalist id="service-customers-list">\n                      {customers.map((c: any) => <option key={c.id} value={c.name} />)}\n                    </datalist>\n                  </div>';
  code = code.replace(endInput, endInputReplacement);
}

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Patched Services.tsx for customer autocomplete and auto-save (Round 2)');
