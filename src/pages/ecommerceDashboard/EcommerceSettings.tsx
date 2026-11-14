import React, { useState, useEffect } from 'react';
import { Truck, Phone, Mail, MapPin, Facebook, Youtube, Instagram, FileText, Save, CheckCircle, Globe, Copy, ExternalLink, Search, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { SiteSettings } from '../../types';
import { GSC_QUERY_REGEX_PATTERNS, GSC_PAGE_URL_REGEX_PATTERNS } from '../../utils/seoSearchRegex';

export const EcommerceSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    shippingCost: 60,
    shippingCostOutsideDhaka: 120,
    freeShippingThreshold: 5000,
    contactPhone: '',
    contactEmail: '',
    address: '',
    facebookUrl: '',
    youtubeUrl: '',
    instagramUrl: '',
    refundPolicy: '',
    termsConditions: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'public_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving settings...');
    try {
      const docRef = doc(db, 'settings', 'public_config');
      await updateDoc(docRef, settings as any);
      toast.success('Settings updated successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to update settings', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Store Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure delivery fees, contact info, and policies exclusively for the online storefront.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shipping Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Truck className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Shipping & Delivery</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inside Dhaka Fee (Tk)</label>
              <input type="number" name="shippingCost" value={settings.shippingCost || 0} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outside Dhaka Fee (Tk)</label>
              <input type="number" name="shippingCostOutsideDhaka" value={settings.shippingCostOutsideDhaka || 0} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (Tk)</label>
              <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold || 0} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Set 0 to disable free shipping</p>
            </div>
          </div>
        </div>

        
          {/* Advance Delivery Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">Advanced COD Protection</h3>
            </div>
            <div className="p-6 bg-orange-50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-800 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="requireAdvanceDeliveryCharge" checked={settings.requireAdvanceDeliveryCharge || false} onChange={(e) => setSettings(prev => ({...prev, requireAdvanceDeliveryCharge: e.target.checked}))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </div>
                  Require Advance Delivery Charge (For COD)
                </label>
                <p className="text-xs text-gray-500 mt-2">Prevents fake orders by forcing the customer to pay the delivery charge in advance before confirming a COD order.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">bKash/Nagad Number (For Advance Payment)</label>
                <input type="text" name="advancePaymentNumber" value={settings.advancePaymentNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 017XXXXXXX (Personal/Agent)" />
              </div>
            </div>
          </div>
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Phone className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Store Contact Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400" /></div>
                <input type="text" name="contactPhone" value={settings.contactPhone || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+880 1..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400" /></div>
                <input type="email" name="contactEmail" value={settings.contactEmail || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="support@store.com" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none"><MapPin size={16} className="text-gray-400" /></div>
                <textarea name="address" value={settings.address || ''} onChange={handleChange} rows={2} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Shop Address" />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Facebook className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Social Media Links</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Facebook size={14} className="text-blue-600" /> Facebook</label>
              <input type="url" name="facebookUrl" value={settings.facebookUrl || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Youtube size={14} className="text-red-600" /> YouTube</label>
              <input type="url" name="youtubeUrl" value={settings.youtubeUrl || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Instagram size={14} className="text-pink-600" /> Instagram</label>
              <input type="url" name="instagramUrl" value={settings.instagramUrl || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://instagram.com/..." />
            </div>
          </div>
        </div>

        
          {/* Steadfast Courier Integration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">Steadfast Courier Integration</h3>
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">API Integration</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input type="text" name="steadfastApiKey" value={settings.steadfastApiKey || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Steadfast API Key" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input type="password" name="steadfastSecretKey" value={settings.steadfastSecretKey || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Steadfast Secret Key" />
              </div>
              <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>Note:</strong> By adding Steadfast API keys, a "Send to Steadfast" button will appear in the Orders panel to automatically push orders and get a Tracking ID.
              </div>
            </div>
          </div>
          
          {/* SEO & Search Console Integrations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">SEO, Google Search Console & Shopping Feeds</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> Auto-Sync Active
              </span>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect your dynamic sitemap and product feed with Google Search Console and Google Merchant Center to rank in Google Search, Google Images, and Google Shopping.
              </p>

              {/* Sitemap URL Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      XML Sitemap (270+ URLs including all 126 products)
                    </span>
                  </div>
                  <code className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 inline-block break-all">
                    https://click2itbd.com/sitemap.xml
                  </code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://click2itbd.com/sitemap.xml');
                      toast.success('Sitemap URL copied to clipboard!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
                  >
                    <Copy size={13} /> Copy URL
                  </button>
                  <a
                    href="https://click2itbd.com/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
                  >
                    <ExternalLink size={13} /> View
                  </a>
                </div>
              </div>

              {/* Google Merchant Center RSS Feed */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Google Merchant Center / Shopping Feed (RSS 2.0)
                    </span>
                  </div>
                  <code className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 inline-block break-all">
                    https://click2itbd.com/feed.xml
                  </code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://click2itbd.com/feed.xml');
                      toast.success('Merchant Feed URL copied to clipboard!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
                  >
                    <Copy size={13} /> Copy Feed
                  </button>
                  <a
                    href="https://click2itbd.com/feed.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition-colors shadow-xs"
                  >
                    <ExternalLink size={13} /> View
                  </a>
                </div>
              </div>

              {/* Direct links to Search Console & Merchant Center */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://search.google.com/search-console?resource_id=sc-domain%3Aclick2itbd.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Search size={14} /> Open Google Search Console &rarr;
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://merchants.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 hover:underline"
                >
                  <ExternalLink size={14} /> Open Google Merchant Center &rarr;
                </a>
              </div>

              {/* Google Search Console Search Queries & Custom Regex Command Center */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Google Search Console (GSC) Search Queries &amp; Custom Regex Filters
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search Console &rarr; Performance &rarr; + New &rarr; Query / Page &rarr; Custom (regex)-এ নিচের প্যাটার্নগুলো কপি করে বসান।
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Query Regex Filters ({GSC_QUERY_REGEX_PATTERNS.length})
                  </div>
                  {GSC_QUERY_REGEX_PATTERNS.map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.title}</div>
                          <div className="text-[11px] text-slate-500">{item.purpose}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.gscRe2Alternative || item.regex);
                            toast.success(`Copied regex: ${item.title}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0"
                        >
                          <Copy size={12} /> Copy Regex
                        </button>
                      </div>
                      <code className="block text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded border border-slate-200 break-all">
                        {item.gscRe2Alternative || item.regex}
                      </code>
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">Mode:</span>{' '}
                        {item.gscFilterMode === 'not_matches' ? "Doesn't match regex" : 'Matches regex'}
                        {' · '}
                        <span className="font-semibold text-slate-600">Examples:</span> {item.exampleMatches.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Page URL Regex Filters ({GSC_PAGE_URL_REGEX_PATTERNS.length})
                  </div>
                  {GSC_PAGE_URL_REGEX_PATTERNS.map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800">{item.title}</div>
                        <code className="block text-[11px] font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 mt-1 break-all">
                          {item.regex}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.regex);
                          toast.success(`Copied URL regex: ${item.title}`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Store Policies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Store Policies</h3>
          </div>
          <div className="p-6 grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund & Return Policy</label>
              <textarea name="refundPolicy" value={settings.refundPolicy || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your refund policy here..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea name="termsConditions" value={settings.termsConditions || ''} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter terms and conditions here..." />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
