import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';

export default function ReviewSection() {
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rewardCode, setRewardCode] = useState(null);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkIfReviewed();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkIfReviewed = async () => {
    try {
      const q = query(collection(db, 'reviews'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setHasReviewed(!snap.empty);
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const generateReward = async () => {
    // Only generate if setting is enabled
    const rewardSettings = settings || {};
    if (!rewardSettings.reviewRewardEnabled) return null;

    const discountPercentage = rewardSettings.reviewRewardPercentage || 10;
    const code = `REV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days valid

    try {
      await addDoc(collection(db, 'couponCodes'), {
        code,
        discountPercentage,
        expiryDate: expiryDate.toISOString(),
        isActive: true,
        maxUses: 1, // Only usable once
        userId: user.uid, // Tie to this user
        createdAt: new Date().toISOString()
      });
      return { code, discountPercentage };
    } catch (err) {
      console.error('Error creating reward code:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmitting(true);
    try {
      // Add Review
      await addDoc(collection(db, 'reviews'), {
        productId: 'site',
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating,
        comment,
        createdAt: new Date().toISOString()
      });

      toast.success('Thank you for your review!');
      
      // Handle Reward
      if (!hasReviewed) {
        const reward = await generateReward();
        if (reward) {
          setRewardCode(reward);
        }
      }

      setHasReviewed(true);
      fetchReviews();
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
          <p className="text-lg text-gray-600">
            Real feedback from businesses that trust us with their hosting and digital presence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No reviews yet. Be the first to leave one!</p>
              </div>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{rev.userName}</h4>
                      <p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h3>
              
              {rewardCode ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                  <h4 className="text-green-800 font-bold mb-1">🎉 Surprise Reward!</h4>
                  <p className="text-sm text-green-700 mb-3">Thank you for your first review! Here's a special {rewardCode.discountPercentage}% discount code for your next purchase:</p>
                  <div className="bg-white border border-green-300 text-center font-mono font-bold text-lg py-2 rounded text-green-900">
                    {rewardCode.code}
                  </div>
                  <p className="text-xs text-green-600 text-center mt-2">Valid for 30 days. Single use only.</p>
                </div>
              ) : hasReviewed ? (
                <div className="text-center py-8">
                  <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 fill-current" />
                  </div>
                  <p className="font-medium text-gray-900">You've already reviewed.</p>
                  <p className="text-sm text-gray-500">Thank you for your feedback!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star 
                            size={24} 
                            className={(hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with our services..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !user}
                    className="w-full bg-[#0a1628] text-white py-3 rounded-lg font-bold hover:bg-[#1a2b42] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : user ? 'Submit Review' : 'Login to Review'}
                  </button>
                  
                  {!user && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      You must be logged in to leave a review.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
