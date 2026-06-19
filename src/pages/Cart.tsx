import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Ticket, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateDocumentNumber } from '../lib/numbering';
import { toast } from 'react-hot-toast';
import { DiscountCode, OrderType } from '../types';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('invoice');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const discountAmount = appliedDiscount ? (total * appliedDiscount.discountPercentage) / 100 : 0;
  const finalTotal = total - discountAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidatingCode(true);
    try {
      const q = query(
        collection(db, 'couponCodes'), 
        where('code', '==', discountCode.trim().toUpperCase()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Invalid or inactive discount code');
        return;
      }

      const codeData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as DiscountCode;
      
      // Check expiry
      if (new Date(codeData.expiryDate) < new Date()) {
        toast.error('This discount code has expired');
        return;
      }

      setAppliedDiscount(codeData);
      toast.success(`Discount applied: ${codeData.discountPercentage}% off`);
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast.error('Failed to validate discount code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <ShoppingBag size={48} />
          </div>
          <h2 className="text-2xl font-bold text-[#081621] mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#EF4444] text-white px-8 py-3 rounded-md font-bold hover:bg-red-600 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-bold text-[#081621] mb-6">Shopping Cart ({items.length} items)</h1>
          
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
              <div className="h-20 w-20 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden shrink-0">
                <img src={item.images?.[0] || undefined} alt="" className="object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-[#081621] line-clamp-1">{item.name}</h3>
                <p className="text-[#EF4444] font-bold mt-1">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-md p-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 hover:bg-white rounded-md transition-all text-gray-500"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-white rounded-md transition-all text-gray-500"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-gray-400 hover:text-[#EF4444] transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-[#081621] mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-green-600 font-medium">
                  <div className="flex items-center gap-1">
                    <span>Discount ({appliedDiscount.code})</span>
                    <button onClick={handleRemoveDiscount} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 font-bold uppercase text-[10px]">Free</span>
              </div>
            </div>

            {/* Discount Code Input */}
            {!appliedDiscount && (
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Discount Code"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={isValidatingCode || !discountCode.trim()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#EF4444] transition-all disabled:opacity-50"
                  >
                    {isValidatingCode ? '...' : 'Apply'}
                  </button>
                </div>
              </div>
            )}

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
              <span className="font-bold text-[#081621]">Total</span>
              <span className="text-xl font-bold text-[#EF4444]">{formatCurrency(finalTotal)}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#081621] text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-[#EF4444] transition-all"
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
