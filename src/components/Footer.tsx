import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { apiPost } from '../services/apiClient';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: trimmedEmail,
        status: 'active',
        source: 'footer_newsletter',
        createdAt: new Date().toISOString(),
      });

      // Best-effort welcome email (non-blocking so guest subscriptions always succeed)
      apiPost('/api/send-email', {
        to: trimmedEmail,
        subject: `Welcome to ${settings.brandName} Newsletter!`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h1 style="color: ${settings.primaryColor};">${settings.brandName}</h1>
              <p>Hello!</p>
              <p>Thank you for subscribing to our newsletter. We're excited to have you with us!</p>
              <p>You'll be the first to know about our latest computer hardware, custom PC deals, and special offers.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">${settings.footerText}</p>
            </div>
          `,
      }).catch(() => {});

      setSubscribedSuccess(true);
      toast.success('Subscribed to newsletter successfully!');
      setEmail('');
      setTimeout(() => setSubscribedSuccess(false), 5000);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const facebookUrl = (settings as any)?.facebookUrl || 'https://www.facebook.com/CLICK2ITBD';
  const instagramUrl = (settings as any)?.instagramUrl || 'https://www.instagram.com/click2itbd';
  const youtubeUrl = (settings as any)?.youtubeUrl || 'https://www.youtube.com/@click2itbd';

  return (
    <footer className="text-white pt-8 sm:pt-12 pb-4 sm:pb-6 bg-black border-t border-white/5">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-[50px]">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Contact Info */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 uppercase tracking-wider text-white">Support</h3>
            <div className="flex flex-col gap-2.5 sm:gap-3.5">
              <a
                href={`tel:${settings.contactPhone || '+8809640887777'}`}
                className="flex items-center gap-3 p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/[0.06] sm:border-0 text-gray-400 hover:text-white transition-colors"
              >
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-gray-700/80 bg-neutral-900 flex items-center justify-center shrink-0 text-gray-300">
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Contact Us</p>
                  <p className="font-bold text-sm" style={{ color: settings.accentColor || '#F97316' }}>
                    {settings.contactPhone || '+8809640887777'}
                  </p>
                </div>
              </a>
              <a
                href={`mailto:${settings.contactEmail || 'info@click2itbd.com'}`}
                className="flex items-center gap-3 p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/[0.06] sm:border-0 text-gray-400 hover:text-white transition-colors"
              >
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-gray-700/80 bg-neutral-900 flex items-center justify-center shrink-0 text-gray-300">
                  <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Email Support</p>
                  <p className="font-bold text-sm text-gray-200 truncate">{settings.contactEmail || 'info@click2itbd.com'}</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-2.5 sm:p-0 rounded-xl bg-white/[0.04] sm:bg-transparent border border-white/[0.06] sm:border-0 text-gray-400">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-gray-700/80 bg-neutral-900 flex items-center justify-center shrink-0 text-gray-300">
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">Store Locator</p>
                  <p className="font-semibold text-xs text-gray-300 leading-snug line-clamp-2">{settings.address || 'Dhaka, Bangladesh'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Us */}
          <div className="col-span-1">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 uppercase tracking-wider text-white">About Us</h3>
            <ul className="flex flex-col gap-2 text-gray-400 text-xs sm:text-sm">
              <li><Link to="/emi-terms" className="hover:text-white transition-colors py-0.5 block">EMI Terms & Plans</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors py-0.5 block">Privacy Policy</Link></li>
              <li><Link to="/star-points" className="hover:text-white transition-colors py-0.5 block">Star Point Policy</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors py-0.5 block">Brands</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-span-1">
            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 uppercase tracking-wider text-white">Customer Service</h3>
            <ul className="flex flex-col gap-2 text-gray-400 text-xs sm:text-sm">
              <li><Link to="/contact" className="hover:text-white transition-colors py-0.5 block">Contact Us</Link></li>
              <li><Link to="/online-delivery" className="hover:text-white transition-colors py-0.5 block">Online Delivery</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white transition-colors py-0.5 block">Refund Policy</Link></li>
              <li><Link to="/warranty-policy" className="hover:text-white transition-colors py-0.5 block">Warranty Policy</Link></li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-bold mb-1.5 sm:mb-4 uppercase tracking-wider text-white">Stay Connected</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">{settings.brandName || "CLICK2IT BD"}</p>

            <form onSubmit={handleSubscribe} className="mb-4 sm:mb-6">
              <p className="text-[11px] font-bold text-gray-300 uppercase mb-2">Newsletter Signup</p>
              <div className="flex flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-l-xl focus:ring-1 focus:ring-white outline-none w-full"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Subscribe to newsletter"
                  className="bg-white text-black px-4 py-2.5 rounded-r-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              {subscribedSuccess && (
                <p className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Subscribed! Thank you for joining us.
                </p>
              )}
            </form>

            <div className="flex gap-3 sm:gap-4">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all text-white shadow-xs"
                style={{ backgroundColor: settings.secondaryColor || '#1877F2' }}
              >
                <Facebook size={18} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all text-white shadow-xs"
                style={{ backgroundColor: settings.secondaryColor || '#E4405F' }}
              >
                <Instagram size={18} />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all text-white shadow-xs"
                style={{ backgroundColor: settings.secondaryColor || '#FF0000' }}
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Powered By Bar */}
        <div className="border-t border-neutral-800/80 pt-5 sm:pt-6 pb-20 sm:pb-3 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-xs text-gray-400 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs text-gray-400">
            {settings.footerText || `© ${new Date().getFullYear()} ${settings.brandName || 'CLICK2IT BD'}. All rights reserved.`}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
            <span>Powered By:</span>
            <span className="text-gray-300 font-semibold">{settings.brandName || 'CLICK2IT BD'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
