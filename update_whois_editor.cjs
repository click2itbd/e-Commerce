const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

// 1. Add UserCog icon
if (!code.includes('UserCog')) {
  code = code.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, UserCog } from 'lucide-react';"
  );
}

// 2. Add State
if (!code.includes('managingWhoisDomain')) {
  code = code.replace(
    'const [managingDnsDomain, setManagingDnsDomain] = useState<any>(null);',
    `const [managingDnsDomain, setManagingDnsDomain] = useState<any>(null);
  const [managingWhoisDomain, setManagingWhoisDomain] = useState<any>(null);
  const [whoisForm, setWhoisForm] = useState({
    firstName: '', lastName: '', email: '', phoneCountryCode: '+880', phoneNumber: '',
    companyName: '', address: '', city: '', state: '', zipcode: '', country: 'BD'
  });
  const [loadingWhois, setLoadingWhois] = useState(false);`
  );
}

// 3. Add Handlers
const whoisHandlers = `
  const handleManageWhois = (domain: DomainOrder) => {
    setManagingWhoisDomain(domain);
    setManagingDnsDomain(null);
    setManagingSettings(null);
    setManagingNsDomain(null);
    // Pre-fill with user details if available
    setWhoisForm(prev => ({
      ...prev,
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: user?.email || ''
    }));
  };

  const handleUpdateWhois = async (domain: DomainOrder) => {
    if (!whoisForm.firstName || !whoisForm.lastName || !whoisForm.email || !whoisForm.address || !whoisForm.phoneNumber) {
      toast.error('Please fill in all required fields (Name, Email, Phone, Address)');
      return;
    }
    
    setLoadingWhois(true);
    const loadingToast = toast.loading('Creating customer handle and updating WHOIS...');
    try {
      const response = await apiPost('/api/domain/manage', {
        command: 'update_contacts',
        domain: domain.domain,
        extraParams: { contact: whoisForm }
      });
      if (response.success) {
        toast.success(\`WHOIS updated successfully! New Handle: \${response.handle}\`, { id: loadingToast });
        setManagingWhoisDomain(null);
      } else {
        toast.error(response.error || 'Failed to update WHOIS', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error updating WHOIS', { id: loadingToast });
    } finally {
      setLoadingWhois(false);
    }
  };
`;

if (!code.includes('handleManageWhois')) {
  code = code.replace(
    'const handleManageDns = async (domain: DomainOrder) => {',
    whoisHandlers + '\n  const handleManageDns = async (domain: DomainOrder) => {'
  );
}

// 4. Add Button
if (!code.includes('<UserCog size={14} /> WHOIS')) {
  code = code.replace(
    /<Globe size=\{14\} \/> DNS\s*<\/button>/,
    `<Globe size={14} /> DNS
                                </button>
                                <button
                                  onClick={() => handleManageWhois(domain)}
                                  className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                                  title="Update WHOIS/Owner Contact"
                                >
                                  <UserCog size={14} /> WHOIS
                                </button>`
  );
}

// 5. Add UI
const whoisUI = `
                        {/* WHOIS Update Expanded Row */}
                        {managingWhoisDomain?.id === domain.id && (
                          <tr>
                            <td colSpan={5} className="p-0 border-b border-gray-100">
                              <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <UserCog size={18} className="text-orange-600" /> Update WHOIS / Owner Contact: {domain.domain}
                                  </h4>
                                  <button onClick={() => setManagingWhoisDomain(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                                </div>
                                
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                  <p className="text-sm text-gray-500 mb-4">Updating this form will create a new Customer Handle in the registry and assign it as the Owner, Admin, Tech, and Billing contact for this domain. It may take up to 24 hours to reflect in public WHOIS databases.</p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">First Name *</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.firstName} onChange={e => setWhoisForm({...whoisForm, firstName: e.target.value})} placeholder="John" />
                                    </div>
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">Last Name *</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.lastName} onChange={e => setWhoisForm({...whoisForm, lastName: e.target.value})} placeholder="Doe" />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-gray-600 mb-1 font-medium">Email Address *</label>
                                      <input type="email" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.email} onChange={e => setWhoisForm({...whoisForm, email: e.target.value})} placeholder="john@example.com" />
                                    </div>
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">Phone Number (without country code) *</label>
                                      <div className="flex gap-2">
                                        <input type="text" className="w-24 border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500 bg-gray-50 text-gray-500" value={whoisForm.phoneCountryCode} onChange={e => setWhoisForm({...whoisForm, phoneCountryCode: e.target.value})} />
                                        <input type="text" className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.phoneNumber} onChange={e => setWhoisForm({...whoisForm, phoneNumber: e.target.value})} placeholder="1712345678" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">Company Name (Optional)</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.companyName} onChange={e => setWhoisForm({...whoisForm, companyName: e.target.value})} placeholder="Acme LLC" />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-gray-600 mb-1 font-medium">Street Address *</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.address} onChange={e => setWhoisForm({...whoisForm, address: e.target.value})} placeholder="House 12, Road 4, Banani" />
                                    </div>
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">City *</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.city} onChange={e => setWhoisForm({...whoisForm, city: e.target.value})} placeholder="Dhaka" />
                                    </div>
                                    <div>
                                      <label className="block text-gray-600 mb-1 font-medium">Zip / Postal Code *</label>
                                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.zipcode} onChange={e => setWhoisForm({...whoisForm, zipcode: e.target.value})} placeholder="1213" />
                                    </div>
                                  </div>
                                  
                                  <div className="mt-6 flex justify-end">
                                    <button 
                                      onClick={() => handleUpdateWhois(domain)} 
                                      disabled={loadingWhois}
                                      className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      {loadingWhois ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                                      {loadingWhois ? 'Updating WHOIS...' : 'Update WHOIS Details'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
`;

if (!code.includes('WHOIS Update Expanded Row')) {
  code = code.replace(
    '{/* DNS Management Expanded Row */}',
    whoisUI + '\n                        {/* DNS Management Expanded Row */}'
  );
  fs.writeFileSync('src/components/MyServicesTab.tsx', code);
}
