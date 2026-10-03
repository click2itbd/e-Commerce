const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// 1. Add date to saleData
code = code.replace(/shippingAddress: '',\n    createdBy: '',/, "shippingAddress: '',\n    createdBy: '',\n    date: new Date().toISOString().split('T')[0],");
code = code.replace(/shippingAddress: '',\n          items: \[\],/g, "shippingAddress: '',\n          items: [],\n          date: new Date().toISOString().split('T')[0],");

// 2. Add Auto Draft logic
const draftLogic = `  const [saleData, setSaleData] = useState({`;
const draftLogicReplacement = `  const [saleData, setSaleData] = useState(() => {
    const saved = localStorage.getItem('sales_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) {}
    }
    return {
      customerId: '',
      customerName: '',
      workOrderNumber: '',
      customerPhone: '',
      customerEmail: '',
      shippingAddress: '',
      createdBy: '',
      date: new Date().toISOString().split('T')[0],
      items: [] as any[],
      type: 'invoice' as 'invoice' | 'challan' | 'quotation',
      paymentMethod: '',
      paymentAccountId: '',
      saleSource: 'in_store' as 'in_store' | 'online',
      paidAmount: 0,
      discountAmount: 0,
      appliedDiscountPercentage: 0,
      appliedDiscountCode: '',
      notes: '',
    };
  });

  useEffect(() => {
    localStorage.setItem('sales_form_draft', JSON.stringify(saleData));
  }, [saleData]);`;

code = code.replace(/const \[saleData, setSaleData\] = useState\(\{[\s\S]*?\}\);/, draftLogicReplacement);

// 3. Clear draft on save
code = code.replace(/setSaleDiscountCodeInput\(''\);/, "setSaleDiscountCodeInput('');\n        localStorage.removeItem('sales_form_draft');");

// 4. Update createdAt logic
code = code.replace(/const createdAt = new Date\(\)\.toISOString\(\);/, "const createdAt = new Date(saleData.date || new Date()).toISOString();");

// 5. Add Date field to UI (next to Document Type and Prepared By)
const targetUI = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>`;

const uiReplacement = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={saleData.date || ''}
                  onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                  className="w-full border-gray-200 rounded text-xs focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>`;
code = code.replace(targetUI, uiReplacement);

// 6. Add Previous Due to Customer block
const customerTarget = `<label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer <span className="text-red-500">*</span> (Must Select)
                </label>`;

const customerReplacement = `<label className="block font-bold text-gray-700 uppercase mb-1 flex justify-between">
                  <span>Customer <span className="text-red-500">*</span> (Must Select)</span>
                  {saleData.customerId && (
                    <span className="text-red-600 font-black text-[10px]">
                      Previous Due: {formatCurrency(customers.find(c => c.id === saleData.customerId)?.due || 0, settings)}
                    </span>
                  )}
                </label>`;
code = code.replace(customerTarget, customerReplacement);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Updated SalesForm logic");
