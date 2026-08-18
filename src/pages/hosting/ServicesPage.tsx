import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Database, 
  Cloud,
  MousePointerClick,
  Globe,
  Rocket,
  ArrowRight
} from 'lucide-react';

import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/hosting/PageHeader';
import ServicesGrid from '../hosting-sections/ServicesGrid';

const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // fetch services from firestore as I did before
        // Example skeleton:
        // const { collection, getDocs } = await import('firebase/firestore');
        // const { db } = await import('../../config/firebase');
        // const querySnapshot = await getDocs(collection(db, 'services'));
        // const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // setServices(data);
        
        // Simulating loading to not break UI if user implements later
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error("Error fetching services:", error);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <Layout fullWidth>
      <PageHeader 
        title="Enterprise-Grade Web Hosting" 
        subtitle="Fast, secure, and reliable hosting solutions designed to scale with your business. Get your website online today." 
      />

      {/* 3 Simple Steps Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              3 Simple Steps to Get Online
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Launch your dream website in minutes, not days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 dark:border-blue-800">
                <MousePointerClick className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Choose a Plan</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select the hosting package that best fits your needs and budget. Upgrading is easy as you grow.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200 dark:border-indigo-800">
                <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Register Domain</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Search and register your perfect domain name. Your unique identity on the web starts here.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center z-10">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-200 dark:border-purple-800">
                <Rocket className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Launch Website</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Publish your site using our one-click installers or drag-and-drop website builder.
              </p>
            </div>
            
            {/* Connecting Lines (Desktop only) */}
            <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-[2px] bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 z-0"></div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Our Hosting Solutions
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Powerful hosting designed to meet your specific requirements.
            </p>
          </div>
          
          <ServicesGrid services={services} onNavigate={navigate} />
        </div>
      </section>

      {/* Premium Features Highlights */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Premium Features Included
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Everything you need to succeed online, built into every plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">99.9% Uptime</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                We guarantee maximum availability so your visitors can always reach your website without interruptions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Free SSL</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Secure your website and boost your SEO ranking with free, automatically provisioned SSL certificates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">NVMe SSD</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Experience blazing fast load times with our enterprise-grade NVMe solid-state storage arrays.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <Cloud className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Daily Backups</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Rest easy knowing your data is safe with automated daily backups and simple one-click restores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 dark:bg-blue-700 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Ready to launch your website?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers and build your digital presence with our enterprise-grade hosting platform.
          </p>
          <Link 
            to="/pricing" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-blue-600 bg-white hover:bg-gray-50 hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

    </Layout>
  );
};

export default ServicesPage;
