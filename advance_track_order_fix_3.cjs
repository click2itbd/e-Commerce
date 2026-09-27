const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const recentOrdersRegex = /<\/form>\s*\{error && \(/;
const recentOrdersNew = `</form>
            
            {/* Quick Access for Logged In Users */}
            {!order && recentOrders.length > 0 && (
              <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Your Active Orders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recentOrders.map(ro => (
                    <button 
                      key={ro.id}
                      onClick={() => {
                        setOrderId(ro.invoiceNumber || ro.id);
                        setOrder(ro);
                      }}
                      className="flex flex-col bg-gray-50 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all p-4 rounded-xl text-left group"
                    >
                      <div className="flex justify-between items-start mb-2 w-full">
                        <span className="font-bold text-gray-900 truncate pr-2">#{ro.invoiceNumber || ro.id.slice(0,8)}</span>
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0">{ro.status}</span>
                      </div>
                      <span className="text-xs text-gray-500 mb-3">{new Date(ro.createdAt).toLocaleDateString()}</span>
                      <div className="mt-auto flex items-center justify-between text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform w-full">
                        Track Now <ChevronRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {error && (`;

if (recentOrdersRegex.test(track) && !track.includes('Your Active Orders')) {
    track = track.replace(recentOrdersRegex, recentOrdersNew);
    console.log('Recent orders replaced successfully!');
}

fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');