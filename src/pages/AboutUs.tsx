import React from 'react';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, Cpu, Building2, CheckCircle2, Users, Shield } from 'lucide-react';

export default function AboutUs() {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';

  return (
    <Layout>
      <SEO
        title={`About Us - ${brandName}`}
        description={`${brandName} is your trusted destination in Bangladesh for authentic computer hardware, laptops, gadgets, and Custom PC Building.`}
      />

      {/* Hero Section */}
      <div className="bg-[#081621] text-white py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Welcome to <span className="text-[#F97316]">{brandName}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your trusted technology retail and custom PC engineering hub in Bangladesh—delivering 100% genuine computer hardware, laptops, gaming gear, and enterprise IT solutions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Core Services Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do Best</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We specialize in authentic hardware retail, precision custom PC building, and corporate IT deployments across Bangladesh.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Shop */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Authentic Tech Shop</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Explore our extensive collection of genuine processors, motherboards, graphics cards, laptops, monitors, CCTV cameras, and gaming peripherals backed by official warranties.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> 100% Genuine Brand Hardware</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Laptops, Monitors &amp; Gaming Gear</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Fast Nationwide Courier Delivery</li>
            </ul>
          </div>

          {/* PC Build */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-orange-50 text-[#F97316] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Custom PC Builder</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Whether you are an esports gamer, 3D artist, video editor, or software developer, our interactive PC Builder and expert engineers help you configure and assemble your dream rig.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#F97316]" /> Gaming &amp; Workstation Rigs</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#F97316]" /> Clean Cable Management &amp; BIOS Tuning</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#F97316]" /> Full Stress-Testing Before Dispatch</li>
            </ul>
          </div>

          {/* Corporate & Project Solutions */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Corporate &amp; IT Projects</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We partner with offices, educational institutions, and enterprises to supply bulk workstations, office networking setups, IP CCTV surveillance, and digital solutions.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Office Workstations &amp; Networking</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> IP CCTV &amp; Security Deployment</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Dedicated B2B Quotation Support</li>
            </ul>
          </div>
        </div>

        {/* Story / About Section */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12 overflow-hidden relative border border-gray-100">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Why Choose {brandName}?</h2>
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              We started with a clear commitment: to make buying authentic computer components and custom-built PCs transparent, reliable, and hassle-free. Today, {brandName} serves gamers, creators, and businesses across Bangladesh with genuine products and dependable after-sales warranty support.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Shield size={24} className="text-[#F97316]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">100% Authentic &amp; Stress-Tested</h4>
                  <p className="text-gray-500 mt-2">
                    Every component is sourced from authorized distributors, and every custom PC build undergoes thermal and stability testing before delivery.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Users size={24} className="text-[#F97316]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Dedicated Hardware Engineers</h4>
                  <p className="text-gray-500 mt-2">
                    Our team consists of experienced PC builders and hardware specialists ready to guide you on bottleneck-free component selection and smooth RMA support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
