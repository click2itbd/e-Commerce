import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/utils';
import { Server, Globe, Trash2, Plus, Minus, ShoppingCart, Tag, ArrowRight } from 'lucide-react';

const HostingCart: React.FC = () => {
  const { items: allItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const items = allItems.filter((i) => i.category === 'Hosting & Domains');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = 0;
  const total = subtotal + taxes;

  return (
    <Layout fullWidth>
      <div className="bg-[#0a1628] pt-25 pb-16 text-white text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Review Your Order
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          You're just one step away from launching your next big idea.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
              <ShoppingCart className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">
              Looks like you haven't added any hosting plans or domains to your cart yet. Let's get you set up!
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-[#0a1628] hover:bg-[#12284c] text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Browse Hosting Plans <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Cart Items ({items.length})</h2>
                <button 
                  onClick={clearCart}
                  className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Clear Cart
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-shadow hover:shadow-md">
                  <div className="bg-slate-50 p-4 rounded-xl shrink-0">
                    {item.name.toLowerCase().includes('domain') ? (
                      <Globe className="w-8 h-8 text-indigo-600" />
                    ) : (
                      <Server className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-500">
                      {item.details || 'Billed Annually'}
                    </p>
                  </div>

                  <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="text-lg font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(item.price)} each
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Taxes & Fees</span>
                    <span className="font-medium text-slate-900">{formatCurrency(taxes)}</span>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-extrabold text-[#0a1628]">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="promo">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        id="promo"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter code"
                      />
                    </div>
                    <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                      Apply
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/hosting/checkout')}
                  className="w-full bg-[#0a1628] hover:bg-[#12284c] text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  By proceeding to checkout, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export { HostingCart };
