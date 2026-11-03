import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShieldAlert, RotateCw, ShoppingBag } from 'lucide-react';
import { verifyEpsPayment, cancelEpsPayment, initiateEpsPayment } from '../services/paymentApi';
import { useCart } from '../context/CartContext';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const statusParam = searchParams.get('status') || searchParams.get('Status') || '';
  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('CustomerOrderId') ||
    searchParams.get('valueA') ||
    '';
  const merchantTransactionId =
    searchParams.get('merchantTransactionId') ||
    searchParams.get('MerchantTransactionId') ||
    searchParams.get('EPSTransactionId') ||
    searchParams.get('paymentId') ||
    searchParams.get('paymentID') ||
    '';

  const [paymentState, setPaymentState] = useState<'processing' | 'success' | 'failed' | 'cancelled'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const processReturn = async () => {
      if (!orderId) {
        setPaymentState('failed');
        setMessage('Invalid payment return parameters: missing Order ID.');
        return;
      }

      const lowerStatus = statusParam.toLowerCase();

      if (lowerStatus === 'cancel' || lowerStatus === 'cancelled') {
        setPaymentState('cancelled');
        setMessage('আপনি পেমেন্ট বাতিল করেছেন। অগ্রিম ডেলিভারি চার্জ বা পেমেন্ট সম্পন্ন না করায় অর্ডারটি নিশ্চিত করা হয়নি।');
        // Notify backend to release stock and cancel pending order
        await cancelEpsPayment(orderId, 'cancelled', 'Customer cancelled payment at EPS Gateway').catch(() => {});
        return;
      }

      if (lowerStatus === 'fail' || lowerStatus === 'failed') {
        setPaymentState('failed');
        setMessage('পেমেন্টটি ব্যর্থ হয়েছে (Failed / Declined)। পেমেন্ট না পাওয়ায় অর্ডারটি সম্পন্ন করা হয়নি।');
        // Notify backend to release stock and cancel pending order
        await cancelEpsPayment(orderId, 'failed', 'Payment declined or failed at EPS Gateway').catch(() => {});
        return;
      }

      // Status is success or needs server verification
      try {
        let token: string | undefined = undefined;
        try {
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          } else if (typeof (auth as any).authStateReady === 'function') {
            await (auth as any).authStateReady();
            if (auth.currentUser) {
              token = await auth.currentUser.getIdToken();
            }
          }
        } catch {
          // Token resolution fallback
        }

        const res = await verifyEpsPayment(orderId, merchantTransactionId || undefined, token);
        if (res.success) {
          setPaymentState('success');
          setMessage('পেমেন্ট সফলভাবে ভেরিফাইড হয়েছে! আপনার অর্ডারে রিডাইরেক্ট করা হচ্ছে...');
          clearCart();
          setTimeout(() => {
            navigate(`/order-success/${orderId}`);
          }, 1500);
        } else {
          setPaymentState('failed');
          setMessage(res.error || 'Payment verification failed on the server.');
        }
      } catch (err: any) {
        setPaymentState('failed');
        setMessage(err.message || 'An error occurred while verifying your payment.');
      }
    };

    processReturn();
  }, [statusParam, orderId, merchantTransactionId, navigate, clearCart]);

  const handleRetryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      const res = await initiateEpsPayment(orderId);
      const redirectUrl = res.paymentUrl || res.redirectUrl;
      if (res.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error(res.error || 'Failed to re-initialize EPS payment.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error restarting payment.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        {paymentState === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-[#0E2A47] animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600 text-sm">{message}</p>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate(`/order-success/${orderId}`)}
              className="w-full py-3 px-4 bg-[#0E2A47] hover:bg-[#1a426e] text-white font-bold rounded-xl transition-colors shadow-md"
            >
              View Order Details
            </button>
          </div>
        )}

        {paymentState === 'failed' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-950 mb-2">Payment Failed</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                className="w-full py-3 px-4 bg-[#0E2A47] hover:bg-[#1a426e] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RotateCw size={18} className={retrying ? 'animate-spin' : ''} />
                {retrying ? 'Connecting...' : 'পেমেন্ট পুনরায় চেষ্টা করুন'}
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm"
              >
                চেকআউটে ফিরে যান
              </button>
            </div>
          </div>
        )}

        {paymentState === 'cancelled' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-amber-950 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                className="w-full py-3 px-4 bg-[#0E2A47] hover:bg-[#1a426e] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RotateCw size={18} className={retrying ? 'animate-spin' : ''} />
                {retrying ? 'Connecting...' : 'পেমেন্ট সম্পন্ন করুন'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                শপিং চালিয়ে যান
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
