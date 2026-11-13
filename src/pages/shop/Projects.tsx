import React, { useState, useEffect, useMemo } from 'react';
import { getDocs, query, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import {
  X,
  Loader2,
  Camera,
  Briefcase,
  Monitor,
  Server,
  Shield,
  Home,
  Cpu,
  Wifi,
  Building2,
  Award,
  Globe,
  Code2,
  ShoppingBag,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { Layout } from '../../components/Layout';

const Icons: Record<string, any> = {
  Camera,
  Briefcase,
  Monitor,
  Server,
  Shield,
  Home,
  Cpu,
  Wifi,
  Building2,
  Award,
  Globe,
  Code2,
  ShoppingBag,
};

const QuoteModal = ({
  isOpen,
  onClose,
  defaultProjectType = 'CCTV Setup',
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectType?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    projectType: defaultProjectType,
    details: '',
  });

  useEffect(() => {
    if (defaultProjectType) {
      setFormData(prev => ({ ...prev, projectType: defaultProjectType }));
    }
  }, [defaultProjectType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'quote_requests'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast.success('Your quote request has been submitted successfully! We will contact you soon.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Left Side - Info & Illustration */}
        <div className="md:w-5/12 bg-slate-50 p-8 md:p-10 flex flex-col justify-between border-r border-slate-100 hidden md:flex">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Briefcase size={24} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
              Let's Build Something Great Together
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Whether you need a complete corporate network setup, advanced CCTV surveillance, or a batch of custom workstations, our enterprise team is ready to assist you.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield size={12} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Expert Consultation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Free requirement analysis by certified engineers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Monitor size={12} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Customized Solutions</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Tailored hardware to match your exact budget & needs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500 italic text-center">
              "Click2IT delivered our entire 3-story office setup ahead of schedule with zero downtime."
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-7/12 p-5 sm:p-8 md:p-10 bg-white max-h-[90dvh] overflow-y-auto custom-scrollbar">
          <div className="mb-5 sm:mb-8 pr-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5 sm:mb-2">Request a Quote</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              Fill out the form below and we will get back to you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                Primary Project Type
              </label>
              <select
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 cursor-pointer"
                value={formData.projectType}
                onChange={e => setFormData({ ...formData, projectType: e.target.value })}
              >
                <option value="Website & Web Development">Website & E-Commerce Development</option>
                <option value="Custom Software / ERP">Custom Software / Web Application</option>
                <option value="CCTV Setup">CCTV & Security Surveillance</option>
                <option value="Office Networking">Corporate Office Networking</option>
                <option value="Bulk Workstations">Bulk Workstations / PC Build</option>
                <option value="Server Setup">Server Room Deployment</option>
                <option value="Smart Home">Smart Home Automation</option>
                <option value="Other">Other / Custom Requirement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 sm:mb-2">
                Project Details & Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your requirements (e.g., We need 16 IP cameras for a 2-story building, including NVR and installation...)"
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none custom-scrollbar"
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
              />
            </div>

            <div className="pt-1 sm:pt-2">
              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/30 cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Quote Request'}
              </button>
              <p className="text-center text-[11px] sm:text-xs text-slate-400 mt-3 sm:mt-4">
                By submitting, you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteType, setSelectedQuoteType] = useState('CCTV Setup');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProjectModal, setActiveProjectModal] = useState<any | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'showcase_projects'), orderBy('createdAt', 'desc')));
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.isActive !== false)
          .sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        setProjects(all);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    projects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  const visibleProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter(p => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <Layout fullWidth>
      <div className="bg-slate-50 min-h-screen py-5 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-2.5 sm:mb-4">
              <Award size={12} className="text-blue-600" />
              Enterprise &amp; IT Solutions
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-2.5 sm:mb-4 tracking-tight leading-tight">
              Our Successful Projects
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Take a look at some of the key solutions we have delivered for our corporate clients, agencies, and individual customers. From complex CCTV installations to complete office workstation setups, we provide end-to-end IT infrastructure.
            </p>
          </div>

          {/* Category Filter Pills (horizontal scroll on mobile, centered wrap on tablet/desktop) */}
          {categories.length > 2 && (
            <div className="flex items-center sm:justify-center gap-2 overflow-x-auto sm:flex-wrap pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 mb-5 sm:mb-10 no-scrollbar">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
            {visibleProjects.map(project => (
              <div
                key={project.id}
                onClick={() => {
                  setActiveProjectModal(project);
                  setActivePhotoUrl(project.image);
                }}
                className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border group flex flex-col cursor-pointer ${
                  project.isFeatured ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="relative aspect-[4/3] sm:aspect-auto sm:h-48 overflow-hidden bg-slate-100">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 max-w-[56%] sm:max-w-[60%] bg-white/95 backdrop-blur-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold text-slate-900 flex items-center gap-1 sm:gap-1.5 shadow-xs">
                    {(() => {
                      const Icon = Icons[project.iconName] || Briefcase;
                      return <Icon size={12} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 shrink-0" />;
                    })()}
                    <span className="truncate">{project.category}</span>
                  </div>
                  {project.isFeatured && (
                    <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-amber-400 text-slate-950 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[10px] font-black flex items-center gap-0.5 sm:gap-1 shadow-xs">
                      <Star size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-slate-950" /> FEATURED
                    </div>
                  )}
                  {(project.location || project.duration) && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-3 sm:right-3 flex items-center justify-between text-white/95 text-[9px] sm:text-[11px] font-medium gap-1 sm:gap-2">
                      {project.location && (
                        <span className="flex items-center gap-0.5 sm:gap-1 min-w-0 max-w-[62%] sm:max-w-[60%]">
                          <MapPin size={10} className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </span>
                      )}
                      {project.duration && (
                        <span className="flex items-center gap-0.5 sm:gap-1 bg-black/50 backdrop-blur-[2px] px-1.5 py-0.5 sm:px-2 rounded-full text-[8px] sm:text-[10px] ml-auto shrink-0 whitespace-nowrap">
                          <Clock size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" /> {project.duration}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2.5 sm:p-5 flex flex-col flex-grow">
                  {project.client && (
                    <div className="mb-0.5 sm:mb-1 text-[9px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider line-clamp-1">
                      {project.client}
                    </div>
                  )}
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1 sm:mb-2">
                    {project.title}
                  </h3>
                  <p className="text-slate-500 text-[11px] sm:text-sm line-clamp-2 mb-2.5 sm:mb-4 leading-snug sm:leading-relaxed flex-grow">
                    {project.description}
                  </p>

                  <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between mt-auto gap-1 sm:gap-2">
                    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors whitespace-nowrap">
                      View Details &rarr;
                    </span>
                    {project.liveUrl && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 sm:px-2 rounded-md shrink-0 whitespace-nowrap">
                        <Globe size={11} className="w-2.5 h-2.5 sm:w-[11px] sm:h-[11px] text-blue-600" /> Live Demo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="col-span-full py-16 sm:py-20 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            )}
            {!loading && visibleProjects.length === 0 && (
              <div className="col-span-full py-16 sm:py-20 text-center text-sm sm:text-base text-slate-500">More projects coming soon!</div>
            )}
          </div>

          <div className="mt-10 sm:mt-16 lg:mt-20 bg-gradient-to-br from-[#0E2A47] via-blue-700 to-blue-600 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 md:p-12 text-center text-white shadow-xl shadow-blue-900/20">
            <h2 className="text-xl sm:text-3xl font-black mb-2.5 sm:mb-4 leading-tight">
              Need a setup for your office or home?
            </h2>
            <p className="text-blue-100 mb-5 sm:mb-8 max-w-2xl mx-auto text-xs sm:text-base lg:text-lg leading-relaxed">
              Contact our enterprise team today for a free consultation and quotation on CCTV, Networking, and Bulk PC orders.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedQuoteType('CCTV Setup');
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-[#0E2A47] px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
            >
              Get a Free Quote
            </button>
          </div>

          <QuoteModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            defaultProjectType={selectedQuoteType}
          />

          {/* Project Detail & Gallery Lightbox Modal */}
          {activeProjectModal && (
            <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6">
              <div
                className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
                onClick={() => setActiveProjectModal(null)}
              />
              <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-6xl shadow-2xl max-h-[92dvh] lg:h-[620px] overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row border border-slate-200/80 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveProjectModal(null)}
                  className="fixed sm:absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  title="Close"
                  aria-label="Close project details"
                >
                  <X size={17} />
                </button>

                {/* LEFT PANE: Visual Showcase & Gallery */}
                <div className="lg:w-[52%] bg-slate-950 flex flex-col justify-between relative overflow-hidden shrink-0">
                  {/* Ambient blurred background of the project image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${activePhotoUrl || activeProjectModal.image})` }}
                  />

                  {/* Top Badges over image */}
                  <div className="relative z-10 p-3 sm:p-5 pr-12 flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-slate-900 text-[11px] sm:text-xs font-extrabold shadow-md">
                      {(() => {
                        const Icon = Icons[activeProjectModal.iconName] || Briefcase;
                        return <Icon size={13} className="text-blue-600" />;
                      })()}
                      <span>{activeProjectModal.category}</span>
                    </div>

                    {activeProjectModal.isFeatured && (
                      <div className="bg-amber-400 text-slate-950 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black flex items-center gap-1 shadow-md">
                        <Star size={11} className="fill-slate-950" /> FEATURED
                      </div>
                    )}
                  </div>

                  {/* Main Uncropped / Clean Image Display */}
                  <div className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-6 py-2 min-h-[180px] sm:min-h-[260px] lg:min-h-[340px]">
                    <img
                      src={activePhotoUrl || activeProjectModal.image}
                      alt={activeProjectModal.title}
                      className="max-w-full max-h-[210px] sm:max-h-[300px] lg:max-h-[420px] w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-white/10"
                    />
                  </div>

                  {/* Bottom Gallery Strip / Live Link Bar */}
                  <div className="relative z-10 p-3 sm:p-5 bg-slate-900/85 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-2 sm:gap-3">
                    {Array.isArray(activeProjectModal.gallery) && activeProjectModal.gallery.length > 0 ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                        {[activeProjectModal.image, ...activeProjectModal.gallery].map((imgUrl, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setActivePhotoUrl(imgUrl)}
                            className={`w-12 h-9 sm:w-14 sm:h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              (activePhotoUrl || activeProjectModal.image) === imgUrl
                                ? 'border-blue-400 scale-105 shadow-md'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                        {activeProjectModal.client ? `Delivered for ${activeProjectModal.client}` : 'Verified CLICK2IT Deployment'}
                      </div>
                    )}

                    {activeProjectModal.liveUrl && (
                      <a
                        href={activeProjectModal.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all shrink-0"
                      >
                        <Globe size={12} /> Live Site <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                {/* RIGHT PANE: Clean Structured Project Details */}
                <div className="lg:w-[48%] flex flex-col justify-between lg:overflow-y-auto custom-scrollbar bg-white">
                  <div className="p-4 sm:p-7 space-y-4 sm:space-y-6">
                    {/* Title & Client Header */}
                    <div className="lg:pr-8 border-b border-slate-100 pb-4 sm:pb-5">
                      <div className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                        Client: {activeProjectModal.client || 'Corporate Partner'}
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                        {activeProjectModal.title}
                      </h2>

                      {/* Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                        {activeProjectModal.location && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold">
                            <MapPin size={11} className="text-blue-600" /> {activeProjectModal.location}
                          </span>
                        )}
                        {activeProjectModal.duration && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold">
                            <Clock size={11} className="text-emerald-600" /> {activeProjectModal.duration}
                          </span>
                        )}
                        {activeProjectModal.completedDate && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold">
                            <Calendar size={11} className="text-indigo-600" /> {activeProjectModal.completedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Overview */}
                    <div>
                      <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 sm:mb-2">
                        Project Overview
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {activeProjectModal.description}
                      </p>
                    </div>

                    {/* Delivered Specifications & Highlights */}
                    {Array.isArray(activeProjectModal.features) && activeProjectModal.features.length > 0 && (
                      <div>
                        <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 sm:mb-3">
                          Delivered Specifications &amp; Highlights
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeProjectModal.features.map((f: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
                            >
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Testimonial */}
                    {activeProjectModal.testimonial && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-700 italic">
                        "{activeProjectModal.testimonial}" — <strong className="not-italic text-slate-900">{activeProjectModal.client}</strong>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-4 sm:px-7 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Want a similar project?</p>
                      <p className="text-[11px] text-slate-500">Get a custom quotation from our team</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {activeProjectModal.liveUrl && (
                        <a
                          href={activeProjectModal.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                        >
                          <Globe size={13} className="text-blue-600" /> Live Demo
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const cat = activeProjectModal.category || 'CCTV Setup';
                          setActiveProjectModal(null);
                          setSelectedQuoteType(cat);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        Request a Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
