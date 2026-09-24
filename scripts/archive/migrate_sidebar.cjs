const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const startIdx = c.indexOf('{/* Section 2: Domain & Web Hosting */}');
const endIdx = c.indexOf('{/* Section 3: Sale & Customer */}');
if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `            {/* Section 2: Domain & Web Hosting */}
            {(mode === 'all' || mode === 'hosting') && (!isStaff || isAdmin || isManager) && (
              <div className="px-4 mb-3">
                <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1 px-3 flex items-center gap-1.5">
                  <Globe size={12} className="text-blue-600" /> Domain & Web Hosting
                </div>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin/billing')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-purple-600 font-bold hover:bg-purple-50"
                  >
                    <ArrowLeftRight size={16} className="text-purple-600" />
                    <span>Web Host Billing Dashboard</span>
                  </button>
                )}
              </div>
            )}
            
            `;
  c = c.slice(0, startIdx) + replacement + c.slice(endIdx);
  fs.writeFileSync('src/pages/AdminDashboard.tsx', c);
  console.log('Successfully updated AdminDashboard.');
} else {
  console.log('Could not find indices');
}
