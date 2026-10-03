const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// 1. Add customers state
const statePattern = `const [vendors, setVendors] = useState<any[]>([]);`;
if (!code.includes('const [customers, setCustomers] = useState<any[]>([])')) {
  code = code.replace(statePattern, statePattern + "\n  const [customers, setCustomers] = useState<any[]>([]);");
}

// 2. Fetch customers in fetchData
const oldFetch = `      const vendorsSnap = await getDocs(query(collection(db, 'vendors')));
      setVendors(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {`;

const newFetch = `      const vendorsSnap = await getDocs(query(collection(db, 'vendors')));
      setVendors(vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const custSnap = await getDocs(query(collection(db, 'customers')));
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {`;

if (!code.includes('const custSnap = await getDocs')) {
  code = code.replace(oldFetch, newFetch);
}

// 3. Update handleSaveService
const oldSaveService = `    try {
      const serviceData = {
        ...serviceFormData,
        receivedAt: new Date().toISOString(),
      };`;

const newSaveService = `    try {
      // Auto-save new customer
      const existingCustomer = customers.find(c => c.name.toLowerCase() === serviceFormData.customerName.toLowerCase());
      if (!existingCustomer && serviceFormData.customerName.trim() !== '') {
         await addDoc(collection(db, 'customers'), {
           name: serviceFormData.customerName,
           phone: serviceFormData.customerPhone || '',
           email: '',
           address: '',
           type: 'retail',
           createdAt: new Date().toISOString()
         });
      }

      const serviceData = {
        ...serviceFormData,
        receivedAt: new Date().toISOString(),
      };`;

if (!code.includes('Auto-save new customer')) {
  code = code.replace(oldSaveService, newSaveService);
}

// 4. Update the input for customerName to include datalist
const oldInput = `                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={serviceFormData.customerName}
                      onChange={e => setServiceFormData({ ...serviceFormData, customerName: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>`;

const newInput = `                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      list="service-customers-list"
                      value={serviceFormData.customerName}
                      onChange={e => {
                        const cName = e.target.value;
                        const c = customers.find(x => x.name === cName);
                        setServiceFormData({ 
                          ...serviceFormData, 
                          customerName: cName,
                          customerPhone: c ? c.phone : serviceFormData.customerPhone
                        });
                      }}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                    <datalist id="service-customers-list">
                      {customers.map((c: any) => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>`;

if (!code.includes('list="service-customers-list"')) {
  code = code.replace(oldInput, newInput);
}

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Patched Services.tsx for customer autocomplete and auto-save');
