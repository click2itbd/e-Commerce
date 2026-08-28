const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      search(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      
      const emailInputs = content.match(/<input[^>]*type="email"[^>]*>/g) || [];
      const requiredEmailInputs = emailInputs.filter(m => m.includes('required'));
      
      if (requiredEmailInputs.length > 0) {
        console.log(`REQUIRED EMAIL in: ${full}`);
      }
    }
  }
}
search('src');
