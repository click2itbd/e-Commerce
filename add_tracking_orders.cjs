const fs = require('fs');
let orders = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', 'utf8');

const trackingLogicTarget = `  const handleUpdateTracking = async (orderId: string, trackingNumber: string, courier: string) => {`;
const trackingLogicNew = `  const handleAddTrackingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingOrder) return;
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const status = formData.get('status') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    const deliveryManName = formData.get('deliveryManName') as string;
    const deliveryManPhone = formData.get('deliveryManPhone') as string;
    
    const update = {
      status,
      location,
      description,
      timestamp: new Date().toISOString(),
      updatedBy: 'Admin',
      deliveryMan: deliveryManName ? { name: deliveryManName, phone: deliveryManPhone } : undefined
    };
    
    const newTimeline = [...(viewingOrder.trackingTimeline || []), update];
    
    try {
      const tid = toast.loading('Adding update...');
      await updateDoc(doc(db, 'orders', viewingOrder.id), { trackingTimeline: newTimeline });
      setViewingOrder({ ...viewingOrder, trackingTimeline: newTimeline });
      
      // Update in main list
      setOrders(orders.map(o => o.id === viewingOrder.id ? { ...o, trackingTimeline: newTimeline } : o));
      
      toast.success('Tracking update added!', { id: tid });
      (e.target as HTMLFormElement).reset();
    } catch(err) {
      toast.error('Failed to add update');
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string, courier: string) => {`;

if (!orders.includes('handleAddTrackingUpdate')) {
    orders = orders.replace(trackingLogicTarget, trackingLogicNew);
}

const trackingUITarget = `                  </form>
                </div>
              </div>`;
const trackingUINew = `                  </form>
                  
                  {/* Detailed Tracking Timeline Form */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-3">Add Detailed Tracking Update (Daraz Style)</p>
                    <form onSubmit={handleAddTrackingUpdate} className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <select name="status" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 font-bold" required>
                          <option value="Packed & Ready">Packed & Ready</option>
                          <option value="Handed to Courier">Handed to Courier</option>
                          <option value="Arrived at Sort Facility">Arrived at Sort Facility</option>
                          <option value="Arrived at Local Hub">Arrived at Local Hub</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivery Failed">Delivery Failed</option>
                        </select>
                        <input type="text" name="location" placeholder="Hub / Location (e.g. Uttara Hub)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" required />
                      </div>
                      <input type="text" name="description" placeholder="Short description (e.g. Package is waiting for delivery rider)" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" required />
                      
                      <div className="flex gap-3 items-center">
                        <input type="text" name="deliveryManName" placeholder="Delivery Man Name (Optional)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" />
                        <input type="text" name="deliveryManPhone" placeholder="Delivery Man Phone (Optional)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" />
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition-colors">+ Add Step</button>
                      </div>
                    </form>

                    {/* Show current timeline */}
                    {viewingOrder.trackingTimeline && viewingOrder.trackingTimeline.length > 0 && (
                      <div className="mt-4 bg-white p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-gray-400 mb-2">Current Timeline Updates:</p>
                        <div className="space-y-2">
                          {[...viewingOrder.trackingTimeline].reverse().map((t, i) => (
                            <div key={i} className="text-xs flex flex-col pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="flex justify-between font-bold">
                                <span className="text-blue-600">{t.status}</span>
                                <span className="text-gray-500">{new Date(t.timestamp).toLocaleString()}</span>
                              </div>
                              <span className="text-gray-700">{t.location} - {t.description}</span>
                              {t.deliveryMan && <span className="text-orange-600 font-bold mt-1">Rider: {t.deliveryMan.name} ({t.deliveryMan.phone})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>`;

if (!orders.includes('Add Detailed Tracking Update')) {
    orders = orders.replace(trackingUITarget, trackingUINew);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceOrders.tsx', orders, 'utf8');
    console.log('Added Detailed Tracking UI to Orders');
} else {
    console.log('Already implemented in Orders');
}