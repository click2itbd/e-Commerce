const fs = require('fs');
let code = fs.readFileSync('src/components/MyServicesTab.tsx', 'utf8');

const loginHandler = `
  const handleCpanelLogin = async (account: HostingAccount) => {
    if (!account.providerAccountId) return;
    const loadingToast = toast.loading('Generating secure login session...');
    try {
      const response = await apiPost('/api/hosting/sso', { providerAccountId: account.providerAccountId });
      if (response.success && response.url) {
        toast.success('Login session created!', { id: loadingToast });
        window.open(response.url, '_blank');
      } else {
        toast.error(response.error || 'Failed to login to cPanel', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error connecting to server', { id: loadingToast });
    }
  };
`;

if (!code.includes('handleCpanelLogin')) {
  code = code.replace(
    'const handleFetchUsage = async (account: HostingAccount) => {',
    loginHandler + '\n  const handleFetchUsage = async (account: HostingAccount) => {'
  );
}

const loginButtonHtml = `
                          <button
                            onClick={() => handleCpanelLogin(account)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <ExternalLink size={12} />
                            Log in to cPanel
                          </button>
`;

if (!code.includes('Log in to cPanel')) {
  code = code.replace(
    /<a\s+href=\{account\.controlPanelUrl\}[\s\S]*?cPanel\s*<\/a>/,
    loginButtonHtml
  );
  fs.writeFileSync('src/components/MyServicesTab.tsx', code);
}
