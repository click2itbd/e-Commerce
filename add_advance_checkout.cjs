const fs = require('fs');
let checkout = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');

// Add advanceTrxId to formData
const initFormTarget = `      paymentMethod: 'bkash',
      notes: '',
      termsAccepted: false
    });`;
const initFormReplace = `      paymentMethod: 'bkash',
      notes: '',
      termsAccepted: false,
      advanceTrxId: ''
    });`;

if (checkout.includes(initFormTarget)) {
    checkout = checkout.replace(initFormTarget, initFormReplace);
}

// Add advanceTrxId to orderData
const orderDataTarget = `          paymentMethod: paymentType === 'cod' ? 'cod' : formData.paymentMethod,
          notes: formData.notes,
          createdAt: new Date().toISOString(),`;
const orderDataReplace = `          paymentMethod: paymentType === 'cod' ? 'cod' : formData.paymentMethod,
          advanceTrxId: paymentType === 'cod' && settings?.requireAdvanceDeliveryCharge ? formData.advanceTrxId : undefined,
          notes: formData.notes,
          createdAt: new Date().toISOString(),`;

if (checkout.includes(orderDataTarget)) {
    checkout = checkout.replace(orderDataTarget, orderDataReplace);
}

// Ensure validation for TrxID if required
const validateTarget = `      if (!formData.firstName || !formData.phone || !formData.address) {
        toast.error('Please fill all required fields');
        return;
      }`;
const validateReplace = `      if (!formData.firstName || !formData.phone || !formData.address) {
        toast.error('Please fill all required fields');
        return;
      }
      if (paymentType === 'cod' && settings?.requireAdvanceDeliveryCharge && !formData.advanceTrxId) {
        toast.error('Please enter the Transaction ID for your advance delivery charge payment.');
        return;
      }`;

if (checkout.includes(validateTarget)) {
    checkout = checkout.replace(validateTarget, validateReplace);
}

// Inject UI for COD TrxID
const uiTarget = `                  <span className="font-bold">Cash on Delivery</span>
                </label>
  
                <label className={\`flex-1 cursor-pointer border-2 rounded-xl p-5 flex items-center justify-center gap-3 transition-all \${paymentType === 'pay_now' ? 'border-[#6EC72A] bg-[#6EC72A]/5 text-[#6EC72A]' : 'border-slate-200 hover:border-slate-300 text-slate-600'}\`}>`;

const uiReplace = `                  <span className="font-bold">Cash on Delivery</span>
                </label>
  
                <label className={\`flex-1 cursor-pointer border-2 rounded-xl p-5 flex items-center justify-center gap-3 transition-all \${paymentType === 'pay_now' ? 'border-[#6EC72A] bg-[#6EC72A]/5 text-[#6EC72A]' : 'border-slate-200 hover:border-slate-300 text-slate-600'}\`}>`;

const codBlockTarget = `              {paymentType === 'pay_now' && (`;
const codBlockReplace = `              {paymentType === 'cod' && settings?.requireAdvanceDeliveryCharge && (
                <div className="max-w-lg mx-auto bg-orange-50 border border-orange-200 p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300 text-center">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <h4 className="font-bold text-orange-800 text-lg mb-2">Advance Delivery Charge Required</h4>
                  <p className="text-orange-700 text-sm mb-4">
                    To confirm your Cash on Delivery order, please send the delivery charge (<strong>{formatCurrency(shippingCost)}</strong>) to our bKash/Nagad number below.
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-orange-200 inline-block mb-4 font-mono text-xl font-bold tracking-widest text-[#081621]">
                    {settings?.advancePaymentNumber || '01XXXXXXXXX'}
                  </div>
                  
                  <div className="text-left mt-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID (TrxID) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="advanceTrxId"
                      value={formData.advanceTrxId || ''}
                      onChange={handleChange}
                      placeholder="e.g. 9X2B7Q..." 
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono uppercase"
                      required
                    />
                  </div>
                </div>
              )}
              
              {paymentType === 'pay_now' && (`;

if (!checkout.includes('advanceTrxId')) {
    checkout = checkout.replace(codBlockTarget, codBlockReplace);
    fs.writeFileSync('src/pages/shop/Checkout.tsx', checkout, 'utf8');
    console.log('Added Advance Payment UI to Checkout');
} else {
    console.log('Advance payment already implemented');
}