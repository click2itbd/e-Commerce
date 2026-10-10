const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

// Add SSL states
if (!code.includes('const [sslCerts, setSslCerts]')) {
  code = code.replace(
    'const [hosting, setHosting] = useState<HostingAccount[]>([]);',
    'const [hosting, setHosting] = useState<HostingAccount[]>([]);\n  const [sslCerts, setSslCerts] = useState<any[]>([]);'
  );
  
  // Add fetching
  code = code.replace(
    "const qHosting = query(collection(db, 'hostingAccounts'), where('userId', '==', user.uid), limit(100));",
    "const qSsl = query(collection(db, 'sslOrders'), where('userId', '==', user.uid), limit(100));\n    const unsubSsl = onSnapshot(qSsl, (snap) => {\n      setSslCerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n    });\n    const qHosting = query(collection(db, 'hostingAccounts'), where('userId', '==', user.uid), limit(100));"
  );
  
  // Return unsubSsl in cleanup
  code = code.replace(
    "return () => {\n      unsubDomains();\n      unsubHosting();\n      unsubOrders();\n    };",
    "return () => {\n      unsubDomains();\n      unsubHosting();\n      unsubOrders();\n      unsubSsl();\n    };"
  );
}

// Add SSL Tabs UI
if (!code.includes('SSL Certificates ({sslCerts.length})')) {
  code = code.replace(
    /Domains \(\{domains\.length\}\)\s*<\/button>/,
    `Domains ({domains.length})
          </button>
          <button
            onClick={() => setActiveTab('ssl')}
            className={\`px-6 py-4 font-semibold text-sm border-b-2 transition-colors \${activeTab === 'ssl' ? 'border-[#EF4444] text-[#EF4444]' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
          >
            SSL Certificates ({sslCerts.length})
          </button>`
  );
}

// Ensure activeTab state supports 'ssl' (assume it is a string)
if (!code.includes("activeTab === 'ssl' && (")) {
  const sslTabRender = `
        {activeTab === 'ssl' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">SSL Certificates</h3>
                <p className="text-sm text-gray-500">Manage your active SSL certificates and configurations.</p>
              </div>
              <button onClick={() => navigate('/ssl')} className="bg-[#081621] text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800 transition-colors">
                Buy SSL
              </button>
            </div>
            
            {sslCerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">No SSL Certificates found</h3>
                <p className="text-gray-500 mb-6">You don't have any SSL certificates active right now.</p>
                <button onClick={() => navigate('/ssl')} className="bg-[#EF4444] text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition-colors">
                  Protect Your Website
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold">Domain</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sslCerts.map((cert) => (
                        <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{cert.name}</div>
                            <div className="text-xs text-gray-500">Ordered: {new Date(cert.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {cert.domain || <span className="text-orange-500 italic">Not Configured</span>}
                          </td>
                          <td className="px-6 py-4">
                            {cert.status === 'pending_configuration' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                <AlertTriangle size={12} /> Pending Configuration
                              </span>
                            )}
                            {cert.status === 'processing' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                <Loader2 size={12} className="animate-spin" /> Processing
                              </span>
                            )}
                            {cert.status === 'active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {cert.status === 'pending_configuration' && (
                              <button
                                onClick={() => toast('SSL Configuration UI coming soon. Please contact support.')}
                                className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded text-xs font-bold hover:bg-orange-100 transition-colors"
                              >
                                Configure SSL
                              </button>
                            )}
                            {cert.status === 'active' && (
                              <button
                                onClick={() => toast('Certificate download coming soon.')}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-100 transition-colors"
                              >
                                Download Cert
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
`;

  code = code.replace(
    "{activeTab === 'billing' && (",
    sslTabRender + "\n        {activeTab === 'billing' && ("
  );
  
  fs.writeFileSync('src/components/MyServicesTab.tsx', code);
}
