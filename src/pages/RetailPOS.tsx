import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, Plus, Trash2, CreditCard, Banknote, List, UserPlus } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Product, Customer } from '../types';
import toast from 'react-hot-toast';

export const RetailPOS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{product: Product, quantity: number, hasWarranty?: boolean, warrantyYears?: number}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        const custSnap = await getDocs(collection(db, 'customers'));
        setProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})) as Product[]);
        setCustomers(custSnap.docs.map(d => ({id: d.id, ...d.data()})) as Customer[]);
      } catch (err) {
        console.error("Failed to load POS data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Item is out of stock', { icon: '🚫' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, {product, quantity: 1}];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const adjustQty = (productId: string, qty: number) => {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? {...item, quantity: qty} : item));
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% placeholder tax
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    toast.success('Checkout completed successfully');
    setCart([]);
    setSelectedCustomer(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
      {/* Products Config */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-[#3B82F6]" /> CLICK POS</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col"
                onClick={() => addToCart(product)}
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                   {product.images && product.images[0] ? (
                     <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-gray-400">No Image</span>
                   )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-xs text-gray-500 font-medium mb-1 line-clamp-1">{product.category}</span>
                  <h3 className="text-sm font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="font-bold text-[#3B82F6]">{formatCurrency(product.price)}</div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                      product.stock > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {product.stock > 0 ? `${product.stock} In` : 'Out'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <div className="w-[400px] bg-white border-l border-gray-200 shadow-xl flex flex-col z-10">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <User size={20} className="text-gray-400" />
          <select 
             className="flex-1 border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent"
             value={selectedCustomer?.id || ''}
             onChange={e => {
               const c = customers.find(x => x.id === e.target.value);
               setSelectedCustomer(c || null);
             }}
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
            ))}
          </select>
          <button className="p-2 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"><UserPlus size={16} /></button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {cart.map((item, idx) => (
            <div key={`${item.product.id}-${idx}`} className="bg-white border text-sm border-gray-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
               <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-800 line-clamp-2">{item.product.name}</span>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
               </div>
               <div className="flex items-center gap-2 mt-1">
                 <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={item.hasWarranty || false}
                     onChange={(e) => {
                       const newCart = [...cart];
                       newCart[idx].hasWarranty = e.target.checked;
                       setCart(newCart);
                     }}
                     className="rounded border-gray-300"
                   />
                   Warranty
                 </label>
                 {item.hasWarranty && (
                   <div className="flex items-center gap-1">
                     <input
                       type="number"
                       min="1"
                       value={item.warrantyYears || ''}
                       onChange={(e) => {
                         const newCart = [...cart];
                         newCart[idx].warrantyYears = Number(e.target.value);
                         setCart(newCart);
                       }}
                       className="w-12 text-xs border-gray-200 rounded-md py-1 px-1"
                       placeholder="Yrs"
                     />
                     <span className="text-xs text-gray-400">Yrs</span>
                   </div>
                 )}
               </div>
               <div className="flex items-center justify-between mt-1 tracking-tight">
                 <span className="font-medium text-gray-600">{formatCurrency(item.product.price)}</span>
                 <div className="flex items-center gap-3 border border-gray-200 rounded-md">
                   <button onClick={() => adjustQty(item.product.id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 font-bold">-</button>
                   <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                   <button onClick={() => adjustQty(item.product.id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                 </div>
                 <span className="font-bold text-[#3B82F6]">{formatCurrency(item.product.price * item.quantity)}</span>
               </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                 <ShoppingCart size={32} className="text-gray-300" />
               </div>
               <p className="font-medium">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 bg-white border-t border-gray-200 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (15%)</span>
            <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
             <button onClick={handleCheckout} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm transition-colors">
               <Banknote size={20} />
               Cash
             </button>
             <button onClick={handleCheckout} className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm transition-colors">
               <CreditCard size={20} />
               Card
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
