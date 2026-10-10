const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

if (!code.includes("'get_dns'")) {
  code = code.replace(
    "const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock'];",
    "const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock', 'get_dns', 'update_dns'];"
  );
  
  const block = `
    if (command === 'get_dns') {
      if (!(provider as any).getDnsZone) return res.status(400).json({ success: false, error: 'Not supported' });
      result = await (provider as any).getDnsZone(domain);
      return res.json({ success: result.success, data: result.data, error: result.error });
    }

    if (command === 'update_dns') {
      if (!(provider as any).updateDnsRecords) return res.status(400).json({ success: false, error: 'Not supported' });
      result = await (provider as any).updateDnsRecords(domain, extraParams?.records || []);
      return res.json({ success: result.success, error: result.error });
    }
`;

  code = code.replace(
    "if (command === 'set_lock') {",
    block + "\n    if (command === 'set_lock') {"
  );
  fs.writeFileSync('backend/src/routes/domain.ts', code);
}
