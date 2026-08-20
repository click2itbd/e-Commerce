const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

const target = `await updateSettings(settingsFormData);
        if (settingsTab === 'domain_reseller') {
          await setDoc(doc(db, 'settings', 'api_keys'), apiKeys, { merge: true });
        }`;

const replacement = `if (settingsTab === 'domain_reseller') {
          await setDoc(doc(db, 'settings', 'api_keys'), apiKeys, { merge: true });
        }
        await updateSettings(settingsFormData);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', content, 'utf8');
console.log('Swapped save order');
