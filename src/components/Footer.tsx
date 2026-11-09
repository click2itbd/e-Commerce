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
    <footer className="text-white pt-12 pb-6 bg-black">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-[50px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Support</h3>
            <div className="flex flex-col gap-4">
              <a
                href={`tel:${settings.contactPhone || '+8809640887777'}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
              >
                <div className="h-10 w-10 rounded-full border border-gray-700 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs">Contact Us</p>
                  <p className="font-bold" style={{ color: settings.accentColor }}>
                    {settings.contactPhone || '+8809640887777'}
                  </p>
                </div>
              </a>
              <a
                href={`mailto:${settings.contactEmail || 'info@click2itbd.com'}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
              >
                <div className="h-10 w-10 rounded-full border border-gray-700 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs">Email Support</p>
                  <p className="font-bold">{settings.contactEmail || 'info@click2itbd.com'}</p>
                </div>
              </a>
              <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <div className="h-10 w-10 rounded-full border border-gray-700 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs">Store Locator</p>
                  <p className="font-bold">{settings.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Us */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">About Us</h3>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link to="/emi-terms" className="hover:text-white transition-colors">EMI Terms & Plans</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/star-points" className="hover:text-white transition-colors">Star Point Policy</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors">Brands</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Customer Service</h3>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/online-delivery" className="hover:text-white transition-colors">Online Delivery</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund and Return Policy</Link></li>
              <li><Link to="/warranty-policy" className="hover:text-white transition-colors">Warranty Policy</Link></li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Stay Connected</h3>
            <p className="text-sm text-gray-400 mb-4">{settings.brandName}</p>

            <form onSubmit={handleSubscribe} className="mb-6">
              <p className="text-xs font-bold text-gray-300 uppercase mb-2">Newsletter Signup</p>
              <div className="flex flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-none text-white text-sm px-4 py-2.5 rounded-l-md focus:ring-1 focus:ring-white outline-none w-full"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Subscribe to newsletter"
                  className="bg-white text-black px-4 py-2.5 rounded-r-md hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              {subscribedSuccess && (
                <p className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Subscribed! Thank you for joining us.
                </p>
              )}
            </form>

            <div className="flex gap-4">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="h-10 w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                <Facebook size={20} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="h-10 w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                <Instagram size={20} />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="h-10 w-10 rounded-full flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>{settings.footerText}</p>
          <p>Powered By: CLICK2IT BD</p>
        </div>
      </div>
    </footer>
  );
};
