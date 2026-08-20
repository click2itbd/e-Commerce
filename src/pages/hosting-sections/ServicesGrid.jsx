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
    <div className="container mx-auto pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {displayServices.slice(0, 6).map((service, idx) => {
          const Icon = service.icon || Server;
          return (
            <div
              key={service.id || idx}
              className="bg-[#0a1628] border border-gray-800 p-6 sm:p-8 rounded-xl hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group cursor-pointer"
              onClick={() => service.id && !service.id.startsWith('s') && onNavigate(`/hosting/${service.id}`)}
            >
              <div className="w-14 h-14 mb-6 flex items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500 transition-colors duration-300">
                <Icon size={28} strokeWidth={1.5} className="text-blue-400 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{service.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{service.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
