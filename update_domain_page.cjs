const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/DomainPage.tsx', 'utf8');

const bulkButton = `
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => navigate('/domain/transfer')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                <Globe size={16} /> Transfer Domain
              </button>
              <button onClick={() => navigate('/domain/bulk')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                <Search size={16} /> Bulk Search
              </button>
            </div>
`;

if (!code.includes('/domain/bulk')) {
  // Try to find the transfer domain button to replace or append to
  if (code.includes('Transfer Domain')) {
    code = code.replace(
      /<button onClick=\{[^}]+\} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">\s*<Globe size=\{16\} \/> Transfer Domain\s*<\/button>/,
      `<button onClick={() => navigate('/domain/transfer')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                <Globe size={16} /> Transfer Domain
              </button>
              <button onClick={() => navigate('/domain/bulk')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
                <Search size={16} /> Bulk Search
              </button>`
    );
  } else {
    // Just put it below the form
    code = code.replace(
      /<\/form>/,
      '</form>\n' + bulkButton
    );
  }
  fs.writeFileSync('src/pages/hosting/DomainPage.tsx', code);
}
