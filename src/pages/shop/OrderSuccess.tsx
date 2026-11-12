// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { Layout } from '../../components/Layout';
import { useSettings } from '../../context/SettingsContext';
import { generatePDF } from '../../lib/pdf';
import { formatCurrency } from '../../lib/utils';
import { initiateEpsPayment } from '../../services/paymentApi';
import { CheckCircle, Download, ArrowRight, Package, Loader2, ShieldCheck, User, MapPin, Calendar, Hash, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const OrderSuccess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingEps, setInitiatingEps] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrder({ id: docSnap.id, ...data } as Order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePayWithEps = async () => {
    if (!id) return;
    setInitiatingEps(true);
    try {
      const res = await initiateEpsPayment(id);
      const redirectUrl = res.paymentUrl || res.redirectUrl;
      if (res.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error(res.error || 'Failed to start EPS payment.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize EPS payment.');
    } finally {
      setInitiatingEps(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2b3c]"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn't locate the details for this order.</p>
          <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  const isOnlineOrder = order.paymentMethod !== 'cod';
  const isPaid = order.paymentStatus === 'verified';
  const isCancelled = order.status === 'cancelled' || order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed';
  const advancePaid = Number((order as any).advancePaidAmount || (order as any).paidAmount || (order as any).shippingCost || 0);
  const remainingDue = Math.max(0, Number(order.total || 0) - advancePaid);

  return (
    <Layout>
      <div className="bg-slate-50/60 min-h-screen py-8 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Header section */}
            {isCancelled ? (
              <div className="bg-gradient-to-b from-rose-50 to-white px-6 sm:px-10 py-10 text-center border-b border-rose-100">
                <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-rose-50">
                  <Package className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Order Incomplete / Cancelled</h1>
                <p className="text-rose-700 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
                  পেমেন্ট অথবা অগ্রিম ডেলিভারি চার্জ পরিশোধ সম্পন্ন না করায় অর্ডারটি বাতিল অবস্থায় রয়েছে। অর্ডারটি সক্রিয় করতে অনুগ্রহ করে পুনরায় পেমেন্ট করুন।
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handlePayWithEps}
                    disabled={initiatingEps}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-rose-600 hover:bg-rose-700 transition"
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    {initiatingEps ? 'Connecting to Payment...' : 'পেমেন্ট পুনরায় চেষ্টা করুন'}
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
                  >
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-white px-6 sm:px-10 py-10 text-center border-b border-slate-100">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50 shadow-sm">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Order Received!</h1>
                <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">
                  Thank you, <strong className="text-slate-900">{order.customerName}</strong>. Your order has been placed successfully.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => generatePDF(order, 'invoice', settings)}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl shadow-sm text-white bg-[#0E2A47] hover:bg-[#1a426e] transition-all hover:shadow-md cursor-pointer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Invoice
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Continue Shopping
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Online Payment Action Section (if payment is still pending) */}
            {isOnlineOrder && !isPaid && !isCancelled && (
              <div className="bg-emerald-50/70 border border-emerald-200 p-6 mx-6 sm:mx-8 mt-6 rounded-2xl">
                <div className="flex items-start gap-3 mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      {order.paymentMethod === 'cod_advance_paid' ? 'Pay Advance Delivery Fee' : 'Complete Online Payment'}
                    </h3>
                    <p className="text-emerald-800 text-sm mt-1">
                      {order.paymentMethod === 'cod_advance_paid'
                        ? 'ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে অগ্রিম ডেলিভারি চার্জ অনলাইনে পরিশোধ করতে হবে।'
                        : 'Your order is awaiting online payment. Click below to complete your payment securely.'}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                      {order.paymentMethod === 'cod_advance_paid' ? 'Payable Advance Delivery Charge' : 'Payable Amount'}
                    </p>
                    <p className="text-xl font-black text-emerald-700">
                      {formatCurrency(
                        order.paymentMethod === 'cod_advance_paid' && advancePaid > 0
                          ? advancePaid
                          : order.total,
                        settings
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Invoice Ref</p>
                    <p className="font-mono font-bold text-slate-800">{order.documentNumber || order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePayWithEps}
                  disabled={initiatingEps}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {initiatingEps ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Payment Gateway...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      {order.paymentMethod === 'cod_advance_paid' ? 'Pay Advance Delivery Fee' : 'Pay Online Now'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Verified Payment Status Banner */}
            {isPaid && (
              <div className="mx-6 sm:mx-8 mt-6 bg-gradient-to-r from-blue-50/80 via-slate-50/60 to-indigo-50/80 border border-blue-200/80 p-5 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {order.paymentMethod === 'cod_advance_paid' ? 'Advance Courier Payment Verified' : 'Payment Verified'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                      Paid: {formatCurrency(order.paymentMethod === 'cod_advance_paid' ? advancePaid : (order.paidAmount || order.total), settings)}
                    </span>
                    {order.paymentMethod === 'cod_advance_paid' && remainingDue > 0 && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-200">
                        Due: {formatCurrency(remainingDue, settings)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm pl-10.5 leading-relaxed">
                  {order.paymentMethod === 'cod_advance_paid'
                    ? `অগ্রিম ডেলিভারি চার্জ (${formatCurrency(advancePaid, settings)}) সফলভাবে গৃহীত হয়েছে। অবশিষ্ট ${formatCurrency(remainingDue, settings)} ডেলিভারির সময় ক্যাশ পরিশোধ করতে হবে।`
                    : 'Your payment has been verified successfully. Your order is now being processed.'}
                </p>
                {(order as any).transactionId && (
                  <div className="mt-3 pl-10.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {(order as any).transactionId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Order details */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Order Meta Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Placed on <strong>{new Date(order.createdAt).toLocaleDateString()}</strong> at {new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Order No:</span>
                  <span className="font-mono bg-slate-100 text-slate-900 px-3 py-1 rounded-lg font-bold text-sm border border-slate-200">
                    {order.documentNumber || order.id.toUpperCase().slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Customer and Shipping Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Customer Information</span>
                  </div>
                  <div className="text-sm text-slate-800 space-y-1">
                    <p className="font-bold text-slate-900 text-base">{order.customerName}</p>
                    <p className="text-slate-600">{order.customerEmail}</p>
                    <p className="font-mono text-slate-700">{order.customerPhone}</p>
                    {(order as any).company && <p className="text-xs text-slate-500">Company: {(order as any).company}</p>}
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Shipping Address</span>
                  </div>
                  <div className="text-sm text-slate-800 leading-relaxed">
                    <p className="text-slate-700 font-medium">{order.shippingAddress || 'Digital Delivery'}</p>
                  </div>
                </div>
              </div>

              {/* Credit Card EMI Details Section (if ordered with EMI) */}
              {(order.emiDetails?.isEmi || order.paymentMethod?.includes('EMI')) && (
                <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border-2 border-orange-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow-xs">
                        <CreditCard size={17} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payment Method</span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          Credit Card EMI ({order.emiDetails?.months || 12} Months - {order.emiDetails?.shortName || order.emiDetails?.bankName || 'Partner Bank'})
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 text-[#F97316]">
                      EMI Plan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                    <div className="bg-white/90 p-3 rounded-xl border border-orange-100">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Issuing Bank</span>
                      <span className="font-bold text-slate-800">
                        {order.emiDetails?.bankName || order.emiDetails?.shortName || 'Credit Card Partner Bank'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-3 rounded-xl border border-orange-100">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Tenure & Rate</span>
                      <span className="font-bold text-slate-800">
                        {order.emiDetails?.months || 12} Months {order.emiDetails?.rate ? `(${order.emiDetails.rate}% charge)` : ''}
                      </span>
                    </div>

                    <div className="bg-white/90 p-3 rounded-xl border border-orange-100">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Monthly Installment</span>
                      <span className="font-black text-[#F97316] text-base">
                        ৳ {Math.round(order.emiDetails?.monthlyAmount || (order.total / (order.emiDetails?.months || 12))).toLocaleString('en-IN')}{" "}
                        <span className="text-xs font-normal text-slate-500">/ Month</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items Table */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>Order Items</span>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm bg-white">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th scope="col" className="px-6 py-3.5">Item</th>
                        <th scope="col" className="px-4 py-3.5 text-center w-24">Qty</th>
                        <th scope="col" className="px-6 py-3.5 text-right w-40">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900 leading-snug break-words">
                              {item.name}
                            </p>
                            {item.itemType && item.itemType !== 'product' && (
                              <span className="inline-block mt-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {item.itemType}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity, settings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 divide-y divide-slate-200/70 text-sm">
                      <tr>
                        <th scope="row" colSpan={2} className="px-6 py-3 text-right font-medium text-slate-500">
                          Subtotal
                        </th>
                        <td className="px-6 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {formatCurrency(order.items.reduce((s, i) => s + (i.price * i.quantity), 0), settings)}
                        </td>
                      </tr>
                      {(order as any).shippingCost > 0 && (
                        <tr>
                          <th scope="row" colSpan={2} className="px-6 py-3 text-right font-medium text-slate-500">
                            Shipping
                          </th>
                          <td className="px-6 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {formatCurrency((order as any).shippingCost, settings)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-100/70">
                        <th scope="row" colSpan={2} className="px-6 py-3.5 text-right text-base font-extrabold text-slate-900">
                          Total
                        </th>
                        <td className="px-6 py-3.5 text-right text-base font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(order.total, settings)}
                        </td>
                      </tr>
                      {(order.emiDetails?.isEmi || order.paymentMethod?.includes('EMI')) && (
                        <tr className="bg-orange-50/80 border-t-2 border-orange-200 text-orange-950">
                          <th scope="row" colSpan={2} className="px-6 py-3.5 text-right text-sm font-bold">
                            Monthly Installment ({order.emiDetails?.months || 12} Months - {order.emiDetails?.shortName || 'Credit Card EMI'})
                          </th>
                          <td className="px-6 py-3.5 text-right text-base font-black text-[#F97316] whitespace-nowrap">
                            ৳ {Math.round(order.emiDetails?.monthlyAmount || (order.total / (order.emiDetails?.months || 12))).toLocaleString('en-IN')} / mo
                          </td>
                        </tr>
                      )}
                      {order.paymentMethod === 'cod_advance_paid' && (
                        <>
                          <tr className="bg-emerald-50/70 text-emerald-900">
                            <th scope="row" colSpan={2} className="px-6 py-3 text-right text-sm font-bold">
                              Advance Delivery Fee (Paid Online)
                            </th>
                            <td className="px-6 py-3 text-right text-sm font-black text-emerald-700 whitespace-nowrap">
                              - {formatCurrency(advancePaid, settings)}
                            </td>
                          </tr>
                          <tr className="bg-amber-50/90 border-t-2 border-amber-300">
                            <th scope="row" colSpan={2} className="px-6 py-3.5 text-right text-base font-black text-amber-950">
                              Due on Delivery (Pay in Cash)
                            </th>
                            <td className="px-6 py-3.5 text-right text-base font-black text-amber-950 whitespace-nowrap">
                              {formatCurrency(remainingDue, settings)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
