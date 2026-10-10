const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

// Add Eye/EyeOff icons
if (!code.includes('Eye, EyeOff')) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, Eye, EyeOff } from 'lucide-react';"
  );
}

// Add the handler
const handlers = `
  const handleTogglePrivacy = async (domainOrder: any, currentStatus: boolean) => {
    const loadingToast = toast.loading(currentStatus ? 'Disabling WHOIS Privacy...' : 'Enabling WHOIS Privacy...');
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'set_whois_privacy',
        domain: domainOrder.domain,
        extraParams: { isEnabled: !currentStatus }
      });
      if (response.success) {
        toast.success(currentStatus ? 'WHOIS Privacy disabled!' : 'WHOIS Privacy enabled!', { id: loadingToast });
        setDomainDetails({ ...domainDetails, is_whois_privacy_enabled: !currentStatus });
      } else {
        toast.error(response.error || 'Failed to update privacy status', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error updating privacy status', { id: loadingToast });
    }
  };
`;

if (!code.includes('handleTogglePrivacy')) {
  code = code.replace(
    'const handleRenew = async (domain: DomainOrder) => {',
    handlers + '\n  const handleRenew = async (domain: DomainOrder) => {'
  );
}

// Add the UI
const wppUI = `
                                    {/* WHOIS Privacy */}
                                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden mt-4 md:mt-0 col-span-1 md:col-span-2">
                                      <div className={\`absolute top-0 left-0 w-1 h-full \${domainDetails.is_whois_privacy_enabled ? 'bg-emerald-500' : 'bg-gray-400'}\`}></div>
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                            {domainDetails.is_whois_privacy_enabled ? <EyeOff size={16} className="text-emerald-600" /> : <Eye size={16} className="text-gray-500" />} 
                                            WHOIS Privacy (ID Protection)
                                          </h5>
                                          <p className="text-xs text-gray-500 mt-1 max-w-[400px]">Hides your personal contact information from the public WHOIS database to prevent spam and identity theft.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={!!domainDetails.is_whois_privacy_enabled}
                                            onChange={() => handleTogglePrivacy(domain, domainDetails.is_whois_privacy_enabled)}
                                            className="sr-only peer"
                                          />
                                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                                        </label>
                                      </div>
                                    </div>
`;

if (!code.includes('WHOIS Privacy (ID Protection)')) {
  code = code.replace(
    '</div>\n                                ) : (',
    wppUI + '\n                                  </div>\n                                ) : ('
  );
  fs.writeFileSync('src/components/MyServicesTab.tsx', code);
}
