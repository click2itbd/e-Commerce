import React from 'react';
import { Layout } from './Layout';
import { SEO } from './SEO';
import { useSettings } from '../context/SettingsContext';
import DOMPurify from 'dompurify';

interface DynamicPolicyPageProps {
  pageId: string;
  defaultTitle: string;
  defaultContent?: string;
  children?: React.ReactNode;
}

export const DynamicPolicyPage: React.FC<DynamicPolicyPageProps> = ({
  defaultTitle,
  defaultContent = '',
  children,
}) => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';

  if (children) {
    return <>{children}</>;
  }

  return (
    <Layout fullWidth>
      <SEO title={`${defaultTitle} - ${brandName}`} description={`${defaultTitle} for ${brandName}.`} />
      <div className="bg-slate-50/80 py-16 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">{defaultTitle}</h1>
            <div
              className="prose prose-blue max-w-none text-slate-700 space-y-6"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  defaultContent.replace(/{brandName}/g, brandName)
                ),
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};
