const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

// The file previously stored apiSettings inside settingsFormData.
// We need to fetch and save api_keys separately.
const imports = `import { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { db } from '../../../../firebase';`;
if (!content.includes('import { doc, getDoc, setDoc }')) {
    content = content.replace("import { useSettings } from '../../../../context/SettingsContext';", imports + "\nimport { useSettings } from '../../../../context/SettingsContext';");
}

const stateToAdd = `
  const [apiKeys, setApiKeys] = useState<{ dynadotApiKey?: string, usdToBdtRate?: number, isSandboxMode?: boolean }>({});
  
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'api_keys'));
        if (snap.exists()) {
          setApiKeys(snap.data());
        }
      } catch (e) {
        console.error('Error fetching api keys', e);
      }
    };
    fetchApiKeys();
  }, []);
`;

content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);' + stateToAdd);

// In handleSaveSettings:
const saveToAdd = `
      if (settingsTab === 'domain_reseller') {
        await setDoc(doc(db, 'settings', 'api_keys'), apiKeys, { merge: true });
      }
`;
content = content.replace("await updateSettings(settingsFormData);", "await updateSettings(settingsFormData);" + saveToAdd);

// In the UI: Replace settingsFormData.apiSettings with apiKeys
content = content.replace(/settingsFormData\.apiSettings\?\.dynadotApiKey/g, 'apiKeys.dynadotApiKey');
content = content.replace(/setSettingsFormData\(\{\.\.\.settingsFormData, apiSettings: \{\.\.\.settingsFormData\.apiSettings, dynadotApiKey: e\.target\.value\}\}\)/g, 'setApiKeys({...apiKeys, dynadotApiKey: e.target.value})');

content = content.replace(/settingsFormData\.apiSettings\?\.usdToBdtRate/g, 'apiKeys.usdToBdtRate');
content = content.replace(/setSettingsFormData\(\{\.\.\.settingsFormData, apiSettings: \{\.\.\.settingsFormData\.apiSettings, usdToBdtRate: parseFloat\(e\.target\.value\)\}\}\)/g, 'setApiKeys({...apiKeys, usdToBdtRate: parseFloat(e.target.value)})');

content = content.replace(/settingsFormData\.apiSettings\?\.isSandboxMode/g, 'apiKeys.isSandboxMode');
content = content.replace(/setSettingsFormData\(\{\.\.\.settingsFormData, apiSettings: \{\.\.\.settingsFormData\.apiSettings, isSandboxMode: !settingsFormData\.apiSettings\?\.isSandboxMode\}\}\)/g, 'setApiKeys({...apiKeys, isSandboxMode: !apiKeys.isSandboxMode})');

fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', content, 'utf8');
console.log('Patched Settings.tsx for separate API keys doc');
