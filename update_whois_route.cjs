const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

const newRoute = `
    } else if (command === 'set_whois_privacy') {
      const { isEnabled } = extraParams || {};
      const result = await domainProvider.updateWhoisPrivacy(domain, !!isEnabled);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json({ success: true, message: 'WHOIS Privacy updated' });
`;

if (!code.includes('set_whois_privacy')) {
  code = code.replace("} else if (command === 'set_lock') {", newRoute + "    } else if (command === 'set_lock') {");
  fs.writeFileSync('backend/src/routes/domain.ts', code);
}
