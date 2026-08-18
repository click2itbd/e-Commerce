import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-[#0a1628] pt-32 pb-20 px-4 text-center border-b border-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xl text-blue-100 max-w-2xl mx-auto opacity-90 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
