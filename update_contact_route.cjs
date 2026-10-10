const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

const newRoute = `
    } else if (command === 'update_contacts') {
      const { contact } = extraParams || {};
      if (!contact || !contact.firstName || !contact.lastName || !contact.email) {
        return res.status(400).json({ success: false, error: 'Incomplete contact details' });
      }
      try {
        const handle = await (domainProvider as any).createCustomerHandle(contact);
        const result = await (domainProvider as any).updateDomainContacts(domain, handle);
        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }
        return res.json({ success: true, message: 'WHOIS contacts updated successfully', handle });
      } catch (err: any) {
        return res.status(400).json({ success: false, error: err.message || 'Failed to update contacts' });
      }
`;

if (!code.includes('update_contacts')) {
  // Update allowed commands list first
  code = code.replace(
    "const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock', 'get_dns', 'update_dns']",
    "const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock', 'get_dns', 'update_dns', 'update_contacts', 'set_whois_privacy']"
  );
  
  code = code.replace("} else if (command === 'set_whois_privacy') {", newRoute + "    } else if (command === 'set_whois_privacy') {");
  fs.writeFileSync('backend/src/routes/domain.ts', code);
}
