import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, addDoc, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Product, Review } from '../../types';
import { Layout } from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { formatCurrency, cn } from '../../lib/utils';
import { ShoppingCart, Truck, ChevronRight, ChevronDown, GitCompare, Minus, Plus, Share2, Facebook, Twitter, MessageCircle, Star, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCompare } from '../../context/CompareContext';
import { ProductCard } from '../../components/ProductCard';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCompare, isInCompare } = useCompare();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specification' | 'description' | 'warranty' | 'reviews'>('specification');
  const [selectedImage, setSelectedImage] = useState(0);
  const [mainImage, setMainImage] = useState('');
  
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  
  const { addRecentlyViewed, recentlyViewed } = useRecentlyViewed();
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(pData);
          setMainImage(pData.images?.[0] || '');
          addRecentlyViewed(pData);
          
          // Fetch related
          try {
            const q = query(
              collection(db, 'products'),
              where('category', '==', pData.category),
              limit(5)
            );
            const rSnap = await getDocs(q);
            const related = rSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.id !== pData.id)
              .slice(0, 4);
            setRelatedProducts(related);
          } catch(err) {
            console.error('Error fetching related products:', err);
          }

          // Fetch approved reviews
          try {
            const qRev = query(
              collection(db, 'reviews'),
              where('productId', '==', pData.id),
              where('status', '==', 'approved'),
              orderBy('createdAt', 'desc')
            );
            const revSnap = await getDocs(qRev);
            setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
          } catch(err) {
            console.error('Error fetching reviews:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse p-4 container mx-auto">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-5/12 aspect-square bg-gray-200 rounded-lg"></div>
            <div className="w-full md:w-7/12 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <button onClick={() => navigate('/')} className="text-[#EF4444] mt-4 font-bold underline">Go back home</button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    navigate('/cart');
  };

  const displayPrice = product.discountPrice || product.price;
  const sku = product.id.slice(0, 8).toUpperCase();

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewText) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const toastId = toast.loading('Submitting review...');
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        userId: auth.currentUser?.uid || 'guest',
        userName: reviewName,
        rating: reviewRating,
        comment: reviewText,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Thank you! Your review has been submitted for approval.', { id: toastId });
      setIsWritingReview(false);
      setReviewName('');
      setReviewText('');
      setReviewRating(5);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 md:py-6 bg-white md:bg-transparent">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-[#F97316]">Home</Link>
          <ChevronRight size={14} />
          <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-[#F97316] capitalize">{product.category}</Link>
          {product.brand && (
            <>
              <ChevronRight size={14} />
              <span className="text-gray-800">{product.brand}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 bg-white p-0 md:p-6 rounded-none md:rounded-2xl">
          
          {/* Left: Images */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="aspect-square border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4 relative group cursor-crosshair">
              <img
                src={product.images?.[selectedImage] || product.images?.[0] || undefined}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-150"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "w-20 h-20 border rounded-md p-1 flex-shrink-0 transition-all",
                      selectedImage === idx ? "border-[#F97316] shadow-sm" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-7/12 flex flex-col">
            
            {/* Top Bar (Brand & Compare) */}
            <div className="flex justify-between items-start mb-2">
              <div className="font-black text-gray-400 italic uppercase tracking-wider text-xl">
                {product.brand}
              </div>
              <button 
                onClick={() => addToCompare(product)}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors",
                  isInCompare(product.id) ? "text-[#F97316]" : "text-gray-500 hover:text-[#F97316]"
                )}
              >
                <GitCompare size={16} />
                {isInCompare(product.id) ? 'Added to Compare' : 'Add to Compare'}
              </button>
            </div>

            <h1 className="text-2xl md:text-[28px] font-bold text-[#081621] leading-tight mb-2">
              {product.name}
            </h1>
            
            {/* Reviews */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-gray-300">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} />
                ))}
              </div>
              <span 
                onClick={() => {
                  setActiveTab('reviews');
                  window.scrollTo({ top: 700, behavior: 'smooth' });
                }}
                className="text-xs text-blue-600 font-bold underline cursor-pointer hover:text-orange-500"
              >
                {reviews.length} Customer Review{reviews.length !== 1 && 's'}
              </span>
            </div>

            {/* Price & Meta */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-[#EF4444]">{formatCurrency(displayPrice * quantity)}</span>
                  <span className="text-gray-500 font-medium">(Total Price)</span>
                </div>
              
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-bold">Availability:</span> 
                {product.stock > 0 ? (
                  <span className="font-bold text-green-600">Online Order</span>
                ) : (
                  <span className="font-bold text-red-600">Out of Stock</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-bold">Code:</span> SKU-{sku}
              </div>
            </div>

            {/* Key Features */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-[#081621] mb-3">Key Features:</h3>
                <ul className="space-y-2">
                  {Object.entries(product.specs).slice(0, 5).map(([key, value]) => (
                    <li key={key} className="flex gap-2 text-sm text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0"></span>
                      <span className="font-medium text-gray-800">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-bold text-[#081621] mb-3 text-sm">Select Quantity:</h3>
              <div className="flex items-center bg-gray-100 rounded-full w-fit p-1 border border-gray-200">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-800 shadow-sm hover:bg-gray-50 transition-all active:scale-90"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <div className="px-4 text-base font-bold min-w-[3.5rem] text-center text-gray-800">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  disabled={quantity >= product.stock}
                  className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-800 shadow-sm hover:bg-gray-50 transition-all active:scale-90 disabled:opacity-50"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button 
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-[#F97316] text-white py-3.5 rounded-full font-bold hover:bg-[#e06612] transition-all duration-200 disabled:opacity-50 active:scale-95 active:shadow-inner shadow-sm"
              >
                Shop Now
              </button>
              <button 
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-white border border-gray-300 text-gray-800 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 hover:border-[#081621] hover:text-[#081621] hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 active:scale-95 active:bg-gray-100"
              >
                <ShoppingCart size={18} />
                Add To Cart
              </button>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 p-3 rounded-md flex items-center text-sm font-bold text-green-700 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => window.open('https://wa.me/1234567890', '_blank')}>
                <img src="https://img.icons8.com/color/48/whatsapp--v1.png" className="w-5 h-5 mr-2" alt="whatsapp" />
                Order via Whatsapp
              </div>
            </div>

            {/* Delivery Estimate & Guarantee */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl mt-6 mb-6 shadow-sm overflow-hidden">
               <details className="group">
                 <summary className="flex gap-4 items-center p-5 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                     <Truck className="w-5 h-5 text-emerald-600" />
                   </div>
                   <p className="text-sm font-bold text-gray-900">Estimated Delivery</p>
                   <ChevronDown className="w-5 h-5 text-gray-400 ml-auto transition-transform duration-300 group-open:rotate-180" />
                 </summary>
                 
                 <div className="px-5 pb-5 pt-1 space-y-4">
                   <div className="w-full">
                     <div className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg mb-2">
                       <span className="text-xs font-semibold text-gray-700">Inside Dhaka:</span>
                       <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                         {new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(Date.now() + 86400000 * 2))}
                       </span>
                     </div>
                     <div className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg">
                       <span className="text-xs font-semibold text-gray-700">Outside Dhaka:</span>
                       <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                         {new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(Date.now() + 86400000 * 4))}
                       </span>
                     </div>
                   </div>
                   
                   <div className="h-px bg-gray-100"></div>
                   
                   <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                       <ShieldCheck className="w-5 h-5 text-blue-600" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900">
                         {product.warrantyMonths ? `${product.warrantyMonths} Months Official Warranty` : '7 Days Replacement Warranty'}
                       </p>
                       <p className="text-xs text-gray-500">100% Authentic Brand Guarantee</p>
                     </div>
                   </div>
                 </div>
               </details>
            </div>
            
            {/* Share */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Share2 size={16}/> Share:</span>
              <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)} className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors" title="Facebook">
                <Facebook size={14} />
              </button>
              <button onClick={() => window.open(`fb-messenger://share/?link=${window.location.href}`)} className="w-8 h-8 rounded-full bg-[#00B2FF]/10 text-[#00B2FF] flex items-center justify-center hover:bg-[#00B2FF] hover:text-white transition-colors" title="Messenger">
                <img src="https://img.icons8.com/color/48/facebook-messenger--v1.png" className="w-4 h-4 hover:brightness-0 hover:invert" alt="messenger" />
              </button>
              <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${window.location.href}`)} className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors" title="WhatsApp">
                <img src="https://img.icons8.com/color/48/whatsapp--v1.png" className="w-4 h-4 hover:brightness-0 hover:invert" alt="whatsapp" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Area (Tabs & Sidebar) */}
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          
          {/* Left Content (Tabs) */}
          <div className="w-full lg:w-3/4">
            
            {/* Tabs Header */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setActiveTab('specification')}
                className={cn(
                  "px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'specification' 
                    ? "bg-[#F97316] text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]"
                )}
              >
                Specification
              </button>
              <button
                onClick={() => setActiveTab('description')}
                className={cn(
                  "px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'description' 
                    ? "bg-[#F97316] text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]"
                )}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('warranty')}
                className={cn(
                  "px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'warranty' 
                    ? "bg-[#F97316] text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]"
                )}
              >
                Warranty
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  "px-6 py-2 rounded-md font-bold text-sm transition-all whitespace-nowrap",
                  activeTab === 'reviews' 
                    ? "bg-[#F97316] text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]"
                )}
              >
                Reviews
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white p-0 md:p-6 rounded-2xl">
              
              {activeTab === 'specification' && (
                <div>
                  <h3 className="text-xl font-bold text-[#081621] mb-4">Specification</h3>
                  {product.specs && Object.keys(product.specs).length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {Object.entries(product.specs).map(([key, value], i) => (
                        <div key={key} className={cn(
                          "grid grid-cols-1 sm:grid-cols-3 p-4 text-sm border-b border-gray-200 last:border-0",
                          i % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}>
                          <div className="font-bold text-gray-600">{key}</div>
                          <div className="sm:col-span-2 text-[#081621]">{value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No specifications available.</p>
                  )}
                </div>
              )}

              {activeTab === 'description' && (
                <div>
                  <h3 className="text-xl font-bold text-[#081621] mb-4">Descriptions</h3>
                  <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                  <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                    {product.description || 'No detailed description available.'}
                  </p>
                </div>
              )}

              {activeTab === 'warranty' && (
                <div>
                  <h3 className="text-xl font-bold text-[#081621] mb-4">Warranty</h3>
                  <p className="font-bold text-sm text-gray-800">
                    {product.warrantyMonths ? `${product.warrantyMonths} Months Warranty` : 'No Warranty'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Explore our <Link to="/warranty-policy" className="text-[#F97316] underline">Warranty Policy</Link> page for detailed information about our warranty coverage.</p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h3 className="text-xl font-bold text-[#081621]">Customer Reviews</h3>
                    {!isWritingReview && (
                      <button 
                        onClick={() => setIsWritingReview(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                  
                  {!isWritingReview ? (
                    <div>
                      {reviews.length > 0 ? (
                        <div className="space-y-6">
                          {reviews.map(review => (
                            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-[#081621]">{review.userName}</h4>
                                  <div className="flex text-orange-500 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />
                                    ))}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="flex justify-center text-gray-300 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={40} />
                            ))}
                          </div>
                          <p className="text-gray-500 mb-2">No reviews have been submitted for this product yet.</p>
                          <button 
                            onClick={() => setIsWritingReview(true)}
                            className="text-[#F97316] font-bold text-sm hover:underline"
                          >
                            Be the first to write a review!
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-2xl mx-auto animate-fade-in-up">
                      <h4 className="font-bold text-lg mb-4 text-[#081621]">Write a Review</h4>
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Your Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className={`focus:outline-none transition-colors ${reviewRating >= star ? 'text-orange-500' : 'text-gray-300 hover:text-orange-300'}`}
                              >
                                <Star size={28} fill={reviewRating >= star ? "currentColor" : "none"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                          <input 
                            type="text" 
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Review</label>
                          <textarea 
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500 resize-none"
                            required
                          ></textarea>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button 
                            type="submit" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md transition-colors"
                          >
                            Submit Review
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsWritingReview(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-6 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Check Similar Product Links */}
            <div className="mt-8 bg-white p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-[#081621] mb-4">Check Similar Product Price</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#F97316]">
                {recentlyViewed.slice(0, 3).map(p => (
                  <li key={p.id}><Link to={`/product/${p.id}`} className="hover:underline">{p.name}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Sidebar (Recently Viewed) */}
          <div className="w-full lg:w-1/4">
            <h3 className="text-xl font-bold text-[#081621] mb-6">Recently Viewed</h3>
            <div className="flex flex-col gap-4">
              {recentlyViewed.map(item => (
                <Link 
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-lg p-1 shrink-0">
                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#081621] line-clamp-2 group-hover:text-[#F97316] transition-colors">{item.name}</span>
                    <span className="text-xs font-bold text-gray-600 mt-1">{formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Promotional Banner */}
        <div className="mt-16 mb-8 relative rounded-3xl overflow-hidden shadow-2xl group min-h-[280px] flex items-center">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1610812389658-0639d675bda0?q=80&w=2000&auto=format&fit=crop" 
              alt="Build PC" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 md:hidden"></div>
          </div>
          
          <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs mb-4 uppercase tracking-wider backdrop-blur-sm">
                Custom PC Builder
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                Build Your Dream <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">PC Today</span>
              </h3>
              <p className="text-gray-300 mb-8 max-w-md text-sm md:text-base">
                Design the ultimate gaming or workstation rig. Use our intelligent PC builder to ensure 100% component compatibility.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/pc-builder" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all transform hover:-translate-y-0.5">
                  Start Building <ChevronRight size={18} />
                </Link>
                <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
                  Gaming â€¢ Components â€¢ Accessories
                </span>
              </div>
            </div>
            
            <div className="hidden lg:block relative z-10">
              <div className="w-56 h-56 rounded-full border-2 border-orange-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-orange-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex flex-col items-center justify-center border border-gray-700 shadow-2xl overflow-hidden">
                   <div className="text-orange-500 font-black text-3xl mb-1 tracking-tighter">CLICK2IT</div>
                   <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">PC Builder</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-[#081621] mb-6">Related Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
        
        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-12 mb-8 border-t border-gray-200 pt-8">
            <h3 className="text-xl md:text-2xl font-bold text-[#081621] mb-6">Recently Viewed</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recentlyViewed.slice(0, 5).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Cart (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50 lg:hidden flex items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded border hidden sm:block shrink-0">
             <img src={product.images?.[0]} className="w-full h-full object-contain mix-blend-multiply p-1" alt=""/>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
            <p className="text-sm font-black text-[#EF4444]">{formatCurrency(displayPrice)}</p>
          </div>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 whitespace-nowrap shadow-lg text-sm"
        >
          Buy Now
        </button>
      </div>

    </Layout>
  );
};


