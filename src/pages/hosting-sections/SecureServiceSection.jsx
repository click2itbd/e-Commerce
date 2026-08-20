import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function SecureServiceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--c2i-blue-dark)] mb-6 leading-tight">
              Secure service your website
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Protect your website with our state-of-the-art security features. From free SSL certificates to advanced DDoS protection, we have everything you need to keep your site safe and secure.
            </p>
            <ul className="space-y-4 mb-8">
              {['24/7 expert privacy protection', '24/7 customer support available', 'Secure Checkout & Payment Gateway'].map((item, i) => (
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
          <div className="flex items-center justify-center">
            <img src="/assets/cloud_server.jpg" alt="Secure Hosting" className="w-full max-w-md h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
