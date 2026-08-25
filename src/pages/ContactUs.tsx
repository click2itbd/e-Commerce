import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const ContactUs = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setSubmitted(true);
      toast.success('Your message has been sent successfully! We will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      toast.error('Failed to send message. Please reach us directly via phone or WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout fullWidth>
      <SEO 
        title={`Contact Us & Customer Support - ${settings.brandName}`} 
        description={`Get in touch with ${settings.brandName}. Contact our hardware sales, web hosting support, billing department, or visit our retail store.`} 
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={14} /> 24/7 Dedicated Support
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            We'd Love to Hear From You
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Have questions about a product, custom PC build, domain registration, or cloud hosting package? Our tech specialists are here to assist.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Info Cards (Left 1 Col) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Direct Contact Information
                </h3>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Customer Hotline</p>
                    <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-sm font-bold text-gray-900 hover:text-blue-600">
                      {settings.contactPhone || '+8809640887777'}
                    </a>
                    <p className="text-[11px] text-gray-400 mt-0.5">Sat - Thu: 9:00 AM - 9:00 PM</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 break-all">
                      {settings.contactEmail}
                    </a>
                    <p className="text-[11px] text-gray-400 mt-0.5">Response within 2 - 4 hours</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Store & Head Office</p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {settings.address}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Business Hours</p>
                    <p className="text-sm font-bold text-gray-900">
                      10:00 AM – 8:30 PM
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Friday: 2:30 PM - 8:30 PM</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Assistance */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6 text-emerald-200" />
                  <h4 className="font-bold text-base">Instant WhatsApp Support</h4>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed mb-4">
                  Chat with our technical support team directly on WhatsApp for real-time queries and order assistance.
                </p>
                <a
                  href={`https://wa.me/${(settings.contactPhone || '+8809640887777').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-2.5 bg-white text-emerald-800 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
                >
                  Open WhatsApp Chat
                </a>
              </div>
            </div>

            {/* Interactive Contact Form (Right 2 Cols) */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h3>
                <p className="text-gray-500 text-xs md:text-sm mb-6">
                  Fill out the form below and our team will get back to you with detailed assistance.
                </p>

                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                    <h4 className="text-lg font-bold text-green-900">Thank You! Message Received</h4>
                    <p className="text-xs text-green-700 max-w-md mx-auto">
                      Your inquiry has been logged in our system. A customer care representative will contact you via email or phone shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                          Your Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Shakil Ahmed"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="shakil@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                          Phone / Mobile Number
                        </label>
                        <input
                          type="tel"
                          placeholder="017XXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                          Inquiry Topic
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Web Hosting & cPanel Support">Web Hosting & cPanel Support</option>
                          <option value="Domain Registration / Transfer">Domain Registration / Transfer</option>
                          <option value="Hardware & PC Building Quote">Hardware & PC Building Quote</option>
                          <option value="Warranty & RMA Claim">Warranty & RMA Claim</option>
                          <option value="Billing & Payment Verification">Billing & Payment Verification</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                        Your Message / Details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Tell us about your requirements or issue..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Sending Message...' : (
                        <>
                          <Send size={16} /> Submit Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
