const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';

if (!c.includes('<Route path="/dashboard" element={<Navigate to="/profile" />} />')) {
  // Add the Navigate import if missing
  if (!c.includes('Navigate')) {
    c = c.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*'react-router-dom';/, "import { $1, Navigate } from 'react-router-dom';");
  }
  
  // Add the route redirect
  c = c.replace(/<Route path="\/profile" element=\{<Profile \/>\} \/>/, "<Route path=\"/dashboard\" element={<Navigate to=\"/profile\" replace />} />\n              <Route path=\"/profile\" element={<Profile />} />");
  
  fs.writeFileSync('src/App.tsx', c);
  console.log('Added redirect from /dashboard to /profile');
}