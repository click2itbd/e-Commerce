const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<Plus size={18} /> Add Payment Account',
  '<Plus size={18} /> Add Payment Method'
);

content = content.replace(
  '<form onSubmit={async',
  `<div><h3 className="text-xl font-bold mb-6 text-gray-800">Add Payment Method</h3><form onSubmit={async`
);

content = content.replace(
  '             </div>\\n            ) : (\\n              <div className="overflow-x-auto">',
  '             </form></div></div>\\n            ) : (\\n              <div className="overflow-x-auto">'
);


fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refined Add Payment Method view');
