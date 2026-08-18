import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function PaymentSimulation() {
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || 'unknown';
  const orderId = searchParams.get('orderId') || '';
  const amountParam = searchParams.get('amount') || '0';
  const amount = parseFloat(amountParam);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate params
  useEffect(() => {
    if (!orderId || !amount) {
      setError('Invalid payment session. Missing order ID or amount.');
    }
  }, [orderId, amount]);

  const handleSimulateAction = (status: 'success' | 'failed' | 'cancelled') => {
    setLoading(true);
    
    // Simulate processing time
    setTimeout(() => {
      // Redirect to the callback page with the result
      navigate(`/payment/callback?status=${status}&orderId=${orderId}&method=${method}`);
    }, 1500);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Session</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getGatewayColor = () => {
    if (method === 'bkash') return 'bg-pink-600';
    if (method === 'sslcommerz') return 'bg-blue-600';
    return 'bg-gray-800';
  };

  const getGatewayName = () => {
    if (method === 'bkash') return 'bKash Payment Gateway';
    if (method === 'sslcommerz') return 'SSLCommerz Secure Checkout';
    return 'Payment Gateway';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Fake Gateway Header */}
      <div className={`${getGatewayColor()} text-white p-4 shadow-md flex justify-between items-center`}>
        <div className="font-bold text-lg flex items-center gap-2">
          <Shield size={20} />
          {getGatewayName()}
        </div>
        <div className="text-sm opacity-80 flex items-center gap-1">
          <Lock size={14} /> Secure Connection
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 relative overflow-hidden">
          
          {/* Developer Notice Badge */}
          <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Sandbox / Simulation
          </div>

          <div className="text-center mb-8 pt-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Payment</h2>
            <p className="text-gray-500 text-sm">
              This is a simulated payment gateway. In production, the user would see the actual {method} interface here.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 font-medium">Order ID</span>
              <span className="font-mono text-gray-900 font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 font-medium">Merchant</span>
              <span className="text-gray-900 font-bold">Click2IT Web Solutions</span>
            </div>
            <div className="h-px bg-gray-200 my-4"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-bold">Total Amount</span>
              <span className="text-2xl font-black text-blue-600">{formatCurrency(amount)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSimulateAction('success')}
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 bg-gray-400' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'Processing...' : 'Simulate Success'}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSimulateAction('failed')}
                disabled={loading}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
              >
                <XCircle className="w-4 h-4" />
                Simulate Fail
              </button>
              <button
                onClick={() => handleSimulateAction('cancelled')}
                disabled={loading}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-3 rounded-xl transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Need to import Lock locally since I forgot it at top
import { Lock } from 'lucide-react';
