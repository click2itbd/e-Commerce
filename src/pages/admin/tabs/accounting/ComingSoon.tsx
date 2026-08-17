import React from 'react';
import { Book } from 'lucide-react';

const ComingSoon = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 capitalize">
          <Book className="text-[#EF4444]" /> Coming Soon
        </h2>
      </div>
      <div className="p-6">
        <div className="text-center py-12 text-gray-400">
          <Book size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold text-lg capitalize">Coming Soon Module</p>
          <p className="text-sm">এই ফিচারটি শীঘ্রই আসছে।</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
