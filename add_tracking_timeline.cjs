const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const uiTarget = `            {order.status === 'cancelled' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Order Cancelled</h3>
                <p className="text-gray-500 mt-2">This order has been cancelled.</p>
              </div>
            ) : (`;

const uiNew = `            {order.status === 'cancelled' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Order Cancelled</h3>
                <p className="text-gray-500 mt-2">This order has been cancelled.</p>
              </div>
            ) : order.trackingTimeline && order.trackingTimeline.length > 0 ? (
              <div className="mb-12 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package size={24} className="text-blue-500" /> Live Tracking Timeline
                </h3>
                
                <div className="relative border-l-2 border-blue-200 ml-4 space-y-8 pb-4">
                  {/* Show static "Order Placed" step first */}
                  <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">Order Placed</span>
                      <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Dynamic Steps */}
                  {[...order.trackingTimeline].map((t, i) => {
                    const isLast = i === order.trackingTimeline.length - 1;
                    return (
                      <div key={i} className="relative pl-8 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: \`\${i * 100}ms\` }}>
                        <div className={\`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow \${isLast && order.status !== 'delivered' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}\`}></div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                          {/* Triangle pointer */}
                          <div className="absolute top-2 -left-2 w-4 h-4 bg-gray-50 border-l border-t border-gray-100 transform -rotate-45"></div>
                          
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-black text-gray-900 text-lg">{t.status}</span>
                            <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-200">{new Date(t.timestamp).toLocaleString()}</span>
                          </div>
                          
                          {t.location && (
                            <div className="flex items-center gap-1 text-blue-600 font-medium text-sm mb-2">
                              <MapPin size={14} /> {t.location}
                            </div>
                          )}
                          
                          <p className="text-gray-600 text-sm">{t.description}</p>
                          
                          {t.deliveryMan && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Truck size={20} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Delivery Rider</p>
                                <p className="font-bold text-gray-900">{t.deliveryMan.name} <span className="text-orange-600 ml-1">({t.deliveryMan.phone})</span></p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (`;

if (!track.includes('Live Tracking Timeline')) {
    track = track.replace(uiTarget, uiNew);
    fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
    console.log('Updated TrackOrder.tsx with detailed timeline');
} else {
    console.log('Already implemented in TrackOrder');
}