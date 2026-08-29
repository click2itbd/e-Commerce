const fs = require('fs');
const file = 'src/pages/hosting-sections/WordPressCloudSection.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'Enterprise-grade CloudLinux OS, CageFS isolation, NVMe SSDs, and LiteSpeed web servers for ultimate stability and blazing-fast BDIX local speed.',
  'Affordable, fast, and secure shared hosting with NVMe SSDs and BDIX support for optimal speed.'
);

fs.writeFileSync(file, content, 'utf8');
