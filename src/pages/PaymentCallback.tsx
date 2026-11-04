import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCcw } from 'lucide-react';
import { verifyEpsPayment } from '../services/paymentApi';
import { useCart } from '../context/CartContext';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const status = searchParams.get('status') || searchParams.get('Status');
  const orderId = searchParams.get('orderId') || searchParams.get('CustomerOrderId');
  const merchantTransactionId =
    searchParams.get('merchantTransactionId') ||
    searchParams.get('MerchantTransactionId') ||
    searchParams.get('paymentID') ||
    searchParams.get('paymentId') ||
    '';

  const [verifying, setVerifying] = useState(true);
  const [finalStatus, setFinalStatus] = useState<'success' | 'failed' | 'cancelled'>('failed');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setFinalStatus('failed');
        setErrorMessage('Invalid payment callback: missing Order ID.');
        setVerifying(false);
        return;
      }

      const lowerStatus = (status || '').toLowerCase();
      if (lowerStatus === 'cancel' || lowerStatus === 'cancelled') {
        setFinalStatus('cancelled');
        setErrorMessage('You cancelled the payment process.');
        setVerifying(false);
        return;
      }

      if (lowerStatus === 'fail' || lowerStatus === 'failed' || lowerStatus === 'failure') {
        setFinalStatus('failed');
        setErrorMessage('Your payment failed or was declined by the payment gateway.');
        setVerifying(false);
        return;
      }

      try {
        const res = await verifyEpsPayment(orderId, merchantTransactionId || undefined);
        if (res.success) {
          setFinalStatus('success');
          clearCart();
        } else {
          setFinalStatus('failed');
          setErrorMessage(res.error || 'Failed to verify payment with EPS Gateway.');
        }
      } catch (err: any) {
        setFinalStatus('failed');
        setErrorMessage(err.message || 'Error communicating with payment server.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [status, orderId, merchantTransactionId, clearCart]);

  if (verifying) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
        <p className="text-gray-500 text-center max-w-md">
          Please wait while we confirm your transaction with the EPS Payment Gateway. Do not close or refresh this window.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        {finalStatus === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-6">
              Thank you for your payment. Your order <span className="font-bold text-gray-900">#{orderId?.slice(0, 8)}</span> has been confirmed via EPS Gateway.
            </p>
            <div className="space-y-3">
              <Link
                to={`/order-success/${orderId}`}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                View Order Details <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop"
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors block"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {finalStatus === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 mb-6">
              {errorMessage || 'We could not process your payment. Please try again.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/order-success/${orderId}`)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Try Payment Again
              </button>
              <Link
                to="/contact"
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors block"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}

        {finalStatus === 'cancelled' && (
          <>
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-500 mb-6">
              You cancelled the payment process. Your order is saved as pending if you wish to complete payment via EPS.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/order-success/${orderId}`)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Return to Order <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/shop"
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors block"
              >
                Return to Shop
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
