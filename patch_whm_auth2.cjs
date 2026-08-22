const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

// The specific testApiConnection WHM auth header still has `whm ${config.hostingApiKey}`
// We need to replace ONLY the one inside testApiConnection (before the signal: controller.signal line)
// Use a targeted replacement for the section with controller.signal nearby

const old = `'Authorization': \`whm \${config.hostingApiKey}\`,
              'Accept': 'application/json',
            },
            signal: controller.signal,`;

const newVal = `'Authorization': \`whm \${username}:\${config.hostingApiKey}\`,
              'Accept': 'application/json',
            },
            signal: controller.signal,`;

if (content.includes(old)) {
  content = content.replace(old, newVal);
  fs.writeFileSync('functions/index.js', content);
  console.log('✅ Fixed testApiConnection auth header to use username:token format');
} else {
  console.log('❌ Pattern not found - checking nearby content...');
  const idx = content.indexOf('Authorization');
  const snippets = content.match(/Authorization.*?whm.*?\n/g);
  console.log('Found auth headers:', snippets);
}
