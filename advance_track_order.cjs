const fs = require('fs');
let track = fs.readFileSync('src/pages/shop/TrackOrder.tsx', 'utf8');

const importTarget = `import { useSettings } from '../../context/SettingsContext';`;
const importNew = `import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight } from 'lucide-react';`;

if (!track.includes('useAuth')) {
    track = track.replace(importTarget, importNew);
}

const hookTarget = `export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');`;
  
const hookNew = `export default function TrackOrder() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState('');`;

if (!track.includes('recentOrders')) {
    track = track.replace(hookTarget, hookNew);
}

const effectTarget = `  useEffect(() => {
    const id = searchParams.get('id');`;
    
const effectNew = `  useEffect(() => {
    if (user) {
      const fetchRecent = async () => {
        try {
          const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
          // Filter active orders and sort
          const active = orders
            .filter(o => o.status !== 'cancelled' && o.status !== 'delivered')
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          setRecentOrders(active);
        } catch (err) {}
      };
      fetchRecent();
    }
  }, [user]);

  useEffect(() => {
    const id = searchParams.get('id');`;

if (!track.includes('fetchRecent')) {
    track = track.replace(effectTarget, effectNew);
}


// UI Changes
const titleTarget = `          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-500 mb-12 text-lg">Enter your Order ID to see real-time updates.</p>`;

const titleNew = `          <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center animate-in zoom-in duration-700">
            {/* Background glowing circle */}
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            {/* 3D Illustration / Graphic */}
            <img 
              src="https://cdn-icons-png.flaticon.com/512/8206/8206253.png" 
              alt="Track Delivery" 
              className="w-full h-full object-contain relative z-10 hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-500 mb-12 text-lg">Enter your Order ID or Invoice Number to see live updates.</p>`;

if (!track.includes('8206253.png')) {
    track = track.replace(titleTarget, titleNew);
}


const recentOrdersTarget = `            </button>
          </form>

          {error && (`;

const recentOrdersNew = `            </button>
          </form>

          {/* Quick Access for Logged In Users */}
          {!order && recentOrders.length > 0 && (
            <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Active Orders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentOrders.map(ro => (
                  <button 
                    key={ro.id}
                    onClick={() => {
                      setOrderId(ro.invoiceNumber || ro.id);
                      setOrder(ro);
                    }}
                    className="flex flex-col bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all p-4 rounded-xl text-left group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900">{ro.invoiceNumber || ro.id.slice(0,8)}</span>
                      <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-full capitalize">{ro.status}</span>
                    </div>
                    <span className="text-sm text-gray-500 mb-3">{new Date(ro.createdAt).toLocaleDateString()}</span>
                    <div className="mt-auto flex items-center justify-between text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                      Track Now <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (`;

if (!track.includes('Your Active Orders')) {
    track = track.replace(recentOrdersTarget, recentOrdersNew);
}


fs.writeFileSync('src/pages/shop/TrackOrder.tsx', track, 'utf8');
console.log('Advanced TrackOrder UI injected');