import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function SecureDomainSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="flex items-center justify-center order-2 lg:order-1">
            <img src="/assets/secure_domain.jpg" alt="Domain Registration" className="w-full max-w-md h-auto rounded-2xl shadow-2xl" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--c2i-blue-dark)] mb-6 leading-tight">
              Secure domain registration
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Register your domain with confidence. We offer competitive pricing, free WHOIS privacy protection, and seamless DNS management to keep your domain secure and yours forever.
            </p>
            <ul className="space-y-4 mb-8">
              {['Free WHOIS privacy protection', 'Easy DNS management tools', 'Domain lock for added security'].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <a href="/hosting" className="text-[var(--c2i-blue-light)] font-bold hover:underline text-sm">
              Read more...
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
