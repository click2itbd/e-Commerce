const fs = require('fs');
let lines = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8').split('\n');

const datalist = '                  <datalist id="service-customers-list">{customers.map((c: any) => <option key={c.id} value={c.name} />)}</datalist>';
lines.splice(631, 0, datalist);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', lines.join('\n'));
console.log('Inserted datalist in Services');
