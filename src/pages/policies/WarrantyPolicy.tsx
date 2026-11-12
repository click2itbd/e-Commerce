import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  FileText,
  Phone,
  Mail,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { DynamicPolicyPage } from '../../components/DynamicPolicyPage';

const WarrantyPolicy = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const contactPhone = settings?.contactPhone || '+8809640887777';
  const contactEmail = settings?.contactEmail || 'info@click2itbd.com';

  const warrantyFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'How do I claim a hardware warranty at Click2IT?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'To claim warranty, bring the defective product along with the original invoice and warranty sticker/serial number to our service center at Multiplan Center, Level 10, Dhaka or contact customer support.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How long does a warranty RMA claim take?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Standard hardware RMA claims typically take between 3 to 14 business days depending on the manufacturer and authorized distributor replacement timeline.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Are physical damage or liquid spills covered under warranty?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'No, manufacturer warranty does not cover physical breakage, burnt circuits, liquid spills, lightning surge, or unauthorized tampering.'
        }
      }
    ]
  };

  return (
    <DynamicPolicyPage pageId="warranty-policy" defaultTitle="Warranty Policy">
      <Layout fullWidth>
        <SEO
          title={`Official Warranty Policy & RMA Service Guidelines - ${brandName}`}
          description={`Comprehensive product warranty policy, RMA claim procedures, and official brand support at ${brandName}.`}
          canonical="https://click2itbd.com/warranty-policy"
          schema={[warrantyFaqSchema]}
        />
        <div className="bg-slate-50/80 py-10 md:py-16 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                    Warranty Policy &amp; RMA Guidelines
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Official warranty terms for electronics, PC components, laptops, and accessories
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6" />

              <div className="space-y-8 text-slate-700 leading-relaxed">
                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    1. Scope of Warranty Coverage
                  </h2>
                  <p className="text-sm text-slate-600">
                    At <strong>{brandName}</strong>, all authentic IT hardware, laptops, computer components, and networking products are covered under official authorized manufacturer warranty or standard service warranty as stated on your sales invoice.
                  </p>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/70 border border-emerald-200/70 p-5 rounded-2xl">
                      <h3 className="font-bold text-slate-900 mb-1">Authorized Brand Warranty</h3>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        Fulfilled directly by the official importer or authorized distributor in Bangladesh according to the manufacturer&apos;s RMA guidelines.
                      </p>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-200/70 p-5 rounded-2xl">
                      <h3 className="font-bold text-slate-900 mb-1">Service Warranty</h3>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        Covers free technical servicing and labor charges for the specified duration. Any physical replacement parts required are billed separately.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    2. How to Claim Warranty (RMA Process)
                  </h2>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-slate-700">
                    <li>
                      <strong>Provide Purchase Proof:</strong> Present your original printed or digital invoice showing the product serial number.
                    </li>
                    <li>
                      <strong>Bring Complete Box &amp; Accessories:</strong> For motherboards, GPUs, processors, monitors, and peripherals, please submit the item with its original box having an intact serial sticker and all bundled accessories.
                    </li>
                    <li>
                      <strong>Diagnostic Assessment:</strong> Our technical desk will inspect the hardware fault and issue an official RMA Receipt with a tracking number.
                    </li>
                    <li>
                      <strong>Repair or Replacement:</strong> The authorized service center will repair the unit, replace it with an identical unit, or offer an equivalent/upgraded unit based on availability.
                    </li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    3. Standard RMA Turnaround Time
                  </h2>
                  <ul className="list-disc pl-6 space-y-1.5 text-sm text-slate-600">
                    <li>
                      <strong>Standard Component Claim:</strong> 7 to 15 working days (subject to authorized distributor stock and testing queue).
                    </li>
                    <li>
                      <strong>Laptop / Monitor Claim:</strong> 10 to 21 working days for panel or mainboard replacement through official brand service centers.
                    </li>
                  </ul>
                </section>

                <section className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    4. Conditions Not Covered by Warranty (Void Policy)
                  </h2>
                  <p className="text-xs text-red-700 mb-3">
                    Manufacturer warranty will become strictly void under any of the following conditions:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-xs text-red-800">
                    <li>Physical damage, bent CPU socket pins, PCB cracks, dents, or deep scratches caused by improper installation or accidents.</li>
                    <li>Burn marks, short-circuit damage, liquid spillage, moisture corrosion, or fungal/insect damage.</li>
                    <li>Tampered, torn, altered, or missing serial number stickers or warranty void seals.</li>
                    <li>Unauthorized third-party repair attempts, modified BIOS flashing, or physical tampering.</li>
                  </ul>
                </section>

                <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-700" />
                    Warranty &amp; RMA Helpdesk
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    For RMA status checks or technical assistance, reach out to our hardware support team:
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm font-semibold">
                    <a href={`tel:${contactPhone}`} className="text-blue-600 hover:underline inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4" /> {contactPhone}
                    </a>
                    <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline inline-flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> {contactEmail}
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DynamicPolicyPage>
  );
};

export default WarrantyPolicy;
