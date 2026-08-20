const fs = require('fs');

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Add Globe to lucide-react imports
if (!content.includes('Globe')) {
    content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Globe, Server, Save } from 'lucide-react';");
}
if (!content.includes('Globe')) {
    // Fallback if regex failed
    content = content.replace("import { ", "import { Globe, Server, Save, ");
}

// Add state for domains
const domainState = `
  const [myDomains, setMyDomains] = useState<any[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [managingDomain, setManagingDomain] = useState<any>(null);
  const [nsValues, setNsValues] = useState({ ns0: '', ns1: '' });
  const [savingNs, setSavingNs] = useState(false);
`;
if (!content.includes('setMyDomains')) {
    content = content.replace("const [activeTab, setActiveTab] = useState('profile');", "const [activeTab, setActiveTab] = useState('profile');" + domainState);
}

// Fetch domains effect
const fetchDomainsEffect = `
  useEffect(() => {
    if (activeTab === 'my_domains' && currentUser) {
      const fetchDomains = async () => {
        setDomainsLoading(true);
        try {
          const q = query(
            collection(db, 'domainOrders'),
            where('customerId', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          const doms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyDomains(doms);
        } catch (error) {
          console.error("Error fetching domains:", error);
        } finally {
          setDomainsLoading(false);
        }
      };
      fetchDomains();
    }
  }, [activeTab, currentUser]);
`;
if (!content.includes('activeTab === \'my_domains\' && currentUser')) {
    content = content.replace("useEffect(() => {", fetchDomainsEffect + "\n  useEffect(() => {");
}

// Add tab to the list
content = content.replace("{ id: 'orders', label: 'My Orders', icon: Package },", "{ id: 'orders', label: 'My Orders', icon: Package },\n              { id: 'my_domains', label: 'My Domains', icon: Globe },");

// Add NS update function
const manageFunctions = `
  const handleUpdateNameServers = async (domain: string) => {
    setSavingNs(true);
    try {
      // Need httpsCallable
      // Actually we will just fetch to the cloud function URL for simplicity or use httpsCallable
    } catch(e) {
      console.log(e);
    }
  }
`;

// Wait, using httpsCallable is better. Let's just create a separate component `MyDomainsTab.tsx` and import it to keep `Profile.tsx` clean!
