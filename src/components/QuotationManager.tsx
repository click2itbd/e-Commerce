import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, Product, Customer, CartItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, X, Trash2, FileText, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateDocumentNumber } from '../lib/numbering';

export const QuotationManager: React.FC = () => {
  const [quotations, setQuotations] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as CartItem[],
    discountAmount: 0,
  });
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(query(collection(db, 'orders'), where('type', '==', 'quotation'), orderBy('createdAt', 'desc'), limit(200)));
      const pSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
      const cSnap = await getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(200)));

      setQuotations(qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (!formData.customerName) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const docNumber = await generateDocumentNumber('QUO');
      
      const newQuotation: Omit<Order, 'id'> = {
        userId: 'admin',
        type: 'quotation',
        status: 'pending',
        documentNumber: docNumber,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        shippingAddress: formData.shippingAddress,
        items: formData.items,
        total: Math.max(0, subtotal - formData.discountAmount),
        discountAmount: formData.discountAmount,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), newQuotation);
      setQuotations([{ id: docRef.id, ...newQuotation } as Order, ...quotations]);
      toast.success('Quotation created successfully!');
      setIsCreating(false);
      setFormData({
        customerName: '', customerPhone: '', customerEmail: '', shippingAddress: '', items: [], discountAmount: 0
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create quotation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      setQuotations(quotations.filter(q => q.id !== id));
      toast.success('Quotation deleted');
    } catch (err) {
      toast.error('Failed to delete quotation');
    }
  };

  const addItem = (product: Product) => {
    if (formData.items.find(i => i.id === product.id)) {
      toast.error('Item already added');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...product, quantity: 1 }]
    });
    setProductSearch('');
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 1) return;
    const newItems = [...formData.items];
    newItems[idx].quantity = qty;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const filteredQuotations = quotations.filter(q => 
    q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <FileText className="text-indigo-600" /> Quotations Management
        </h2>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold shadow hover:bg-indigo-700 transition"
          >
            <Plus size={16} /> New Quotation
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Create Quotation</h3>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500 transition">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleCreateQuotation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                <input 
                  required 
                  list="customer-list"
                  className="w-full border p-2 rounded" 
                  value={formData.customerName}
                  onChange={e => {
                    const cName = e.target.value;
                    const c = customers.find(x => x.name === cName);
                    setFormData({
                      ...formData, 
                      customerName: cName,
                      customerPhone: c ? c.phone : formData.customerPhone,
                      customerEmail: c ? c.email : formData.customerEmail,
                      shippingAddress: c ? c.address : formData.shippingAddress
                    });
                  }}
                  placeholder="Select or enter customer"
                />
                <datalist id="customer-list">
                  {customers.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-sm mb-4">Line Items</h4>
              <div className="mb-4 relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    className="w-full border p-2 pl-9 rounded" 
                    placeholder="Search product to add..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                {productSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto rounded-md">
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between"
                        onClick={() => addItem(p)}
                      >
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-sm font-mono text-indigo-600">{formatCurrency(p.price, {})}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 w-24">Price</th>
                        <th className="p-2 w-24">Qty</th>
                        <th className="p-2 w-24">Total</th>
                        <th className="p-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-sm font-medium">{item.name}</td>
                          <td className="p-2 text-sm font-mono">{formatCurrency(item.price, {})}</td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="1" 
                              className="w-full border p-1 rounded"
                              value={item.quantity}
                              onChange={e => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="p-2 text-sm font-mono font-bold text-gray-700">
                            {formatCurrency(item.price * item.quantity, {})}
                          </td>
                          <td className="p-2">
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-400 italic">No items added yet.</div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-4">
               <div className="text-right space-y-2">
                   <div className="flex justify-end items-center gap-4 text-sm">
                       <span className="text-gray-500">Subtotal:</span>
                       <span className="font-mono font-bold">{formatCurrency(formData.items.reduce((s, i) => s + (i.price * i.quantity), 0), {})}</span>
                   </div>
                   <div className="flex justify-end items-center gap-4 text-sm">
                       <span className="text-gray-500">Discount:</span>
                       <input 
                           type="number" 
                           className="border rounded p-1 w-24 text-right" 
                           value={formData.discountAmount}
                           onChange={e => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                           min="0"
                       />
                   </div>
                   <div className="flex justify-end items-center gap-4 text-lg border-t pt-2">
                       <span className="font-bold">Total:</span>
                       <span className="font-mono font-black text-indigo-600">
                           {formatCurrency(Math.max(0, formData.items.reduce((s, i) => s + (i.price * i.quantity), 0) - formData.discountAmount), {})}
                       </span>
                   </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-bold text-sm shadow hover:bg-indigo-700 transition"
              >
                Save Quotation
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                placeholder="Search quotations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border rounded-md py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium">
               {quotations.length} Quotations
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Quote No.</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white text-sm">
                {loading ? (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">Loading quotations...</td>
                    </tr>
                ) : filteredQuotations.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 italic">No quotations found.</td>
                    </tr>
                ) : (
                    filteredQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">
                          {q.documentNumber || q.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{new Date(q.createdAt).toLocaleDateString()}</div>
                          <div className="text-gray-400 text-xs">{new Date(q.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{q.customerName}</div>
                          <div className="text-xs text-gray-500">{q.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">
                           {q.items.length} items
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded-full tracking-wider">
                             {q.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          {formatCurrency(q.total, {})}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                             <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
