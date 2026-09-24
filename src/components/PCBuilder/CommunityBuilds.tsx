import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Layout } from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Users, ThumbsUp, Calendar, Cpu, Monitor, Zap, Flame, Trophy, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const getBuildTier = (price: number) => {
  if (price < 40000) return { label: 'Budget Build', color: 'bg-green-100 text-green-700', icon: <Zap size={14} /> };
  if (price < 100000) return { label: 'Mid-Range', color: 'bg-blue-100 text-blue-700', icon: <Monitor size={14} /> };
  if (price < 200000) return { label: 'High-End', color: 'bg-purple-100 text-purple-700', icon: <Flame size={14} /> };
  return { label: 'Enthusiast', color: 'bg-rose-100 text-rose-700', icon: <Trophy size={14} /> };
};

export const CommunityBuilds: React.FC = () => {
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('latest'); // latest, popular, budget, high-end
  const [search, setSearch] = useState('');
  const [upvotedBuilds, setUpvotedBuilds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        let q = query(collection(db, 'community_builds'), orderBy('createdAt', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedBuilds = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBuilds(fetchedBuilds);
      } catch (err) {
        console.error("Error fetching community builds:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuilds();
  }, []);

  const handleUpvote = async (buildId: string, currentUpvotes: number) => {
    if (upvotedBuilds.has(buildId)) {
      toast.error('You already upvoted this build!');
      return;
    }

    try {
      // Optimistic UI update
      setUpvotedBuilds(new Set([...Array.from(upvotedBuilds), buildId]));
      setBuilds(prev => prev.map(b => b.id === buildId ? { ...b, upvotes: (b.upvotes || 0) + 1 } : b));
      
      const buildRef = doc(db, 'community_builds', buildId);
      await updateDoc(buildRef, {
        upvotes: increment(1)
      });
      toast.success('Thanks for voting!', { icon: '??' });
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  // Filter and sort logic
  const filteredBuilds = builds.filter(b => {
    if (search && !b.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'budget' && b.totalPrice >= 60000) return false;
    if (filter === 'high-end' && b.totalPrice < 100000) return false;
    return true;
  }).sort((a, b) => {
    if (filter === 'popular') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0; // 'latest' is already sorted from Firebase, 'budget'/'high-end' keep latest order
  });

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-[#0E2A47] overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-600/30 to-transparent blur-3xl rounded-full translate-x-1/2"></div>
        <div className="container mx-auto px-2 sm:px-4 max-w-7xl py-16 md:py-24 relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-blue-400/30 backdrop-blur-sm">
              <Users size={40} />
            </motion.div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Builds</span>
            </motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-blue-100/80 text-lg md:text-xl max-w-2xl font-medium">
              Explore the most epic PC configurations created by our community. Discover, get inspired, and share your ultimate dream setup.
            </motion.p>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search builds by name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {[
                { id: 'latest', label: 'Latest' },
                { id: 'popular', label: 'Most Popular' },
                { id: 'budget', label: 'Budget' },
                { id: 'high-end', label: 'High-End' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    filter === f.id 
                    ? 'bg-[#0E2A47] text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Builds Grid */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
              <p className="text-slate-500 font-medium animate-pulse">Loading amazing builds...</p>
            </div>
          ) : filteredBuilds.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu size={48} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">No Builds Found</h3>
              <p className="text-slate-500 text-lg">We couldn't find any builds matching your criteria. Try adjusting your filters!</p>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredBuilds.map((build, idx) => {
                  const tier = getBuildTier(build.totalPrice || 0);
                  // Extract key parts for highlights
                  const processor = build.components?.processor?.name;
                  const gpu = build.components?.graphicsCard?.name;

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={build.id} 
                      className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 overflow-hidden transition-all flex flex-col h-full"
                    >
                      <div className="p-6 pb-4 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                              {build.name || 'Untitled Masterpiece'}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${tier.color}`}>
                              {tier.icon} {tier.label}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Build</span>
                            <span className="block bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap shadow-sm">
                              ? {build.totalPrice?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-blue-500" /> {build.author || 'Anonymous Builder'}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                          {build.createdAt && (
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-emerald-500" /> 
                              {new Date(build.createdAt?.toDate ? build.createdAt.toDate() : build.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Specs Highlight */}
                        <div className="mt-5 space-y-3">
                          {processor && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                <Cpu size={16} className="text-indigo-500" />
                              </div>
                              <div className="text-sm font-semibold text-slate-700 line-clamp-1">{processor}</div>
                            </div>
                          )}
                          {gpu && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                <Monitor size={16} className="text-orange-500" />
                              </div>
                              <div className="text-sm font-semibold text-slate-700 line-clamp-1">{gpu}</div>
                            </div>
                          )}
                        </div>
                        
                        {Object.keys(build.components || {}).length > (processor && gpu ? 2 : 0) && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">
                              Includes {Object.keys(build.components || {}).length} selected components total (RAM, Motherboard, Storage, etc.)
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center mt-auto">
                        <button 
                          onClick={() => handleUpvote(build.id, build.upvotes || 0)}
                          disabled={upvotedBuilds.has(build.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            upvotedBuilds.has(build.id)
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 shadow-sm hover:shadow'
                          }`}
                        >
                          <Flame size={18} className={upvotedBuilds.has(build.id) ? 'fill-current' : ''} />
                          {build.upvotes || 0}
                        </button>
                        
                        <button 
                          onClick={() => {
                             const params = Object.entries(build.components || {})
                               .filter(([_, item]: any) => item != null)
                               .map(([cat, item]: any) => `${cat}:${item.id}`)
                               .join(',');
                             const encoded = btoa(params);
                             window.location.href = `/pc-build?build=${encoded}`;
                          }}
                          className="px-6 py-2 bg-[#0E2A47] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                          View Full Build
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

