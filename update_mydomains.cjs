const fs = require('fs');
let code = fs.readFileSync('src/components/MyDomainsTab.tsx', 'utf8');

if (!code.includes('managingSettings')) {
  // Add state
  code = code.replace(
    'const [managingDomain, setManagingDomain] = useState<any>(null);',
    "const [managingDomain, setManagingDomain] = useState<any>(null);\n  const [managingSettings, setManagingSettings] = useState<any>(null);\n  const [domainDetails, setDomainDetails] = useState<any>(null);\n  const [loadingDetails, setLoadingDetails] = useState(false);"
  );

  // Add Lucide icons
  code = code.replace(
    'Globe, Server, Save, Loader2, CalendarClock, Settings',
    'Globe, Server, Save, Loader2, CalendarClock, Settings, Lock, Unlock, Key, Shield'
  );

  // Add handlers
  const handlers = `
  const handleManageSettings = async (domainOrder: any) => {
    setManagingSettings(domainOrder);
    setManagingDomain(null);
    setLoadingDetails(true);
    setDomainDetails(null);
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'get_details',
        domain: domainOrder.domain
      });
      if (response.success && response.data) {
        setDomainDetails(response.data);
      } else {
        toast.error(response.error || 'Failed to fetch domain details');
      }
    } catch (e: any) {
      toast.error('Error fetching details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleLock = async (domainOrder: any, currentStatus: boolean) => {
    const loadingToast = toast.loading(currentStatus ? 'Unlocking domain...' : 'Locking domain...');
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'set_lock',
        domain: domainOrder.domain,
        extraParams: { isLocked: !currentStatus }
      });
      if (response.success) {
        toast.success(currentStatus ? 'Domain unlocked successfully!' : 'Domain locked successfully!', { id: loadingToast });
        setDomainDetails({ ...domainDetails, is_locked: !currentStatus });
      } else {
        toast.error(response.error || 'Failed to update lock status', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error updating lock status', { id: loadingToast });
    }
  };
`;
  
  code = code.replace('const handleUpdateNameServers', handlers + '\n  const handleUpdateNameServers');

  // Add button in the list
  code = code.replace(
    '<Server size={16} /> Manage DNS\n                </button>',
    `<Server size={16} /> Manage DNS\n                </button>\n                <button \n                  onClick={() => handleManageSettings(domainOrder)}\n                  className="px-4 py-2 border border-gray-200 hover:border-gray-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"\n                >\n                  <Settings size={16} /> Settings & Security\n                </button>`
  );

  // Add expanded section
  const settingsSection = `
            {managingSettings?.id === domainOrder.id && (
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <Shield size={18} /> Settings & Security
                  </h4>
                  <button onClick={() => setManagingSettings(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Close</button>
                </div>
                
                {loadingDetails ? (
                  <div className="flex items-center gap-2 text-blue-600 p-4 bg-white rounded-lg border border-gray-200">
                    <Loader2 size={18} className="animate-spin" /> Fetching domain details from provider...
                  </div>
                ) : domainDetails ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Registrar Lock */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                            {domainDetails.is_locked ? <Lock size={16} className="text-emerald-600" /> : <Unlock size={16} className="text-amber-500" />} 
                            Registrar Lock
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">Prevents unauthorized domain transfers.</p>
                        </div>
                        <div className={\`px-2 py-1 rounded text-xs font-bold \${domainDetails.is_locked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>
                          {domainDetails.is_locked ? 'LOCKED' : 'UNLOCKED'}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleLock(domainOrder, domainDetails.is_locked)}
                        className={\`mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors w-full \${domainDetails.is_locked ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}\`}
                      >
                        {domainDetails.is_locked ? 'Unlock Domain' : 'Lock Domain'}
                      </button>
                    </div>

                    {/* EPP / Auth Code */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                        <Key size={16} className="text-blue-600" /> Transfer Auth Code
                      </h5>
                      <p className="text-xs text-gray-500 mb-3">Required to transfer this domain to another registrar.</p>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all text-center select-all">
                        {domainDetails.auth_code || 'Not available'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100">
                    Could not retrieve domain settings.
                  </div>
                )}
              </div>
            )}
  `;

  code = code.replace(
    '{managingDomain?.id === domainOrder.id && (',
    settingsSection + '\n            {managingDomain?.id === domainOrder.id && ('
  );
  
  fs.writeFileSync('src/components/MyDomainsTab.tsx', code);
}
