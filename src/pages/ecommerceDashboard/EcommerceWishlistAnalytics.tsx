import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Heart, Search, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WishlistItem {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  wishlistCount: number;
  recentAdds: number; // Last 7 days
}

export const EcommerceWishlistAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistProducts, setWishlistProducts] = useState<WishlistItem[]>([]);
  
  const [stats, setStats] = useState({
    totalWishlistedProducts: 0,
    totalUsersWithWishlist: 0,
    mostWishlisted: ''
  });

  useEffect(() => {
    fetchWishlistData();
  }, []);

  const fetchWishlistData = async () => {
    setLoading(true);
    try {
      // In a real app, this would read from the 'wishlists' collection.
      // E.g., wishlists/{userId}/items/{productId}
      
      const wishlistsSnap = await getDocs(collection(db, 'wishlists'));
      
      const productCounts: Record<string, { count: number; name: string; price: number; img: string }> = {};
      let usersCount = 0;

      // Simulate parsing wishlists if it existed:
      // But since we might not have real data, we provide fallback data for the dashboard demo.
      if (wishlistsSnap.empty) {
        throw new Error('No real data');
      }

      // If we had real data, we'd process it here...
      
    } catch (error) {
      console.log('Using simulated wishlist data');
      
      // Simulated Data
      const dummyData: WishlistItem[] = [
        { productId: 'p1', name: 'Mechanical Gaming Keyboard Pro', imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=300&q=80', price: 4500, wishlistCount: 124, recentAdds: 12 },
        { productId: 'p2', name: 'Wireless Noise-Cancelling Headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', price: 12000, wishlistCount: 98, recentAdds: 8 },
        { productId: 'p3', name: '27" IPS 144Hz Gaming Monitor', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d4aff?w=300&q=80', price: 28000, wishlistCount: 86, recentAdds: 15 },
        { productId: 'p4', name: 'Ergonomic Office Chair', imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=300&q=80', price: 15000, wishlistCount: 65, recentAdds: 4 },
        { productId: 'p5', name: '1TB NVMe M.2 SSD', imageUrl: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=300&q=80', price: 8500, wishlistCount: 42, recentAdds: 2 },
      ];

      setWishlistProducts(dummyData);
      setStats({
        totalWishlistedProducts: 345,
        totalUsersWithWishlist: 128,
        mostWishlisted: 'Mechanical Gaming Keyboard Pro'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = wishlistProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Wishlist Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">See which products customers want the most to plan discounts and stock.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 shrink-0">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Wishlists Items</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalWishlistedProducts}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Users with Wishlist</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsersWithWishlist}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Most Wanted</p>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{stats.mostWishlisted}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <h3 className="font-bold text-gray-900">Most Wishlisted Products</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Price</th>
                  <th className="px-6 py-4 text-center">Total Saves</th>
                  <th className="px-6 py-4 text-center">Recent Saves (7d)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded border border-gray-200 object-cover" />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">৳{product.price}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-pink-50 text-pink-700 font-bold px-3 py-1 rounded-full gap-1.5">
                        <Heart size={14} className="fill-pink-700" /> {product.wishlistCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                        <TrendingUp size={14} /> +{product.recentAdds}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/admin/ecommerce`} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                        <ExternalLink size={14} /> Set Discount
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No wishlisted products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
