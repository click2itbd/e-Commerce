const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf-8');

// 1. Imports
content = content.replace(
    "import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';",
    "import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"
);
content = content.replace(
    "import { db } from '../../../../firebase';",
    "import { db, storage } from '../../../../firebase';"
);

// 2. Interfaces
content = content.replace(
    "  warrantyYears?: number;\n  hasSerialTracking?: boolean;\n  newSerials?: string | string[];\n  sku?: string;",
    "  warrantyYears?: number;\n  warrantyMonths?: number;\n  hasSerialTracking?: boolean;\n  newSerials?: string | string[];\n  sku?: string;\n  tax?: number;\n  discount?: number;"
);

content = content.replace(
    "  date: string;\n  items: PurchaseItem[];\n  subtotal: number;\n  total: number;",
    "  date: string;\n  status: 'Pending' | 'Received' | 'Partially Received' | 'Cancelled';\n  invoiceUrl?: string;\n  items: PurchaseItem[];\n  subtotal: number;\n  taxTotal: number;\n  discountTotal: number;\n  total: number;"
);

// 3. purchaseForm state
content = content.replace(
    "    reference: '',\n    items: [] as PurchaseItem[],\n    paymentAccountId: '',",
    "    reference: '',\n    status: 'Received' as 'Pending' | 'Received' | 'Partially Received' | 'Cancelled',\n    invoiceFile: null as File | null,\n    items: [] as PurchaseItem[],\n    paymentAccountId: '',"
);

// 4. addItemToPurchase
content = content.replace(
    "            hasWarranty: Boolean(product.warrantyMonths && product.warrantyMonths > 0),\n            warrantyYears: product.warrantyMonths ? Math.round(product.warrantyMonths / 12) : 1,",
    "            hasWarranty: Boolean(product.warrantyMonths && product.warrantyMonths > 0),\n            warrantyYears: product.warrantyMonths ? Math.round(product.warrantyMonths / 12) : 1,\n            warrantyMonths: product.warrantyMonths || 0,\n            tax: 0,\n            discount: 0,"
);

// 5. Calculations
content = content.replace(
    "  const billTotal = purchaseForm.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);\n\n  // Bill total computed",
    "  const subtotal = purchaseForm.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);\n  const totalTax = purchaseForm.items.reduce((sum, item) => sum + ((item.purchasePrice * item.quantity) * (item.tax || 0) / 100), 0);\n  const totalDiscount = purchaseForm.items.reduce((sum, item) => sum + (item.discount || 0), 0);\n  const billTotal = subtotal + totalTax - totalDiscount;\n\n  // Bill total computed"
);


// 6. Form Fields
const formOld = `                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Supplier Challan / Bill #</label>
                    <input
                      type="text"
                      placeholder="e.g. CH-9941"
                      value={purchaseForm.reference}
                      onChange={e => setPurchaseForm({ ...purchaseForm, reference: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                    />
                  </div>
                </div>`;

const formNew = `                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Supplier Challan / Bill #</label>
                    <input
                      type="text"
                      placeholder="e.g. CH-9941"
                      value={purchaseForm.reference}
                      onChange={e => setPurchaseForm({ ...purchaseForm, reference: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Purchase Status</label>
                    <select
                      value={purchaseForm.status}
                      onChange={e => setPurchaseForm({ ...purchaseForm, status: e.target.value as any })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Received">Received</option>
                      <option value="Partially Received">Partially Received</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Attach Invoice</label>
                    <input
                      type="file"
                      onChange={e => setPurchaseForm({ ...purchaseForm, invoiceFile: e.target.files?.[0] || null })}
                      className="w-full border border-gray-200 rounded-lg p-1.5 font-medium"
                    />
                  </div>
                </div>`;

content = content.replace(formOld, formNew);

// 7. Items List UI
const itemOld = `                            {/* Purchase Cost Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Cost Price (৳)</label>
                              <input
                                type="number"
                                min={1}
                                value={item.purchasePrice}
                                onChange={e => updateItem(item.id, 'purchasePrice', Number(e.target.value))}
                                className="w-20 text-right border border-gray-200 rounded p-1 font-black text-gray-900"
                              />
                            </div>

                            {/* Sales Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-blue-500 uppercase">Sales Price (৳)</label>
                              <input
                                type="number"
                                min={1}
                                value={item.salesPrice || 0}
                                onChange={e => updateItem(item.id, 'salesPrice', Number(e.target.value))}
                                className="w-20 text-right border border-blue-200 bg-blue-50/50 rounded p-1 font-black text-blue-900 focus:ring-blue-500"
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Qty</label>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-16 text-center border border-gray-200 rounded p-1 font-bold"
                              />
                            </div>`;

const itemNew = `                            {/* Purchase Cost Price */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Cost (৳)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.purchasePrice}
                                onChange={e => updateItem(item.id, 'purchasePrice', Number(e.target.value))}
                                className="w-16 text-right border border-gray-200 rounded p-1 font-black text-gray-900"
                              />
                            </div>

                            {/* Tax */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Tax (%)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.tax || 0}
                                onChange={e => updateItem(item.id, 'tax', Number(e.target.value))}
                                className="w-12 text-right border border-gray-200 rounded p-1 font-bold text-gray-900"
                              />
                            </div>

                            {/* Discount */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Disc (৳)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.discount || 0}
                                onChange={e => updateItem(item.id, 'discount', Number(e.target.value))}
                                className="w-16 text-right border border-gray-200 rounded p-1 font-bold text-gray-900"
                              />
                            </div>

                            {/* Warranty */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Wty (Mos)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.warrantyMonths || 0}
                                onChange={e => updateItem(item.id, 'warrantyMonths', Number(e.target.value))}
                                className="w-12 text-right border border-gray-200 rounded p-1 font-bold text-gray-900"
                              />
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Qty</label>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-12 text-center border border-gray-200 rounded p-1 font-bold"
                              />
                            </div>`;
content = content.replace(itemOld, itemNew);

const totalUiOld = `                            {/* Total for item */}
                            <div className="text-right min-w-20">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Total</label>
                              <span className="font-black text-gray-900 text-sm block">
                                {formatCurrency(item.purchasePrice * item.quantity, settings)}
                              </span>
                            </div>`;
const totalUiNew = `                            {/* Total for item */}
                            <div className="text-right min-w-20">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase">Total</label>
                              <span className="font-black text-gray-900 text-sm block">
                                {formatCurrency((item.purchasePrice * item.quantity) + ((item.purchasePrice * item.quantity) * (item.tax || 0) / 100) - (item.discount || 0), settings)}
                              </span>
                            </div>`;
content = content.replace(totalUiOld, totalUiNew);

// 8. Summary block before payment section
const summOld = `                {/* Bill Total & Submit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-gray-700 uppercase">Total Purchase Bill</span>
                  <span className="text-xl font-black text-[#EF4444]">{formatCurrency(billTotal, settings)}</span>
                </div>`;
const summNew = `                {/* Bill Total & Submit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, settings)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Total Tax</span>
                    <span>{formatCurrency(totalTax, settings)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Total Discount</span>
                    <span className="text-red-500">-{formatCurrency(totalDiscount, settings)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-700 uppercase">Grand Total</span>
                    <span className="text-xl font-black text-[#EF4444]">{formatCurrency(billTotal, settings)}</span>
                  </div>
                </div>`;
content = content.replace(summOld, summNew);

// 9. Table history headers
const thOld = `                <th className="px-6 py-3.5 text-center">Items Qty</th>
                <th className="px-6 py-3.5 text-right">Total Bill</th>
                <th className="px-6 py-3.5 text-right">Paid Amount</th>
                <th className="px-6 py-3.5 text-right">Due Balance</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>`;
const thNew = `                <th className="px-6 py-3.5 text-center">Items Qty</th>
                <th className="px-6 py-3.5 text-right">Total Bill</th>
                <th className="px-6 py-3.5 text-right">Paid Amount</th>
                <th className="px-6 py-3.5 text-right">Due Balance</th>
                <th className="px-6 py-3.5 text-center">Purchase Status</th>
                <th className="px-6 py-3.5 text-center">Payment Status</th>
                <th className="px-6 py-3.5 text-center">Invoice</th>
                <th className="px-6 py-3.5 text-center">Actions</th>`;
content = content.replace(thOld, thNew);

// 10. Table history rows
const trOld = `                      <td className="px-6 py-3.5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          pur.paymentStatus === 'paid' ? "bg-green-100 text-green-700" :
                          pur.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Purchase Bill"
                        >
                          <Eye size={14} />
                        </button>
                      </td>`;
const trNew = `                      <td className="px-6 py-3.5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          pur.status === 'Received' ? "bg-green-100 text-green-700" :
                          pur.status === 'Partially Received' ? "bg-amber-100 text-amber-700" :
                          pur.status === 'Cancelled' ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {pur.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          pur.paymentStatus === 'paid' ? "bg-green-100 text-green-700" :
                          pur.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {pur.invoiceUrl ? (
                          <a href={pur.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">View</a>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Purchase Bill"
                        >
                          <Eye size={14} />
                        </button>
                      </td>`;
content = content.replace(trOld, trNew);


const resetOld = `      setPurchaseForm({
        vendorId: '',
        vendorName: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        items: [],
        paymentAccountId: paymentAccounts[0]?.id || '',
        paymentMethod: paymentAccounts[0]?.type || 'cash',
        paidAmount: 0,
        notes: '',
      });`;
const resetNew = `      setPurchaseForm({
        vendorId: '',
        vendorName: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        status: 'Received',
        invoiceFile: null,
        items: [],
        paymentAccountId: paymentAccounts[0]?.id || '',
        paymentMethod: paymentAccounts[0]?.type || 'cash',
        paidAmount: 0,
        notes: '',
      });`;
content = content.replace(resetOld, resetNew);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', content, 'utf-8');
