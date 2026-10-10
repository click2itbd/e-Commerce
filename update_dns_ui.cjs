const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

// 1. Add Globe, Plus, Trash icons
if (!code.includes('Globe, Plus, Trash')) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, Globe, Plus, Trash, Save } from 'lucide-react';"
  );
}

// 2. Add State for DNS
if (!code.includes('managingDnsDomain')) {
  code = code.replace(
    'const [managingSettings, setManagingSettings] = useState<any>(null);',
    `const [managingSettings, setManagingSettings] = useState<any>(null);
  const [managingDnsDomain, setManagingDnsDomain] = useState<any>(null);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);`
  );
}

// 3. Add DNS Handlers
const dnsHandlers = `
  const handleManageDns = async (domain: DomainOrder) => {
    setManagingDnsDomain(domain);
    setManagingSettings(null);
    setManagingNsDomain(null);
    setLoadingDns(true);
    setDnsRecords([]);
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'get_dns',
        domain: domain.domain
      });
      if (response.success && response.data?.records) {
        setDnsRecords(response.data.records);
      } else {
        toast.error(response.error || 'Failed to fetch DNS records (Nameservers must be default)');
      }
    } catch (e: any) {
      toast.error('Error fetching DNS');
    } finally {
      setLoadingDns(false);
    }
  };

  const handleUpdateDns = async (domain: DomainOrder) => {
    const loadingToast = toast.loading('Saving DNS records...');
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'update_dns',
        domain: domain.domain,
        extraParams: { records: dnsRecords }
      });
      if (response.success) {
        toast.success('DNS records updated successfully!', { id: loadingToast });
      } else {
        toast.error(response.error || 'Failed to update DNS records', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error saving DNS', { id: loadingToast });
    }
  };

  const handleAddDnsRecord = () => {
    setDnsRecords([{ type: 'A', name: '', value: '', ttl: 3600 }, ...dnsRecords]);
  };

  const handleRemoveDnsRecord = (index: number) => {
    const newRecords = [...dnsRecords];
    newRecords.splice(index, 1);
    setDnsRecords(newRecords);
  };

  const handleDnsChange = (index: number, field: string, value: any) => {
    const newRecords = [...dnsRecords];
    newRecords[index][field] = value;
    setDnsRecords(newRecords);
  };
`;

if (!code.includes('handleManageDns')) {
  code = code.replace(
    'const handleManageSettings = async (domain: DomainOrder) => {',
    dnsHandlers + '\n  const handleManageSettings = async (domain: DomainOrder) => {'
  );
}

// 4. Update Actions column to include DNS button
if (!code.includes('<Globe size={14} /> DNS')) {
  code = code.replace(
    /<Server size=\{14\} \/> NS\s*<\/button>/,
    `<Server size={14} /> NS
                                </button>
                                <button
                                  onClick={() => handleManageDns(domain)}
                                  className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1"
                                  title="Manage DNS Records"
                                >
                                  <Globe size={14} /> DNS
                                </button>`
  );
}

// 5. Add DNS Expanded Row UI
const dnsUI = `
                        {/* DNS Management Expanded Row */}
                        {managingDnsDomain?.id === domain.id && (
                          <tr>
                            <td colSpan={5} className="p-0 border-b border-gray-100">
                              <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Globe size={18} className="text-purple-600" /> DNS Zone Editor: {domain.domain}
                                  </h4>
                                  <button onClick={() => setManagingDnsDomain(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                                </div>
                                
                                {loadingDns ? (
                                  <div className="flex items-center gap-2 text-purple-600 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Loader2 size={18} className="animate-spin" /> Fetching DNS Zone...
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                    <div className="flex justify-between items-center mb-4">
                                      <p className="text-sm text-gray-500">Manage A, CNAME, TXT, MX records. Note: Domain must use default Openprovider nameservers.</p>
                                      <button onClick={handleAddDnsRecord} className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-[#EF4444] transition-colors">
                                        <Plus size={14} /> Add Record
                                      </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                          <tr>
                                            <th className="px-4 py-2 font-semibold rounded-tl-lg">Type</th>
                                            <th className="px-4 py-2 font-semibold">Name (Host)</th>
                                            <th className="px-4 py-2 font-semibold">Value (Target)</th>
                                            <th className="px-4 py-2 font-semibold">TTL</th>
                                            <th className="px-4 py-2 font-semibold rounded-tr-lg"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {dnsRecords.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No DNS records found.</td></tr>
                                          ) : dnsRecords.map((rec, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                              <td className="px-4 py-2">
                                                <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:border-purple-500" value={rec.type} onChange={e => handleDnsChange(idx, 'type', e.target.value)}>
                                                  <option value="A">A</option>
                                                  <option value="AAAA">AAAA</option>
                                                  <option value="CNAME">CNAME</option>
                                                  <option value="MX">MX</option>
                                                  <option value="TXT">TXT</option>
                                                </select>
                                              </td>
                                              <td className="px-4 py-2">
                                                <input type="text" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-purple-500" value={rec.name} onChange={e => handleDnsChange(idx, 'name', e.target.value)} placeholder="@ or www" />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input type="text" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-purple-500" value={rec.value} onChange={e => handleDnsChange(idx, 'value', e.target.value)} placeholder="192.168.1.1" />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input type="number" className="border border-gray-300 rounded px-2 py-1 text-sm w-20 outline-none focus:border-purple-500" value={rec.ttl} onChange={e => handleDnsChange(idx, 'ttl', parseInt(e.target.value))} />
                                              </td>
                                              <td className="px-4 py-2 text-right">
                                                <button onClick={() => handleRemoveDnsRecord(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash size={16} /></button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                      <button onClick={() => handleUpdateDns(domain)} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
                                        <Save size={16} /> Save DNS Zone
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
`;

if (!code.includes('DNS Management Expanded Row')) {
  code = code.replace(
    '{/* Settings & Security Expanded Row */}',
    dnsUI + '\n                        {/* Settings & Security Expanded Row */}'
  );
  fs.writeFileSync('src/components/MyServicesTab.tsx', code);
}
