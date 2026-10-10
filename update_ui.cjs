const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

// Add Lucide Icons
if (!code.includes('Lock, Unlock, Key, Shield')) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, Lock, Unlock, Key, Shield } from 'lucide-react';"
  );
}

// Add state variables
if (!code.includes('managingSettings')) {
  code = code.replace(
    'const [domainLoading, setDomainLoading] = useState<string | null>(null);',
    `const [domainLoading, setDomainLoading] = useState<string | null>(null);
  const [managingSettings, setManagingSettings] = useState<any>(null);
  const [domainDetails, setDomainDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);`
  );
}

// Add handler functions
const handlers = `
  const handleManageSettings = async (domain: DomainOrder) => {
    setManagingSettings(domain);
    setManagingNsDomain(null);
    setLoadingDetails(true);
    setDomainDetails(null);
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'get_details',
        domain: domain.domain
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

if (!code.includes('handleManageSettings')) {
  code = code.replace(
    'const handleRenew = async (domain: DomainOrder) => {',
    handlers + '\n  const handleRenew = async (domain: DomainOrder) => {'
  );
}

// Update the actions column in the table
const newTableBody = `
                  <tbody className="divide-y divide-gray-100">
                    {domains.map(domain => {
                      const isActive = domain.status === 'active' || domain.status === 'completed' || domain.status === 'registered';
                      return (
                      <React.Fragment key={domain.id}>
                        <tr className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-[#081621]">{domain.domain}</td>
                          <td className="px-6 py-4">{getStatusBadge(domain.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <label className={\`relative inline-flex items-center \${isActive ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}\`}>
                              <input
                                type="checkbox"
                                checked={!!domain.autoRenew}
                                onChange={() => isActive && handleToggleAutoRenew('domain', domain)}
                                disabled={!isActive}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            {isActive ? (
                              <>
                                <button
                                  onClick={() => setManagingNsDomain(domain)}
                                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"
                                  title="Manage Nameservers"
                                >
                                  <Server size={14} /> NS
                                </button>
                                <button
                                  onClick={() => handleManageSettings(domain)}
                                  className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                  <Shield size={14} /> Security
                                </button>
                                <button
                                  onClick={() => handleRenew(domain)}
                                  disabled={domainLoading === domain.id}
                                  className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#EF4444] transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <RotateCcw size={14} />
                                  {domainLoading === domain.id ? 'Processing...' : 'Renew'}
                                </button>
                              </>
                            ) : domain.status === 'failed' ? (
                              <button
                                onClick={() => window.open('/support', '_blank')}
                                className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                Contact Support
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">Pending...</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* Settings & Security Expanded Row */}
                        {managingSettings?.id === domain.id && (
                          <tr>
                            <td colSpan={5} className="p-0 border-b border-gray-100">
                              <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Shield size={18} className="text-blue-600" /> Settings & Security: {domain.domain}
                                  </h4>
                                  <button onClick={() => setManagingSettings(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                                </div>
                                
                                {loadingDetails ? (
                                  <div className="flex items-center gap-2 text-blue-600 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Loader2 size={18} className="animate-spin" /> Fetching secure domain data from registry...
                                  </div>
                                ) : domainDetails ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Registrar Lock */}
                                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                      <div className={\`absolute top-0 left-0 w-1 h-full \${domainDetails.is_locked ? 'bg-emerald-500' : 'bg-amber-500'}\`}></div>
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                            {domainDetails.is_locked ? <Lock size={16} className="text-emerald-600" /> : <Unlock size={16} className="text-amber-500" />} 
                                            Registrar Lock
                                          </h5>
                                          <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Prevents unauthorized domain transfers to other providers.</p>
                                        </div>
                                        <div className={\`px-3 py-1 rounded-full text-xs font-bold \${domainDetails.is_locked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}\`}>
                                          {domainDetails.is_locked ? 'LOCKED' : 'UNLOCKED'}
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => handleToggleLock(domain, domainDetails.is_locked)}
                                        className={\`mt-4 px-4 py-2 text-sm font-bold rounded-lg transition-colors w-full flex items-center justify-center gap-2 \${domainDetails.is_locked ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}\`}
                                      >
                                        {domainDetails.is_locked ? <Unlock size={16}/> : <Lock size={16}/>}
                                        {domainDetails.is_locked ? 'Unlock Domain' : 'Lock Domain'}
                                      </button>
                                    </div>

                                    {/* EPP / Auth Code */}
                                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                      <h5 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                                        <Key size={16} className="text-blue-600" /> Transfer Auth/EPP Code
                                      </h5>
                                      <p className="text-xs text-gray-500 mb-4">Required to transfer this domain to another registrar. Keep this secret!</p>
                                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all text-center select-all flex items-center justify-center min-h-[46px] shadow-inner text-gray-800 font-bold tracking-wider">
                                        {domainDetails.auth_code || 'Not available'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                                    Could not retrieve domain settings. Please try again.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
`;

const oldTbodyRegex = /<tbody className="divide-y divide-gray-100">[\s\S]*?<\/tbody>/;

code = code.replace(oldTbodyRegex, newTableBody);
fs.writeFileSync('src/components/MyServicesTab.tsx', code);