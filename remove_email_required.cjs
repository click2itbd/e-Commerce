const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('type="email"') && content.includes('required')) {
        let originalContent = content;
        
        // Remove `required` from input type="email"
        content = content.replace(/<input[^>]*type="email"[^>]*>/g, (match) => {
          if (match.includes('required')) {
            return match.replace(/\s+required\b/, '');
          }
          return match;
        });

        // Also check if `required` is placed before `type="email"`
        content = content.replace(/<input\s+required\s+type="email"[^>]*>/g, (match) => {
          return match.replace(/\s+required\b/, '');
        });

        // Handle JSX formatting where it spans multiple lines
        content = content.replace(/<input\s+type="email"\s+required\s+/g, '<input type="email" ');
        content = content.replace(/type="email"\s+required\n/g, 'type="email"\n');
        
        // Just directly remove "required" from the Vendor form because I know it's there
        if (fullPath.includes('Vendors.tsx')) {
           content = content.replace(/type="email"\s+required/g, 'type="email"');
        }

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Removed required email from ${fullPath}`);
        }
      }
    }
  }
}

processDir('src');
