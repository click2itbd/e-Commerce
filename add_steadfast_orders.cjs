const fs = require('fs');
let orders = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', 'utf8');

const trackingFunction = `  const handleUpdateTracking = async (orderId: string, trackingNumber: string, courier: string) => {`;
const steadfastFunction = `
  const handleSendToSteadfast = async (order: Order) => {
    if (!settings?.steadfastApiKey || !settings?.steadfastSecretKey) {
      toast.error('Steadfast API keys are missing in Settings!');
      return;
    }
    
    const tid = toast.loading('Sending to Steadfast...');
    try {
      const payload = {
        invoice: order.id.slice(0, 8).toUpperCase(),
        recipient_name: order.shippingInfo?.fullName || 'Customer',
        recipient_phone: order.shippingInfo?.phone || '',
        recipient_address: (order.shippingInfo?.address || '') + ', ' + (order.shippingInfo?.city || ''),
        cod_amount: order.paymentMethod === 'cod' ? order.total : 0,
        note: \`Order \${order.id.slice(0, 8)}\`
      };

      const res = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': settings.steadfastApiKey,
          'Secret-Key': settings.steadfastSecretKey
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.status === 200) {
        await updateDoc(doc(db, 'orders', order.id), { 
          trackingNumber: data.consignment.tracking_code, 
          courier: 'Steadfast' 
        });
        toast.success('Sent to Steadfast successfully!', { id: tid });
        setViewingOrder(prev => prev ? { ...prev, trackingNumber: data.consignment.tracking_code, courier: 'Steadfast' } : null);
      } else {
        toast.error(data.message || 'Failed to send to Steadfast', { id: tid });
      }
    } catch (err: any) {
      toast.error('Network Error: ' + err.message, { id: tid });
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string, courier: string) => {`;

const trackingFormUI = `                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-3">Courier Tracking Info</p>`;
                  
const steadfastUI = `                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 font-bold uppercase">Courier Tracking Info</p>
                    {settings?.steadfastApiKey && (
                      <button 
                        onClick={() => handleSendToSteadfast(viewingOrder)} 
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 font-bold shadow-sm transition-colors"
                      >
                        Send to Steadfast
                      </button>
                    )}
                  </div>`;

if (!orders.includes('handleSendToSteadfast')) {
    orders = orders.replace(trackingFunction, steadfastFunction);
    orders = orders.replace(trackingFormUI, steadfastUI);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', orders, 'utf8');
    console.log('Added Steadfast Integration to Orders');
}