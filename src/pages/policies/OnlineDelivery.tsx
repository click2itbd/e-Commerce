import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { Truck, Clock, MapPin, Zap, ShieldCheck, HelpCircle, Server, FileText } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useSiteContext } from '../../hooks/useSiteContext';

const OnlineDelivery = () => {
  const { settings } = useSettings();
  const siteContext = useSiteContext();
  const isHosting = siteContext === 'hosting';

  return (
    <Layout fullWidth>
      <SEO 
        title={isHosting ? `Service Activation & Provisioning - ${settings.brandName}` : `Shipping & Online Delivery Information - ${settings.brandName}`} 
        description={isHosting ? `Instant digital provisioning, VPS setup times, and server activation details at ${settings.brandName}.` : `Nationwide delivery timelines, shipping charges, and courier partners at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16 min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                {isHosting ? <Zap className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {isHosting ? 'Service Activation & Delivery' : 'Shipping & Delivery Information'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {isHosting ? 'Instant automated deployment and manual server setup timelines' : 'Fast nationwide courier shipping and order processing timelines'}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {isHosting ? (
                // --- HOSTING ACTIVATION INFO ---
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-6 h-6 text-emerald-600" />
                        <h3 className="text-lg font-bold text-gray-900">Shared & Reseller Hosting</h3>
                      </div>
                      <p className="text-2xl font-extrabold text-emerald-700 mb-2">Instant Activation</p>
                      <p className="text-xs text-gray-600 leading-normal">
                        All shared hosting, reseller hosting, and domain registrations are fully automated. Your service will be activated instantly within 60 seconds of invoice payment confirmation.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Server className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">VPS & Dedicated Servers</h3>
                      </div>
                      <p className="text-2xl font-extrabold text-blue-700 mb-2">1 to 24 Hours</p>
                      <p className="text-xs text-gray-600 leading-normal">
                        VPS deployments usually take 15-60 minutes depending on the OS template. Dedicated servers may take up to 24-48 hours for hardware provisioning and network configuration.
                      </p>
                    </div>
                  </div>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-gray-600" />
                      1. Payment Verification
                    </h2>
                    <p className="text-sm">
                      Our system automatically verifies payments made via bKash, Nagad, Rocket, and automated payment gateways (SSLCommerz/AamarPay). For manual bank transfers or international wire transfers, provisioning will occur after our billing team verifies the transaction (typically within business hours).
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      2. Welcome Email & Credentials
                    </h2>
                    <p className="text-sm">
                      Upon successful activation, you will receive a <strong>"New Account Information"</strong> email containing your cPanel/WHM or root SSH credentials, assigned IP addresses, and nameservers. Please ensure your registered email address is correct and check your spam/junk folder if you do not see it in your inbox.
                    </p>
                  </section>
                </>
              ) : (
                // --- ECOMMERCE DELIVERY INFO ---
                <>
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
                        Standard Charge: à§³ 60 - à§³ 100 BDT
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Outside Dhaka (Nationwide)</h3>
                      </div>
                      <p className="text-2xl font-extrabold text-blue-700 mb-2">2 to 5 Days</p>
                      <p className="text-xs text-gray-600 leading-normal">
                        Dispatched via Sundarban Courier, SA Paribahan, or SteadFast. You can pick it up from your nearest courier branch or request home delivery depending on your district coverage.
                      </p>
                      <div className="mt-4 text-xs font-semibold text-gray-800 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
                        Standard Charge: à§³ 120 - à§³ 200 BDT
                      </div>
                    </div>
                  </div>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-gray-600" />
                      1. Order Processing
                    </h2>
                    <p className="text-sm">
                      Orders placed before 4:00 PM are generally processed and handed over to the courier on the same working day. Orders placed after 4:00 PM or on weekends/public holidays will be processed on the next working day.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-gray-600" />
                      2. Secure Packaging & Verification
                    </h2>
                    <p className="text-sm mb-2">
                      All expensive PC components (GPUs, Processors, Monitors) are packed with multi-layered bubble wrap and rigid carton boxes to ensure zero damage in transit.
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 text-sm text-gray-700">
                      <li>Please do an open-box unboxing video when receiving high-value packages.</li>
                      <li>If the courier seal is broken or tampered with, refuse the delivery and contact us instantly.</li>
                    </ul>
                  </section>
                </>
              )}

              {/* Contact Block */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-8">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                  Have questions about your order?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Contact our support team with your Invoice or Ticket Number for a live status update.
                </p>
                <div className="flex gap-4 text-sm font-semibold">
                  <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-blue-600 hover:underline">
                    ðŸ“ž {settings.contactPhone || '+8809640887777'}
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline">
                    âœ‰ï¸ {settings.contactEmail}
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OnlineDelivery;
