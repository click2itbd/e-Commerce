const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

const targetRegex = /await updateSettings\(settingsFormData\);\s+if \(settingsTab === 'domain_reseller'\) \{\s+(console\.log\("Saving api keys:", apiKeys\); )?await setDoc\(doc\(db, 'settings', 'api_keys'\), apiKeys, \{ merge: true \}\);\s+\}/;

const replacement = `if (settingsTab === 'domain_reseller') {
          await setDoc(doc(db, 'settings', 'api_keys'), apiKeys, { merge: true });
        } else {
          await updateSettings(settingsFormData);
        }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', content, 'utf8');
console.log('Fixed handleSaveSettings');
