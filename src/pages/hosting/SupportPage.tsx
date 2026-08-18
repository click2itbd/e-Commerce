import React from 'react';
import { PageHeader } from '../../components/hosting/PageHeader';
import { Mail, Phone, MessageCircle, HelpCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function SupportPage() {
  const { settings } = useSettings();

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      <PageHeader 
        title="24/7 Expert Support" 
        subtitle="We're here to help you succeed. Get in touch with our team." 
      />
      
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
            <p className="text-gray-500 mb-4">Available 24/7 for urgent matters</p>
            <a href={`tel:${settings.phone || '+880123456789'}`} className="text-lg font-semibold text-blue-600 hover:underline">
              {settings.phone || '+880123456789'}
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-500 mb-4">Get a response within 2 hours</p>
            <a href={`mailto:${settings.email || 'support@click2it.com'}`} className="text-lg font-semibold text-blue-600 hover:underline">
              {settings.email || 'support@click2it.com'}
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-500 mb-4">Chat directly with our experts</p>
            <a href={`https://wa.me/${(settings.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-lg font-semibold text-blue-600 hover:underline">
              Start Chatting
            </a>
          </div>

        </div>

        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
          </div>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully! We will contact you soon.'); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="john@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="How can we help you?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea required rows={5} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="Describe your issue..."></textarea>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full md:w-auto">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
