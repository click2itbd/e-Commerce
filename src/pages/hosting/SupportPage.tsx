import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import { useSettings } from '../../context/SettingsContext';

const faqs = [
  {
    question: "What is your typical response time?",
    answer: "For premium support tickets, we typically respond within 1 hour. Standard support tickets are addressed within 12-24 hours depending on the volume."
  },
  {
    question: "What does your support policy cover?",
    answer: "Our support policy covers server uptime, network issues, hardware failures, and basic configuration of your hosting environment. We do not provide custom development or advanced software debugging."
  },
  {
    question: "Can I upgrade my support tier?",
    answer: "Yes! You can upgrade your support tier at any time from your billing dashboard. Upgrading provides faster response times and priority queue placement."
  },
  {
    question: "Do you offer emergency support?",
    answer: "Emergency support is available 24/7 for critical issues such as server down or network unavailability. Please mark your ticket as 'Critical' if you are experiencing a complete outage."
  }
];

export default function SupportPage() {
  const { settings } = useSettings();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Layout fullWidth>
      <PageHeader 
        title="We are here to help 24/7" 
        subtitle="Get the assistance you need, when you need it. Search our knowledge base or reach out to our dedicated support team."
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        
        {/* Knowledge Base Search */}
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How can we help?</h2>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
              placeholder="Search knowledge base articles, tutorials, and FAQs..."
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow text-center group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Phone className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-500 mb-6">Call us directly for immediate assistance with your issues.</p>
            <a href={`tel:${settings?.phone}`} className="text-lg font-semibold text-blue-600 hover:text-blue-700">
              {settings?.phone || '+1 (555) 123-4567'}
            </a>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow text-center group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-500 mb-6">Send us an email and we'll get back to you within 24 hours.</p>
            <a href={`mailto:${settings?.email}`} className="text-lg font-semibold text-purple-600 hover:text-purple-700">
              {settings?.email || 'support@example.com'}
            </a>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow text-center group">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-500 mb-6">Message us on WhatsApp for quick chats and quick fixes.</p>
            <a href={`https://wa.me/${settings?.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-green-600 hover:text-green-700">
              Chat on WhatsApp
            </a>
          </div>
        </section>

        {/* Support Ticket Form */}
        <section className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 to-indigo-900 p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">Submit a Ticket</h2>
              <p className="text-blue-100 mb-8 text-lg">
                Fill out the form below and our support team will get back to you as soon as possible.
              </p>
              <div className="space-y-6 text-blue-100">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Check the Docs</h4>
                    <p className="text-sm text-blue-200">You might find your answer faster in our knowledge base.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Community Forum</h4>
                    <p className="text-sm text-blue-200">Ask the community for tips and best practices.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 p-12">
              <form ref={formRef} className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) {
                    toast.error('Please login to submit a ticket');
                    navigate('/login?redirect=/support');
                    return;
                  }
                  
                  const formData = new FormData(e.currentTarget);
                  const subject = formData.get('subject') as string;
                  const priority = formData.get('priority') as string;
                  const message = formData.get('message') as string;
                  
                  if (!subject || !message) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  try {
                    setIsSubmitting(true);
                    const now = new Date().toISOString();
                    const ticketData = {
                      userId: user.uid,
                      customerName: user.displayName || formData.get('firstName') + ' ' + formData.get('lastName'),
                      customerEmail: user.email || formData.get('email'),
                      subject,
                      status: 'open',
                      priority: priority.split(' ')[0].toLowerCase(),
                      createdAt: now,
                      updatedAt: now
                    };

                    const docRef = await addDoc(collection(db, 'tickets'), ticketData);
                    
                    await addDoc(collection(db, 'tickets', docRef.id, 'messages'), {
                      sender: 'customer',
                      message,
                      createdAt: now
                    });

                    toast.success('Ticket submitted successfully!');
                    formRef.current?.reset();
                    navigate('/profile?tab=tickets');
                  } catch (error) {
                    console.error('Error submitting ticket:', error);
                    toast.error('Failed to submit ticket');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" name="firstName" placeholder="John" defaultValue={user?.displayName?.split(" ")[0] || ""} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" name="lastName" placeholder="Doe" defaultValue={user?.displayName?.split(" ")[1] || ""} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" name="email" placeholder="john@example.com" defaultValue={user?.email || ""} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select name="priority" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white">
                      <option>Low - General Query</option>
                      <option>Medium - Minor Issue</option>
                      <option>High - Service Degradation</option>
                      <option>Critical - Outage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" name="subject" placeholder="How do I..." required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none" name="message" placeholder="Describe your issue in detail..." required></textarea>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center space-x-2">
                    <span>{isSubmitting ? "Submitting..." : "Submit Ticket"}</span>
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Support FAQs */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-500">Quick answers to common support questions.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-colors ${activeFaq === index ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
              >
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span className={`font-semibold text-lg ${activeFaq === index ? 'text-blue-900' : 'text-gray-900'}`}>
                    {faq.question}
                  </span>
                  {activeFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
