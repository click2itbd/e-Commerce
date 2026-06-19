import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Review, DiscountCode } from '../types';
import { Layout } from '../components/Layout';
import { useCart } from '../context/CartContext';
import { ReviewWidget } from '../components/ReviewWidget';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingCart, ShieldCheck, Truck, RotateCcw, Star, MessageSquare, User, Ticket, GitCompare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCompare } from '../context/CompareContext';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCompare, isInCompare } = useCompare();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Fetch Reviews
    if (id) {
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
        setReviews(reviewsData);
      });
      return () => unsubscribe();
    }
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous',
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString()
      });
      setNewComment('');
      setNewRating(5);
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const q = query(
        collection(db, 'discountCodes'),
        where('code', '==', discountCode.toUpperCase()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('Invalid or inactive discount code');
        setAppliedDiscount(null);
      } else {
        const data = querySnapshot.docs[0].data() as DiscountCode;
        const expiryDate = new Date(data.expiryDate);
        if (expiryDate < new Date()) {
          toast.error('This discount code has expired');
          setAppliedDiscount(null);
        } else {
          setAppliedDiscount({ id: querySnapshot.docs[0].id, ...data });
          toast.success(`Discount applied: ${data.discountPercentage}% off!`);
        }
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const discountedPrice = appliedDiscount 
    ? product.price * (1 - appliedDiscount.discountPercentage / 100)
    : product.price;

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 aspect-square bg-white rounded-lg"></div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-8 bg-white rounded w-3/4"></div>
            <div className="h-4 bg-white rounded w-1/4"></div>
            <div className="h-32 bg-white rounded w-full"></div>
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-8">
              <img
                src={product.images?.[0] || undefined}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[#081621] leading-tight">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                <span className={cn(
                  "text-xs font-bold uppercase",
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Stock Out'}
                </span>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
                        return (
                          <Star
                            key={star}
                            size={14}
                            className={cn(
                              star <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                            )}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">({reviews.length} Reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              {appliedDiscount ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[#EF4444]">
                    {formatCurrency(discountedPrice)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                    {appliedDiscount.discountPercentage}% OFF
                  </span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-[#EF4444]">
                  {formatCurrency(product.price)}
                </div>
              )}
            </div>

            {/* Discount Code Input */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase">Have a discount code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] text-sm font-bold"
                  />
                </div>
                <button
                  onClick={handleApplyDiscount}
                  disabled={isApplyingDiscount}
                  className="bg-[#081621] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isApplyingDiscount ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {appliedDiscount && (
                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <Ticket size={12} /> Code "{appliedDiscount.code}" applied!
                </p>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">
              {product.description || 'No description available for this product.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="text-[#EF4444]" size={20} />
                <span>Official Warranty</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="text-[#EF4444]" size={20} />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RotateCcw className="text-[#EF4444]" size={20} />
                <span>Easy Returns</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => { 
                  const productToCart = appliedDiscount 
                    ? { ...product, price: discountedPrice } 
                    : product;
                  addToCart(productToCart); 
                  toast.success('Added to cart!'); 
                }}
                disabled={product.stock <= 0}
                className="flex-1 bg-[#EF4444] text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                onClick={() => addToCompare(product!)}
                className={cn(
                  "px-6 py-4 rounded-md font-bold flex items-center justify-center gap-2 transition-all border",
                  isInCompare(product!.id)
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-200 hover:text-blue-600"
                )}
              >
                <GitCompare size={20} />
                {isInCompare(product!.id) ? 'Selected for Compare' : 'Add to Compare'}
              </button>
              <button 
                onClick={() => {
                  const productToCart = appliedDiscount 
                    ? { ...product, price: discountedPrice } 
                    : product;
                  addToCart(productToCart);
                  navigate('/cart');
                }}
                disabled={product.stock <= 0}
                className="flex-1 bg-[#081621] text-white py-4 rounded-md font-bold hover:bg-black transition-all"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-[#081621] mb-6 pb-2 border-b-2 border-[#EF4444] w-fit">Specification</h2>
            <div className="grid grid-cols-1 border border-gray-100 rounded-lg overflow-hidden">
              {Object.entries(product.specs).map(([key, value], i) => (
                <div key={key} className={cn(
                  "grid grid-cols-3 p-4 text-sm",
                  i % 2 === 0 ? "bg-gray-50" : "bg-white"
                )}>
                  <span className="font-bold text-gray-600 uppercase text-xs">{key}</span>
                  <span className="col-span-2 text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-[#081621] mb-6 pb-2 border-b-2 border-[#EF4444] w-fit">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="font-bold text-[#081621] mb-4">Write a Review</h3>
                {auth.currentUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={24}
                              className={cn(
                                "transition-colors",
                                star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Comment</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] min-h-[120px] text-sm"
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-[#081621] text-white py-3 rounded-md font-bold hover:bg-[#EF4444] transition-all disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-4">Please login to write a review.</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-[#EF4444] font-bold text-sm hover:underline"
                    >
                      Login Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#081621]">{review.userName}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={cn(
                              star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-10">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ReviewWidget />
      </div>
    </Layout>
  );
};
