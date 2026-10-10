const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

if (!code.includes("'get_details'")) {
  code = code.replace(
    "const allowedCommands = ['set_ns', 'renew'];",
    "const allowedCommands = ['set_ns', 'renew', 'get_details', 'set_lock'];"
  );
  
  const oldLogicRegex = /if \(command === 'set_ns'\) \{[\s\S]*?if \(command === 'renew'\) \{[\s\S]*?return res\.json\(\{ success: result\.success, data: result, error: result\.error \}\);\s*\}/;
  
  const switchBlock = `
    let result: any;
    if (command === 'set_ns') {
      result = await (provider as any).setNameservers(domain, extraParams?.ns0, extraParams?.ns1, extraParams?.ns2, extraParams?.ns3);
      if (result.success) {
        try {
          const db = require('../firebase').getAdminDb();
          const snap = await db.collection('domainOrders').where('domain', '==', domain).where('status', '==', 'active').get();
          if (!snap.empty) {
            await snap.docs[0].ref.update({ nameservers: { ns0: extraParams?.ns0, ns1: extraParams?.ns1, ns2: extraParams?.ns2, ns3: extraParams?.ns3 } });
          }
        } catch (e) { console.error(e); }
      }
      return res.json({ success: result.success, data: result, error: result.error });
    }

    if (command === 'renew') {
      result = await provider.renewDomain(domain, extraParams?.duration || 1);
      return res.json({ success: result.success, data: result, error: result.error });
    }

    if (command === 'get_details') {
      if (!(provider as any).getDomainDetails) return res.status(400).json({ success: false, error: 'Not supported' });
      result = await (provider as any).getDomainDetails(domain);
      return res.json({ success: result.success, data: result.data, error: result.error });
    }

    if (command === 'set_lock') {
      if (!(provider as any).updateDomainLock) return res.status(400).json({ success: false, error: 'Not supported' });
      result = await (provider as any).updateDomainLock(domain, extraParams?.isLocked);
      return res.json({ success: result.success, error: result.error });
    }`;

  if (code.match(oldLogicRegex)) {
    code = code.replace(oldLogicRegex, switchBlock);
    fs.writeFileSync('backend/src/routes/domain.ts', code);
  } else {
    console.log("Could not match the regex");
  }
}
