const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("import SupportPage from './pages/hosting/SupportPage';", "import { Navigate } from 'react-router-dom';");
content = content.replace("<Route path=\"/support\" element={<SupportPage />} />", "<Route path=\"/support\" element={<Navigate to=\"/profile?tab=tickets\" replace />} />");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Patched App.tsx');
