import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Ticket,
  X,
  Tag,
  PartyPopper,
  Sparkles,
  CheckCircle2,
  BadgePercent,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { DiscountCode } from '../../types';
import { getSiteContext } from '../../hooks/useSiteContext';
import { apiPost } from '../../services/apiClient';

export const Cart: React.FC = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    total,
    promoDiscount,
    promoMessage,
    appliedDiscount,
    setAppliedDiscount,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  // Popup state when coupon is applied
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [justAppliedCoupon, setJustAppliedCoupon] = useState<DiscountCode | null>(null);

  const discountAmount = promoDiscount;
  const finalTotal = total;

  const siteContext = getSiteContext();
  const continueShoppingUrl = siteContext === 'pc-build' ? '/pc-build' : siteContext === 'ecommerce' ? '/shop' : '/';

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidatingCode(true);
    try {
      const cleanCode = discountCode.trim().toUpperCase();
      let codeData: DiscountCode | null = null;

      try {
        const res = await apiPost<any>('/api/public/validate-coupon', { code: cleanCode });
        if (res?.success && res?.data) {
          codeData = res.data as DiscountCode;
        }
      } catch (apiErr: any) {
        const q = query(
          collection(db, 'couponCodes'), 
          where('code', '==', cleanCode),
          where('isActive', '==', true),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          codeData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as DiscountCode;
        }
      }

      if (!codeData) {
        toast.error('Invalid or inactive discount code');
        return;
      }
      
      // Check expiry
      if (codeData.expiryDate && new Date(codeData.expiryDate) < new Date()) {
        toast.error('This discount code has expired');
        return;
      }

      setAppliedDiscount(codeData);
      setJustAppliedCoupon(codeData);
      setShowCouponModal(true);

      toast.success(
        codeData.type === 'fixed' && codeData.fixedAmount
          ? `Discount applied: ৳${codeData.fixedAmount} off`
          : codeData.type === 'free_shipping'
          ? 'Free shipping coupon applied!'
          : `Discount applied: ${codeData.discountPercentage}% off`
      );
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast.error('Invalid or inactive discount code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setShowCouponModal(false);
  };

  // Helper to compute display savings in the modal
  const getCouponSavingsText = (coupon: DiscountCode) => {
    if (coupon.type === 'fixed' && coupon.fixedAmount) {
      return `৳${coupon.fixedAmount} OFF`;
    }
    if (coupon.type === 'free_shipping') {
      return '100% Free Shipping';
    }
    if (coupon.discountPercentage) {
      const estimatedAmt = Math.round((subtotal * coupon.discountPercentage) / 100);
      return `${coupon.discountPercentage}% OFF (Save ~৳${estimatedAmt})`;
    }
    return 'Special Discount Applied';
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-24 px-4">
          <div className="h-32 w-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner">
            <ShoppingBag size={56} />
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 mb-4">Your cart is empty</h2>
          <p className="text-slate-500 mb-10 text-lg">Looks like you haven't added any items to your cart yet.</p>
          <button
            onClick={() => navigate(continueShoppingUrl)}
            className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Continue Shopping
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Shopping Cart <span className="text-slate-400 font-medium text-xl ml-2">({items.length} items)</span></h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-5">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-slate-200 transition-colors group">
                
                <div className="h-24 w-24 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                  <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} className="object-contain w-full h-full mix-blend-multiply p-2 group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" loading="lazy" />
                </div>
                
                <div className="flex-grow w-full">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                  {item.itemType === 'product' && (
                    <p className="text-sm text-slate-500 mb-2 line-clamp-1">{item.description || item.category}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                    <p className="text-xl font-black text-slate-900">
                      {item.price === 0 && item.originalPrice ? (
                        <span className="flex items-center gap-2">
                          <span className="line-through text-slate-400 text-sm font-medium">{formatCurrency(item.originalPrice)}</span>
                          <span className="text-[#6EC72A] font-black uppercase tracking-wider">Free!</span>
                        </span>
                      ) : (
                        formatCurrency(item.price)
                      )}
                    </p>

                    <div className="flex items-center gap-4">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-slate-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
            <div className="space-y-4 text-sm text-slate-600 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-indigo-600 font-medium">
                  <span className="flex items-center gap-2"><Tag size={14}/> Promo Discount</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              
              {appliedDiscount && (
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-[#6EC72A] font-medium">
                  <div className="flex items-center gap-2">
                    <Ticket size={14} />
                    <span>{appliedDiscount.code}</span>
                    <button onClick={handleRemoveDiscount} className="text-slate-400 hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-red-50 transition-colors" title="Remove coupon">
                      <X size={14} />
                    </button>
                  </div>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500">Shipping</span>
                <span className="text-[#6EC72A] font-black uppercase text-xs tracking-wider bg-[#6EC72A]/10 px-2 py-1 rounded">Free</span>
              </div>
            </div>

            {promoMessage && (
              <div className="mb-6 p-4 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium flex items-start gap-3">
                <Tag size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                <span className="leading-relaxed">{promoMessage}</span>
              </div>
            )}

            {/* Discount Code Input */}
            {!appliedDiscount && (
              <div className="mb-8">
                <div className="flex gap-2 relative">
                  <div className="relative flex-grow">
                    <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Discount Code"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] uppercase transition-all placeholder:normal-case"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={isValidatingCode || !discountCode.trim()}
                    className="bg-[#0E2A47] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#6EC72A] transition-all disabled:opacity-50 disabled:hover:bg-[#0E2A47] shadow-sm flex items-center justify-center min-w-[90px]"
                  >
                    {isValidatingCode ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between items-end mb-8">
              <span className="font-bold text-slate-500">Total</span>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(finalTotal)}</span>
                <p className="text-xs text-slate-400 mt-1">VAT included where applicable</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-[#0E2A47] to-[#1a426e] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#0E2A47]/20 hover:-translate-y-0.5 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative">Proceed to Checkout</span>
              <ArrowRight size={20} className="relative group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* 🎉 Beautiful Celebration Coupon Applied Modal */}
      {showCouponModal && justAppliedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden text-center animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6EC72A] via-emerald-400 to-[#0E2A47]" />

            {/* Close Button */}
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Celebration Icon with pulsing glow */}
            <div className="relative mb-5 mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#6EC72A] to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <PartyPopper size={36} className="animate-bounce" />
              </div>
            </div>

            {/* Heading */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-amber-500" /> Coupon Applied!
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              Congratulations! 🎉
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Your coupon has been successfully unlocked and applied to your order.
            </p>

            {/* Voucher Ticket Card */}
            <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-4 sm:p-5 border-2 border-dashed border-emerald-300/80 mb-6 text-left shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    <Ticket size={14} /> Voucher Code
                  </div>
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                    {justAppliedCoupon.code}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block bg-[#6EC72A] text-white px-3 py-1 rounded-lg text-sm sm:text-base font-black shadow-sm">
                    {getCouponSavingsText(justAppliedCoupon)}
                  </span>
                </div>
              </div>

              {justAppliedCoupon.description && (
                <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-emerald-200/60 font-medium line-clamp-2">
                  {justAppliedCoupon.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowCouponModal(false);
                  navigate('/checkout');
                }}
                className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#0E2A47] to-[#1a426e] hover:from-[#13355b] hover:to-[#234e7e] shadow-md shadow-[#0E2A47]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                View Cart Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
