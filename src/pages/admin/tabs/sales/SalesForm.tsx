import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Product, Customer, DiscountCode, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Trash2,
  ShoppingBag,
  Cpu,
  X,
  Search,
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';

interface SalesFormProps {
  products: Product[];
  customers: Customer[];
  discountCodes: DiscountCode[];
  settings: SiteSettings;
  formatCurrency: (amount: number, settings?: SiteSettings) => string;
  cn: (...inputs: any[]) => string;
  toast: any;
  fetchData: () => Promise<void>;
  checkLowStock: (productName: string, newStock: number) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setIsAddingCustomer: (val: boolean) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  products,
  customers,
  discountCodes,
  settings,
  formatCurrency,
  cn,
  toast,
  fetchData,
  checkLowStock,
  setActiveTab,
  setIsAddingCustomer,
}) => {
  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as any[],
    type: 'invoice' as any,
    discountAmount: 0,
    appliedDiscountPercentage: 0,
    appliedDiscountCode: '',
  });
  const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState('');
  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);

  const handleApplySaleDiscountCode = () => {
    if (!saleDiscountCodeInput) return;
    const foundCode = discountCodes.find(c => c.code.toUpperCase() === saleDiscountCodeInput.toUpperCase() && c.isActive);
    if (foundCode) {
      if (new Date(foundCode.expiryDate) < new Date()) {
        toast.error("Discount code expired");
        return;
      }
      setSaleData({
        ...saleData,
        appliedDiscountPercentage: foundCode.discountPercentage,
        appliedDiscountCode: foundCode.code,
        discountAmount: 0
      });
      toast.success(`Discount code applied: ${foundCode.discountPercentage}% off`);
    } else {
      toast.error("Invalid discount code");
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      for (const item of saleData.items) {
        if (item.hasSerialTracking) {
          if (!item.selectedSerials || item.selectedSerials.length !== item.quantity) {
            toast.error(`Please select exactly ${item.quantity} serial(s) for ${item.name}`);
            return;
          }
        }
      }

      const docType = saleData.type === 'quotation' ? 'QUO' : (saleData.type === 'challan' ? 'CHA' : 'INV');
      const docNumber = await generateDocumentNumber(docType);

      const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const effectiveDiscount = saleData.appliedDiscountPercentage > 0 
        ? (subtotal * saleData.appliedDiscountPercentage) / 100 
        : (saleData.discountAmount || 0);
      const total = subtotal - effectiveDiscount;
      const processedItems = saleData.items.map(item => {
        const currentProduct = products.find(p => p.id === item.id);
        const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct?.warrantyMonths || 0);
        return { ...item, warrantyMonths: wMonths };
      });

      const orderData = {
        ...saleData,
        items: processedItems,
        discountAmount: effectiveDiscount,
        documentNumber: docNumber,
        total: Math.max(0, total),
        status: 'delivered',
        userId: 'admin',
        createdAt: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      if (saleData.type === 'invoice' || saleData.type === 'challan') {
        for (const item of saleData.items) {
          const productRef = doc(db, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            const updates: any = {};
            const newStock = Math.max(0, currentProduct.stock - item.quantity);
            updates.stock = newStock;
            
            if (currentProduct.hasSerialTracking && item.selectedSerials) {
              const remainingSerials = (currentProduct.availableSerials || []).filter(s => !item.selectedSerials.includes(s));
              updates.availableSerials = remainingSerials;
              
              const warrantyEndDate = new Date();
              const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct.warrantyMonths || 0);
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + wMonths);
              
              for (const serial of item.selectedSerials) {
                await addDoc(collection(db, 'sold_serials'), {
                  serial,
                  productId: currentProduct.id,
                  productName: currentProduct.name,
                  orderId: orderRef.id,
                  customerName: saleData.customerName,
                  customerPhone: saleData.customerPhone,
                  soldAt: new Date().toISOString(),
                  warrantyEndDate: warrantyEndDate.toISOString(),
                  status: 'active'
                });
              }
            }

            await updateDoc(productRef, updates);
            checkLowStock(currentProduct.name, newStock);
          }
        }
      }

      const customer = customers.find(c => c.name === saleData.customerName);
      await addDoc(collection(db, 'transactions'), {
        type: 'sale',
        amount: Math.max(0, total),
        date: new Date().toISOString(),
        description: `Sale to ${saleData.customerName}`,
        entityId: customer?.id || 'unknown',
        entityName: saleData.customerName,
        referenceId: orderRef.id,
        createdAt: new Date().toISOString(),
      });

      toast.success('Sale recorded successfully');
      setSaleData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        items: [],
        type: 'invoice',
        discountAmount: 0,
        appliedDiscountPercentage: 0,
        appliedDiscountCode: '',
      });
      setSaleDiscountCodeInput('');
      fetchData();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Failed to record sale');
    }
  };

  const addItemToSale = (product: Product) => {
    setSaleData(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1 }]
      };
    });
    toast.success(`Added ${product.name} to sale`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-[#EF4444]" /> Create New Sale
          </h2>
          <button
            onClick={() => setShowPCBuilderModal(true)}
            className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
          >
            <Cpu size={18} /> Use PC Builder
          </button>
        </div>
        <form onSubmit={handleCreateSale} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <select
                value={saleData.customerName}
                onChange={e => {
                  const selected = customers.find(c => c.name === e.target.value);
                  if (selected) {
                    setSaleData({
                      ...saleData,
                      customerName: selected.name,
                      customerPhone: selected.phone,
                      customerEmail: selected.email,
                      shippingAddress: selected.address
                    });
                  } else if (e.target.value === "") {
                    setSaleData({
                      ...saleData,
                      customerName: "",
                      customerPhone: "",
                      customerEmail: "",
                      shippingAddress: ""
                    });
                  }
                }}
                className="w-full border-gray-200 rounded-md"
              >
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(true)}
                className="bg-gray-100 p-2 rounded-md hover:bg-gray-200"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Code (e.g. SUMMER20)"
                    value={saleDiscountCodeInput}
                    onChange={e => setSaleDiscountCodeInput(e.target.value)}
                    className="flex-1 border-gray-200 rounded-md focus:ring-[#EF4444]"
                  />
                  <button
                    type="button"
                    onClick={handleApplySaleDiscountCode}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold hover:bg-gray-200"
                  >
                    Apply
                  </button>
                </div>
                {saleData.appliedDiscountCode && (
                  <div className="flex items-center justify-between mt-1 p-2 bg-green-50 rounded-md border border-green-100">
                    <span className="text-xs text-green-700 font-bold">Applied: {saleData.appliedDiscountCode} ({saleData.appliedDiscountPercentage}%)</span>
                    <button 
                      type="button" 
                      onClick={() => setSaleData({...saleData, appliedDiscountCode: '', appliedDiscountPercentage: 0})}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <hr className="flex-1 border-gray-200" />
                <span className="text-[10px] uppercase font-bold text-gray-400">OR</span>
                <hr className="flex-1 border-gray-200" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manual Discount (Amount)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  disabled={saleData.appliedDiscountPercentage > 0}
                  value={saleData.discountAmount}
                  onChange={e => setSaleData({ ...saleData, discountAmount: parseFloat(e.target.value) || 0 })}
                  className={`w-full border-gray-200 rounded-md ${saleData.appliedDiscountPercentage > 0 ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-[#EF4444]'}`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">Document Type</label>
              <select
                value={saleData.type}
                onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                className="w-full border-gray-200 rounded-md"
              >
                <option value="invoice">Direct Invoice</option>
                <option value="quotation">Quotation</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold mb-4">Selected Items</h3>
            {saleData.items.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No items added yet. Select from the right panel.</p>
            ) : (
              <div className="space-y-2">
                {saleData.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col bg-gray-50 p-3 rounded-md gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold">{formatCurrency(item.price, settings)} x {item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setSaleData(prev => ({
                            ...prev,
                            items: prev.items.filter(i => i.id !== item.id)
                          }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.hasWarranty || false}
                          onChange={(e) => setSaleData(prev => ({
                            ...prev,
                            items: prev.items.map(i => i.id === item.id ? { ...i, hasWarranty: e.target.checked } : i)
                          }))}
                          className="rounded border-gray-300"
                        />
                        Configure Warranty
                      </label>
                      {item.hasWarranty && (
                        <div className="flex items-center gap-2 ml-4">
                          <input
                            type="number"
                            min="1"
                            value={item.warrantyYears || ''}
                            onChange={(e) => setSaleData(prev => ({
                              ...prev,
                              items: prev.items.map(i => i.id === item.id ? { ...i, warrantyYears: Number(e.target.value) } : i)
                            }))}
                            className="w-16 text-xs border-gray-200 rounded-md py-1 px-2"
                            placeholder="Yrs"
                          />
                          <span className="text-xs text-gray-500">Years</span>
                        </div>
                      )}
                    </div>
                    
                    {item.hasSerialTracking && (
                      <div className="mt-2 border-t border-gray-200 pt-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Serials (Need {item.quantity})</label>
                        <div className="flex flex-wrap gap-1">
                          {(item.availableSerials || []).map((serial: string) => {
                            const isSelected = (item.selectedSerials || []).includes(serial);
                            return (
                              <button
                                type="button"
                                key={serial}
                                onClick={() => {
                                  setSaleData(prev => ({
                                    ...prev,
                                    items: prev.items.map(i => {
                                      if (i.id !== item.id) return i;
                                      let newSelected = [...(i.selectedSerials || [])];
                                      if (isSelected) {
                                        newSelected = newSelected.filter(s => s !== serial);
                                      } else if (newSelected.length < i.quantity) {
                                        newSelected.push(serial);
                                      } else {
                                        toast.error(`You only need ${i.quantity} serial(s) for this item.`);
                                      }
                                      return { ...i, selectedSerials: newSelected };
                                    })
                                  }));
                                }}
                                className={`px-2 py-1 text-xs rounded-md border transition-all ${
                                  isSelected ? 'bg-[#EF4444] text-white border-[#EF4444]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#EF4444]'
                                }`}
                              >
                                {serial}
                              </button>
                            );
                          })}
                        </div>
                        {(!item.selectedSerials || item.selectedSerials.length < item.quantity) && (
                          <p className="text-[10px] text-red-500 mt-1 italic">Please select {item.quantity - (item.selectedSerials?.length || 0)} more serial(s).</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                  <span className="font-bold">Total</span>
                  <div className="flex flex-col items-end gap-1">
                    {(() => {
                      const subt = saleData.items.reduce((s, item) => s + (item.price * item.quantity), 0);
                      const effDiscount = saleData.appliedDiscountPercentage > 0 
                        ? (subt * saleData.appliedDiscountPercentage) / 100 
                        : (saleData.discountAmount || 0);
                      
                      return (
                        <>
                          {effDiscount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(subt, settings)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-[#EF4444]">
                            {formatCurrency(subt - effDiscount, settings)}
                          </span>
                          {effDiscount > 0 && (
                            <span className="text-xs text-green-600 font-bold">
                              Saved {formatCurrency(effDiscount, settings)}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#081621] text-white py-4 rounded-md font-bold hover:bg-[#EF4444] transition-all"
          >
            Confirm Sale & Generate Document
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold mb-4">Select Products</h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {products.map(product => (
            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:border-[#EF4444] transition-all group">
              <div className="flex flex-col">
                <span className="text-sm font-bold line-clamp-1">{product.name}</span>
                <span className="text-xs text-[#EF4444] font-bold">{formatCurrency(product.price, settings)}</span>
              </div>
              <button
                onClick={() => addItemToSale(product)}
                className="p-2 bg-gray-50 rounded-md group-hover:bg-[#EF4444] group-hover:text-white transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
