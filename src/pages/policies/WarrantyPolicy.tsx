import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { ShieldCheck, AlertTriangle, Clock, Wrench, CheckCircle, FileText } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const WarrantyPolicy = () => {
  const { settings } = useSettings();

  return (
    <Layout fullWidth>
      <SEO 
        title={`Official Warranty Policy & RMA Service - ${settings.brandName}`} 
        description={`Comprehensive product warranty policy, RMA claim procedures, server uptime guarantee, and service turnaround times at ${settings.brandName}.`} 
      />
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Warranty Policy & RMA Guidelines</h1>
                <p className="text-gray-500 text-sm mt-1">Clear official warranty terms for electronics, hardware, and server hosting</p>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* Warranty Types */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  1. Scope of Warranty Coverage
                </h2>
                <p>
                  At <strong>{settings.brandName}</strong>, all authentic IT hardware, laptops, computer components, networking products, and digital cloud infrastructure are covered under official authorized manufacturer warranty or standard service warranty as specified on the product sales invoice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-1">🏷️ Official Brand Warranty</h3>
                    <p className="text-gray-600 text-xs">
                      Provided directly by official distributor service centers (e.g. Asus, HP, Dell, Gigabyte, MSI, TP-Link, Intel, AMD). We facilitate end-to-end RMA claims on your behalf.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-1">☁️ Hosting & Cloud SLA</h3>
                    <p className="text-gray-600 text-xs">
                      99.9% network & server uptime guarantee. In case of server hardware failure, immediate replacement and automated failover are provisioned at zero additional charge.
                    </p>
                  </div>
                </div>
              </section>

              {/* Warranty Claim Procedure */}
              <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  2. How to Claim Warranty (RMA Process)
                </h2>
                <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
                  <li><strong>Provide Purchase Proof:</strong> Bring or present your original printed or digital sales invoice (`INV-XXXXXX`) containing the product serial number.</li>
                  <li><strong>Bring Complete Package:</strong> For motherboard, GPU, processor, and peripheral claims, please submit the product with its original box, drivers, and bundled accessories.</li>
                  <li><strong>Diagnostic Assessment:</strong> Our technical team will inspect the hardware defect and issue an official Service / RMA Receipt with a tracking number.</li>
                  <li><strong>Repair or Replacement:</strong> The authorized service center will repair the unit, replace with a fresh unit, or offer an upgraded model depending on manufacturer availability.</li>
                </ol>
              </section>

              {/* Turnaround Time */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  3. RMA Service Turnaround Time
                </h2>
                <ul className="list-disc pl-6 space-y-1.5 text-sm text-gray-700">
                  <li><strong>Standard Component Claim:</strong> 7 to 15 working days (subject to manufacturer service center parts availability).</li>
                  <li><strong>Laptop / Display Claim:</strong> 10 to 21 working days for panel or motherboard replacement under official service centers.</li>
                  <li><strong>Web Hosting / Cloud Technical SLA:</strong> Instant to 4 hours maximum resolution for server-side hardware or network issues.</li>
                </ul>
              </section>

              {/* Void Conditions */}
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

              {/* Warranty Service Contact */}
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  Warranty & RMA Helpdesk
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  For warranty status checks or technical assistance, contact our dedicated hardware support desk:
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  <a href={`tel:${settings.contactPhone || '+8809640887777'}`} className="text-blue-600 hover:underline">
                    📞 {settings.contactPhone || '+8809640887777'}
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline">
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

export default WarrantyPolicy;
