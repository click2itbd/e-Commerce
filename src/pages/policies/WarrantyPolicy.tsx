import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { ShieldCheck, AlertTriangle, Clock, Wrench, CheckCircle, FileText, Server } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useSiteContext } from '../../hooks/useSiteContext';

const WarrantyPolicy = () => {
  const { settings } = useSettings();
  const siteContext = useSiteContext();

  const isHosting = siteContext === 'hosting';

  return (
    <Layout fullWidth>
      <SEO 
        title={isHosting ? `SLA & Uptime Guarantee - ${settings.brandName}` : `Official Warranty Policy & RMA Service - ${settings.brandName}`} 
        description={isHosting ? `Comprehensive server SLA, uptime guarantee, and service turnaround times for ${settings.brandName} hosting services.` : `Comprehensive product warranty policy and RMA claim procedures for hardware at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-2 sm:px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                {isHosting ? <Server className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {isHosting ? 'SLA & Service Guarantee' : 'Warranty Policy & RMA Guidelines'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {isHosting 
                    ? 'Clear terms for server hosting, uptime guarantees, and technical support SLAs'
                    : 'Clear official warranty terms for electronics, hardware, and accessories'}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {isHosting ? (
                // --- HOSTING SLA & WARRANTY ---
                <>
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      1. Uptime Guarantee (SLA)
                    </h2>
                    <p>
                      At <strong>{settings.brandName}</strong>, we are committed to providing a reliable and secure hosting environment. We offer a <strong>99.9% Uptime Guarantee</strong> for all our Shared, VPS, and Dedicated Server hosting plans.
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 mt-2 text-sm text-gray-700">
                      <li>Uptime is monitored proactively by our automated systems 24/7/365.</li>
                      <li>In the event of hardware failure on dedicated or shared nodes, replacement is provisioned at zero additional charge.</li>
                      <li>Scheduled maintenance periods (which are announced in advance) do not count toward downtime.</li>
                    </ul>
                  </section>

                  <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      2. Technical Support SLA
                    </h2>
                    <p className="text-sm mb-2">Our technical support operates under strict Service Level Agreements based on the severity of the issue:</p>
                    <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Critical (Server Down):</strong> Initial response within 15 minutes. Resolution targeted within 1-4 hours.</li>
                      <li><strong>High (Performance Degradation):</strong> Initial response within 1 hour. Resolution targeted within 12 hours.</li>
                      <li><strong>Normal (General Inquiry/Config):</strong> Initial response within 4-12 hours during business hours.</li>
                    </ol>
                  </section>

                  <section className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      3. Exceptions to Uptime Guarantee
                    </h2>
                    <p className="text-xs text-red-700 mb-3">
                      The SLA credit and uptime guarantee do not apply in the following scenarios:
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 text-xs text-red-800">
                      <li>Service interruptions caused by the user's custom scripts, poorly optimized code, or database queries.</li>
                      <li>Downtime caused by resource exhaustion (exceeding allotted RAM, CPU, or I/O limits).</li>
                      <li>Suspension of services due to Terms of Service violations or non-payment.</li>
                      <li>Force majeure events (natural disasters, massive global network outages, extreme DDoS attacks exceeding mitigation capacity).</li>
                    </ul>
                  </section>
                </>
              ) : (
                // --- SHOP / PC-BUILD WARRANTY ---
                <>
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      1. Scope of Warranty Coverage
                    </h2>
                    <p>
                      At <strong>{settings.brandName}</strong>, all authentic IT hardware, laptops, computer components, and networking products are covered under official authorized manufacturer warranty or standard service warranty as specified on the product sales invoice.
                    </p>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                        <h3 className="font-bold text-gray-900 mb-1">Brand Warranty</h3>
                        <p className="text-gray-600 text-xs">
                          Provided by the authorized distributor. Component repairs or replacements depend on the manufacturer's local RMA policies.
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <h3 className="font-bold text-gray-900 mb-1">Service Warranty</h3>
                        <p className="text-gray-600 text-xs">
                          Covers free servicing and labor charges for the specified duration. Parts replacement costs (if any) are borne by the customer.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      2. How to Claim Warranty (RMA Process)
                    </h2>
                    <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Provide Purchase Proof:</strong> Bring or present your original printed or digital sales invoice containing the product serial number.</li>
                      <li><strong>Bring Complete Package:</strong> For motherboard, GPU, processor, and peripheral claims, please submit the product with its original box, drivers, and bundled accessories.</li>
                      <li><strong>Diagnostic Assessment:</strong> Our technical team will inspect the hardware defect and issue an official Service / RMA Receipt with a tracking number.</li>
                      <li><strong>Repair or Replacement:</strong> The authorized service center will repair the unit, replace with a fresh unit, or offer an upgraded model depending on manufacturer availability.</li>
                    </ol>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      3. RMA Service Turnaround Time
                    </h2>
                    <ul className="list-disc pl-6 space-y-1.5 text-sm text-gray-700">
                      <li><strong>Standard Component Claim:</strong> 7 to 15 working days (subject to manufacturer service center parts availability).</li>
                      <li><strong>Laptop / Display Claim:</strong> 10 to 21 working days for panel or motherboard replacement under official service centers.</li>
                    </ul>
                  </section>

                  <section className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      4. Conditions Not Covered by Warranty (Void Policy)
                    </h2>
                    <p className="text-xs text-red-700 mb-3">
                      Warranty will become strictly void under any of the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 text-xs text-red-800">
                      <li>Physical damage, broken pins, PCB cracks, dents, or deep scratches caused by accident or misuse.</li>
                      <li>Liquid spillage, moisture corrosion, rust, or burning caused by electrical power surges/lightning.</li>
                      <li>Tampered, altered, removed, or illegible serial number stickers or warranty void labels.</li>
                      <li>Unauthorized servicing, firmware flashing, overclocking damage, or third-party repair attempts.</li>
                      <li>Normal wear and tear of consumable parts (e.g. mouse feet, keyboard key fading, thermal pads).</li>
                    </ul>
                  </section>
                </>
              )}

              {/* General Contact */}
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  {isHosting ? 'Technical Support Helpdesk' : 'Warranty & RMA Helpdesk'}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {isHosting 
                    ? 'For SLA claims, server issues, or technical assistance, contact our dedicated support team:' 
                    : 'For warranty status checks or technical assistance, contact our dedicated hardware support desk:'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-blue-600 hover:underline">
                    ðŸ“ž {settings.contactPhone || '+8809640887777'}
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline">
                    âœ‰ï¸ {settings.contactEmail}
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

export default WarrantyPolicy;
