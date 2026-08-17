import React from 'react';
import { Cloud, HardDrive, Server, Globe, Cpu, Share2 } from 'lucide-react';

const DEFAULT_SERVICES = [
  { id: 's1', title: 'Cloud hosting', icon: Cloud, description: 'Scale effortlessly with our cloud hosting solutions. Enjoy high availability, automatic backups, and seamless resource scaling.' },
  { id: 's2', title: 'Dedicated hosting', icon: HardDrive, description: 'Get a server all to yourself. Maximum performance, full root access, and complete control over your environment.' },
  { id: 's3', title: 'Shared hosting', icon: Share2, description: 'Perfect for beginners. Affordable and easy-to-manage hosting on a shared server with all the essential features.' },
  { id: 's4', title: 'Reseller Hosting', icon: Server, description: 'Start your own hosting business. Resell hosting under your own brand with our powerful reseller packages.' },
  { id: 's5', title: 'VPS Hosting', icon: Cpu, description: 'The power of a dedicated server at an affordable price. Full root access, guaranteed resources, and high performance.' },
  { id: 's6', title: 'Domain Registration', icon: Globe, description: 'Find and register the perfect domain name for your business. Search across hundreds of TLDs at competitive prices.' },
];

export default function ServicesGrid({ services = [], onNavigate }) {
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">WHAT WE DO</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--c2i-blue-dark)] uppercase mb-4">OUR SERVICES</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            We offer a comprehensive suite of hosting and domain services designed to power your online presence and help your business grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayServices.slice(0, 6).map((service, idx) => {
            const Icon = service.icon || Server;
            return (
              <div
                key={service.id || idx}
                className="bg-white border border-gray-200 p-8 rounded-xl hover:border-[var(--c2i-blue-light)] hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => service.id && !service.id.startsWith('s') && onNavigate(`/hosting/${service.id}`)}
              >
                <div className="w-14 h-14 mb-6 flex items-center justify-center rounded-lg bg-[var(--c2i-blue-dark)]/5 group-hover:bg-[var(--c2i-blue-dark)] transition-colors duration-300">
                  <Icon size={28} strokeWidth={1.5} className="text-[var(--c2i-blue-light)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-[var(--c2i-blue-dark)] mb-3">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

