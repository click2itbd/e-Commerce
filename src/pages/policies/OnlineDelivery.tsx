import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Truck, Clock, MapPin, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const OnlineDelivery = () => {
  const { settings } = useSettings();

  return (
    <Layout fullWidth>
      <SEO 
        title={`Shipping & Online Delivery Information - ${settings.brandName}`} 
        description={`Nationwide delivery timelines, shipping charges, courier partners, and instant digital provisioning at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Truck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Shipping & Delivery Information</h1>
                <p className="text-gray-500 text-sm mt-1">Fast nationwide courier shipping and instant digital service activation</p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* Delivery Timelines Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-bold text-gray-900">Inside Dhaka City</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700 mb-2">24 - 48 Hours</p>
                  <p className="text-xs text-gray-600 leading-normal">
                    Delivered via Pathao / SteadFast / RedX / Home Express Courier directly to your doorstep. Same-day emergency delivery available for urgent orders upon request.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-gray-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                    Standard Charge: ৳60 - ৳100 BDT
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Outside Dhaka (All Districts)</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700 mb-2">2 - 4 Business Days</p>
                  <p className="text-xs text-gray-600 leading-normal">
                    Delivered nationwide across all 64 districts via Sundarban Courier, SA Paribahan, SteadFast, and eCourier with tracking support.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-gray-800 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
                    Standard Charge: ৳120 - ৳160 BDT
                  </div>
                </div>
              </div>

              {/* Digital Services Delivery */}
              <section className="bg-purple-50/60 border border-purple-100 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Digital Hosting & Domain Delivery (Instant)
                </h2>
                <p className="text-sm">
                  All <strong>Web Hosting, cPanel Accounts, Cloud VPS, and Domain Name Registrations</strong> are delivered electronically:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1.5 text-sm text-gray-700">
                  <li><strong>Automated Provisioning:</strong> Accounts are provisioned immediately upon bKash/Card payment verification.</li>
                  <li><strong>Login Credentials:</strong> cPanel URL, username, password, and nameservers are dispatched automatically to your registered contact email address.</li>
                  <li><strong>Domain Propagation:</strong> New domain registrations are live globally within 15 minutes to 2 hours of DNS propagation.</li>
                </ul>
              </section>

              {/* Order Tracking & Packaging */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Packaging, Safety & Order Tracking
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                  <li><strong>Protective Packaging:</strong> All hardware components (Processors, Motherboards, GPUs, Monitors, Hard Drives) are safely packaged with anti-static bubble wrap and sturdy outer cartons to prevent in-transit damage.</li>
                  <li><strong>Live Tracking:</strong> As soon as your physical parcel is handed over to the courier partner, an SMS and email notification with your Consignment Tracking ID will be sent to your phone.</li>
                  <li><strong>Package Inspection:</strong> Customers are requested to inspect the exterior security tape and package seal in front of the courier delivery executive before completing delivery acceptance.</li>
                </ul>
              </section>

              {/* Store Pickup */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">In-Store Collection (Free Pickup)</h2>
                <p className="text-sm">
                  You can also select <strong>In-Store Pickup</strong> during checkout to collect your ordered items directly from our retail outlet without paying any delivery fee:
                </p>
                <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
                  <p className="font-bold text-gray-900">📍 {settings.brandName} Store Location:</p>
                  <p className="text-gray-600 mt-0.5">{settings.address}</p>
                  <p className="text-gray-500 text-xs mt-1">Open: Saturday to Thursday (10:00 AM - 8:30 PM)</p>
                </div>
              </section>

              {/* Contact Support */}
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-700" />
                  Delivery Inquiries & Urgent Dispatch
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Need an urgent delivery or want to update your shipping address? Contact our logistics support team:
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-emerald-700 hover:underline">
                    📞 {settings.contactPhone || '+8809640887777'}
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="text-emerald-700 hover:underline">
                    ✉️ {settings.contactEmail}
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OnlineDelivery;
