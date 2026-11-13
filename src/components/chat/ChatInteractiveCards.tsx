import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Check,
  Bell,
  Package,
  Truck,
  CreditCard,
  Tag,
  PhoneCall,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { apiPost } from '../../services/apiClient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  BANK_EMI_PLANS,
  EMI_TENURES,
  EMITenureKey,
  MINIMUM_EMI_PURCHASE,
  calculateEMI,
} from '../../data/emiPlans';

export interface MatchedChatProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  discountPrice: number;
  finalPrice: number;
  inStock: boolean;
  stock: number;
  warranty: string;
  imageUrl: string;
  isFreeShipping?: boolean;
}

export type ChatWidgetType =
  | 'order_tracker'
  | 'emi_calculator'
  | 'coupon_checker'
  | 'callback_form'
  | null;

/* ---------------- 1. Interactive Product Cards Carousel ---------------- */
export const ChatProductCards: React.FC<{
  products: MatchedChatProduct[];
  onNavigate: (path: string) => void;
  onCalculateEmi?: (price: number, productName: string) => void;
}> = ({ products, onNavigate, onCalculateEmi }) => {
  const { items: cartItems, addToCart } = useCart();
  const { user } = useAuth();
  const [alertTargetId, setAlertTargetId] = useState<string | null>(null);
  const [alertEmail, setAlertEmail] = useState(user?.email || '');
  const [alertPrice, setAlertPrice] = useState('');
  const [submittingAlert, setSubmittingAlert] = useState(false);

  if (!products.length) return null;

  const handleAdd = (p: MatchedChatProduct) => {
    addToCart({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      isOutOfStock: !p.inStock,
      imageUrl: p.imageUrl,
      images: p.imageUrl ? [p.imageUrl] : [],
      description: '',
      isFreeShipping: p.isFreeShipping,
      createdAt: '',
    });
    toast.success(`Added to cart!`);
  };

  const handleSubscribeAlert = async (p: MatchedChatProduct) => {
    const cleanEmail = alertEmail.trim();
    const numericTarget = Number(alertPrice) || Math.round(p.finalPrice * 0.9);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmittingAlert(true);
    try {
      await apiPost('/api/price-alerts/subscribe', {
        productId: p.id,
        productName: p.name,
        productImage: p.imageUrl,
        currentPrice: p.finalPrice,
        targetPrice: numericTarget,
        email: cleanEmail,
        userId: user?.uid || 'guest',
      });
      toast.success('Price/Stock alert set! Check your email.');
      setAlertTargetId(null);
      setAlertPrice('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to subscribe price alert');
    } finally {
      setSubmittingAlert(false);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-1 snap-x no-scrollbar">
      {products.map((p) => {
        const cartMatch = cartItems.find((c) => c.id === p.id);
        const hasDiscount = p.discountPrice > 0 && p.discountPrice < p.price;
        const isAlertOpen = alertTargetId === p.id;

        return (
          <div
            key={p.id}
            className="w-[215px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex gap-2 items-start">
                <button
                  type="button"
                  onClick={() => onNavigate(`/product/${p.id}`)}
                  className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-contain p-0.5"
                      loading="lazy"
                    />
                  ) : (
                    <Package size={18} className="text-slate-300" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/product/${p.id}`)}
                    className="text-left text-[11px] font-bold text-slate-800 hover:text-blue-700 line-clamp-2 leading-snug cursor-pointer"
                  >
                    {p.name}
                  </button>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        p.inStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {p.warranty && (
                      <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {p.warranty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-extrabold text-[#0E2A47]">
                    ৳{p.finalPrice.toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-slate-400 line-through">
                      ৳{p.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {onCalculateEmi && p.finalPrice >= MINIMUM_EMI_PURCHASE && (
                  <button
                    type="button"
                    onClick={() => onCalculateEmi(p.finalPrice, p.name)}
                    className="text-[9px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    title="Calculate EMI"
                  >
                    EMI ৳{Math.round(p.finalPrice / 12).toLocaleString('en-IN')}/m*
                  </button>
                )}
              </div>
            </div>

            {isAlertOpen ? (
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-lg p-2 space-y-1.5">
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-orange-400"
                />
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder={`Target ৳ (${Math.round(p.finalPrice * 0.9)})`}
                  className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded outline-none focus:border-orange-400"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={submittingAlert}
                    onClick={() => handleSubscribeAlert(p)}
                    className="flex-1 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded cursor-pointer disabled:opacity-50"
                  >
                    {submittingAlert ? 'Saving...' : 'Notify Me'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertTargetId(null)}
                    className="px-2 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 pt-0.5">
                {p.inStock ? (
                  <button
                    type="button"
                    onClick={() => handleAdd(p)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      cartMatch
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#0E2A47] hover:bg-[#1a4977] text-white'
                    }`}
                  >
                    {cartMatch ? (
                      <>
                        <Check size={11} />
                        <span>In Cart ({cartMatch.quantity})</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={11} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAlertTargetId(p.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Bell size={11} />
                    <span>Notify Stock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAlertTargetId(p.id)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-colors cursor-pointer"
                  title="Set Price Drop Alert"
                >
                  <Bell size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/product/${p.id}`)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600 hover:text-[#0E2A47] hover:bg-slate-50 cursor-pointer"
                >
                  View
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- 2. Inline Mini Order Tracker ---------------- */
export const ChatOrderTrackerCard: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await apiPost<{ success: boolean; data?: any; error?: string }>(
        '/api/public/track-order',
        { orderId: orderId.trim(), phone: phone.trim() }
      );
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error || 'Order not found or phone does not match.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to verify order. Check ID & Phone.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStep = order ? steps.indexOf(String(order.status || '').toLowerCase()) : -1;

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#0E2A47] flex items-center gap-1.5">
          <Truck size={13} className="text-orange-500" />
          Live Order Tracker
        </span>
        <button
          type="button"
          onClick={() => onNavigate('/track-order')}
          className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          Full Page <ExternalLink size={9} />
        </button>
      </div>

      <form onSubmit={handleTrack} className="space-y-1.5">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID বা Invoice No. (যেমন: INV-1024)"
          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47] focus:bg-white"
          required
        />
        <div className="flex gap-1.5">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={user ? 'Phone (optional if logged in)' : 'Phone * (01XXXXXXXXX)'}
            required={!user}
            className="flex-1 px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47] focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="px-3 py-1.5 bg-[#0E2A47] hover:bg-[#1a4977] text-white text-[11px] font-bold rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Track'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200/70 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-800">
              #{order.invoiceNumber || String(order.id).slice(0, 8)}
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {order.status || 'pending'}
            </span>
          </div>

          {String(order.status).toLowerCase() !== 'cancelled' && (
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {steps.map((s, idx) => (
                <div key={s} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`h-1 w-full rounded-full ${
                      currentStep >= idx ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                  <span className="text-[9px] capitalize text-slate-500">{s}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/70">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-bold text-slate-900">
                ৳{Number(order.grandTotal || order.total || 0).toLocaleString('en-IN')}
              </span>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span>Tracking ({order.courier || 'Courier'}):</span>
                <span className="font-semibold text-slate-800">{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- 3. Inline 16-Bank EMI Calculator ---------------- */
export const ChatEMICalculatorCard: React.FC<{
  initialAmount?: number;
  onNavigate: (path: string) => void;
}> = ({ initialAmount = 50000, onNavigate }) => {
  const [amountInput, setAmountInput] = useState<string>(
    String(initialAmount >= MINIMUM_EMI_PURCHASE ? Math.round(initialAmount) : 50000)
  );
  const [bankId, setBankId] = useState<string>(BANK_EMI_PLANS[0].id);
  const [tenure, setTenure] = useState<EMITenureKey>('12M');

  const numericAmount = Number(amountInput) || 0;
  const isEligible = numericAmount >= MINIMUM_EMI_PURCHASE;

  const calc = useMemo(() => {
    if (!isEligible) return null;
    return calculateEMI(numericAmount, bankId, tenure);
  }, [numericAmount, bankId, tenure, isEligible]);

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#0E2A47] flex items-center gap-1.5">
          <CreditCard size={13} className="text-orange-500" />
          Live EMI Calculator (16 Banks)
        </span>
        <button
          type="button"
          onClick={() => onNavigate('/emi-terms')}
          className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          EMI Terms <ChevronRight size={10} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Amount (৳)</label>
          <input
            type="number"
            min={1000}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-full px-2 py-1 text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47]"
          />
        </div>
        <div>
          <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Bank</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full px-1.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47]"
          >
            {BANK_EMI_PLANS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {EMI_TENURES.map((t) => {
          const bank = BANK_EMI_PLANS.find((b) => b.id === bankId);
          const rate = bank?.rates[t.key];
          if (rate === null || rate === undefined) return null;
          const active = tenure === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTenure(t.key)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0E2A47] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.key}
            </button>
          );
        })}
      </div>

      {!isEligible ? (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/70 rounded-lg px-2 py-1.5">
          ন্যূনতম ৳{MINIMUM_EMI_PURCHASE.toLocaleString('en-IN')} বা তার বেশি অর্ডারে EMI পাওয়া যায়।
        </p>
      ) : calc ? (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50/70 border border-orange-200/80 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-slate-500">Monthly Installment</p>
            <p className="text-sm font-extrabold text-orange-600">
              ৳{calc.monthlyInstallment.toLocaleString('en-IN')}/mo
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <p>
              Charge: <strong className="text-slate-800">{calc.rate}%</strong>
            </p>
            <p>
              Total: <strong className="text-slate-800">৳{calc.totalPayable.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-500">This bank does not support {tenure} tenure.</p>
      )}
    </div>
  );
};

/* ---------------- 4. Inline Coupon Checker ---------------- */
export const ChatCouponCheckerCard: React.FC = () => {
  const { setAppliedDiscount } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState<any>(null);
  const [applied, setApplied] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setValidated(null);
    setApplied(false);

    try {
      const res = await apiPost<{ success: boolean; data?: any; error?: string }>(
        '/api/public/validate-coupon',
        { code: code.trim() }
      );
      if (res.success && res.data) {
        setValidated(res.data);
      } else {
        setError(res.error || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired coupon code.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!validated) return;
    setAppliedDiscount({
      id: validated.id,
      code: validated.code,
      type: validated.type,
      discountPercentage: validated.discountPercentage,
      fixedAmount: validated.fixedAmount,
      expiryDate: validated.expiryDate,
      isActive: true,
      createdAt: validated.createdAt || new Date().toISOString(),
    });
    setApplied(true);
    toast.success(`Coupon ${validated.code} applied to cart!`);
  };

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
      <div className="text-[11px] font-bold text-[#0E2A47] flex items-center gap-1.5">
        <Tag size={13} className="text-orange-500" />
        Coupon Code Validator
      </div>

      <form onSubmit={handleCheck} className="flex gap-1.5">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Promo code (e.g. WELCOME10)"
          className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold uppercase bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47] focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-3 py-1.5 bg-[#0E2A47] hover:bg-[#1a4977] text-white text-[11px] font-bold rounded-lg disabled:opacity-50 cursor-pointer shrink-0"
        >
          {loading ? '...' : 'Check'}
        </button>
      </form>

      {error && (
        <p className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200/70 rounded-lg px-2 py-1">
          {error}
        </p>
      )}

      {validated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between gap-2">
          <div className="text-[10px] text-emerald-900">
            <p className="font-bold">
              {validated.code} •{' '}
              {validated.type === 'free_shipping'
                ? 'Free Shipping'
                : validated.type === 'fixed'
                  ? `৳${validated.fixedAmount} OFF`
                  : `${validated.discountPercentage}% OFF`}
            </p>
            {validated.minOrderAmount > 0 && (
              <p className="text-emerald-700">Min order: ৳{validated.minOrderAmount}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={applied}
            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 text-white text-[10px] font-bold cursor-pointer shrink-0"
          >
            {applied ? 'Applied ✓' : 'Apply Cart'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------- 5. Inline Support Callback Request ---------------- */
export const ChatCallbackFormCard: React.FC<{
  initialNote?: string;
  pagePath: string;
  waUrl: string;
}> = ({ initialNote = '', pagePath, waUrl }) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState(initialNote);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 8) {
      toast.error('সঠিক মোবাইল নম্বর দিন (e.g. 01XXXXXXXXX)');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        userId: user?.uid || 'guest',
        firstName: name.trim() || 'Live Chat Customer',
        name: name.trim() || 'Live Chat Customer',
        phone: cleanPhone,
        email: user?.email || '',
        initialMessage: note.trim() || 'Callback requested from live chat',
        description: note.trim() || 'Callback requested from live chat',
        pagePath,
        source: 'floating_live_chat_callback',
        status: 'new',
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
      toast.success('Callback request sent! Our team will call you shortly.');
    } catch {
      toast.error('Failed to submit callback request. Please use WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>কলব্যাক রিকোয়েস্ট সফল হয়েছে!</span>
        </div>
        <p className="text-[10px] text-emerald-800">
          আমাদের সেলস ও টেকনিক্যাল টিম শীঘ্রই আপনার <strong>{phone}</strong> নম্বরে যোগাযোগ করবে।
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#0E2A47] flex items-center gap-1.5">
          <PhoneCall size={13} className="text-orange-500" />
          Request Instant Callback
        </span>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <MessageCircle size={11} /> WhatsApp
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম"
            className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ফোন নম্বর *"
            required
            className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47]"
          />
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="বিষয় (PC Build / Quote / Support)"
            className="flex-1 px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0E2A47]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 cursor-pointer shrink-0"
          >
            {submitting ? '...' : 'Call Me'}
          </button>
        </div>
      </form>
    </div>
  );
};
