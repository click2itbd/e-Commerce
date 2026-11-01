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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors cursor-pointer"
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
        <div className="md:w-7/12 p-8 md:p-10 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Request a Quote</h3>
            <p className="text-slate-500 text-sm">
              Fill out the form below and we will get back to you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Project Type
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Project Details & Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your requirements (e.g., We need 16 IP cameras for a 2-story building, including NVR and installation...)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none custom-scrollbar"
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/30 cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Quote Request'}
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
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
    <Layout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight">
              Our Successful Projects
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Take a look at some of the key solutions we have delivered for our corporate clients, agencies, and individual customers. From complex CCTV installations to complete office workstation setups, we provide end-to-end IT infrastructure.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProjects.map(project => (
              <div
                key={project.id}
                onClick={() => {
                  setActiveProjectModal(project);
                  setActivePhotoUrl(project.image);
                }}
                className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border group flex flex-col cursor-pointer ${
                  project.isFeatured ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200'
                }`}
              >
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-sm">
                    {(() => {
                      const Icon = Icons[project.iconName] || Briefcase;
                      return <Icon size={14} className="text-blue-600" />;
                    })()}
                    {project.category}
                  </div>
                  {project.isFeatured && (
                    <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Star size={11} className="fill-slate-950" /> FEATURED
                    </div>
                  )}
                  {(project.location || project.duration) && (
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white/90 text-xs font-semibold">
                      {project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {project.location}
                        </span>
                      )}
                      {project.duration && (
                        <span className="flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full">
                          <Clock size={11} /> {project.duration}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-7 flex flex-col flex-grow">
                  <div className="mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Client: {project.client}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-[11px] font-bold transition-colors shrink-0"
                        title="Visit Live Website"
                      >
                        <Globe size={12} /> Live Site <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm mb-5 flex-grow leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {project.testimonial && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      "{project.testimonial}"
                    </div>
                  )}

                  {Array.isArray(project.features) && project.features.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-auto">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                        Key Highlights
                      </h4>
                      <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                        {project.features.map((feature: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="col-span-full py-20 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            )}
            {!loading && visibleProjects.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500">More projects coming soon!</div>
            )}
          </div>

          <div className="mt-20 bg-blue-600 rounded-[2rem] p-8 md:p-12 text-center text-white shadow-xl shadow-blue-900/20">
            <h2 className="text-3xl font-black mb-4">Need a setup for your office or home?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Contact our enterprise team today for a free consultation and quotation on CCTV, Networking, and Bulk PC orders.
            </p>
            <button
              onClick={() => {
                setSelectedQuoteType('CCTV Setup');
                setIsModalOpen(true);
              }}
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
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
            <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                onClick={() => setActiveProjectModal(null)}
              />
              <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setActiveProjectModal(null)}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="overflow-y-auto custom-scrollbar">
                  <div className="relative h-72 sm:h-96 bg-slate-900">
                    <img
                      src={activePhotoUrl || activeProjectModal.image}
                      alt={activeProjectModal.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6 text-white">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-xs font-bold mb-2">
                        {activeProjectModal.category}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black">{activeProjectModal.title}</h2>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1">
                        Client: {activeProjectModal.client}
                        {activeProjectModal.location ? ` • ${activeProjectModal.location}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Gallery Thumbnails if available */}
                  {Array.isArray(activeProjectModal.gallery) && activeProjectModal.gallery.length > 0 && (
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5 overflow-x-auto">
                      {[activeProjectModal.image, ...activeProjectModal.gallery].map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoUrl(imgUrl)}
                          className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                            (activePhotoUrl || activeProjectModal.image) === imgUrl
                              ? 'border-blue-600'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Project Overview
                      </h4>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                        {activeProjectModal.description}
                      </p>
                    </div>

                    {Array.isArray(activeProjectModal.features) && activeProjectModal.features.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                          Delivered Specifications & Highlights
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeProjectModal.features.map((f: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-semibold text-slate-800"
                            >
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeProjectModal.testimonial && (
                      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 text-sm text-slate-700 italic">
                        "{activeProjectModal.testimonial}" — <strong>{activeProjectModal.client}</strong>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-slate-500">
                        Interested in a similar setup for your organization?
                      </p>
                      <button
                        onClick={() => {
                          setActiveProjectModal(null);
                          setSelectedQuoteType('CCTV Setup');
                          setIsModalOpen(true);
                        }}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-600/20 cursor-pointer"
                      >
                        Request a Similar Quote
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
