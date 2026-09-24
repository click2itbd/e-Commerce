const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/modules/DomainRegistrarsModule.tsx', 'utf8');

const defaultState = `const defaultRegistrarState = {
  namecheap: { enabled: false, apiUsername: '', apiKey: '', clientIp: '' },
  resellerclub: { enabled: false, resellerId: '', apiKey: '' },
  enom: { enabled: false, loginId: '', apiPassword: '' }
};
`;

if (!content.includes('const defaultRegistrarState')) {
  content = content.replace(
    'const REGISTRAR_DOC_PATH = [\\'hosting_config\\', \\'registrar_settings\\'];',
    'const REGISTRAR_DOC_PATH = [\\'hosting_config\\', \\'registrar_settings\\'];\n' + defaultState
  );
  fs.writeFileSync('src/pages/hosting-dashboard/modules/DomainRegistrarsModule.tsx', content);
  console.log('Fixed DomainRegistrarsModule');
}
