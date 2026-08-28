const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Update state initialization
content = content.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\r\n]*name: '',/g,
  "const [formData, setFormData] = useState({\n    model: '',\n    name: '',"
);

// Update reset
content = content.replace(
  /setFormData\(\{[\s\r\n]*name: '',[\s\r\n]*price: 0,[\s\r\n]*stock: 0,/g,
  "setFormData({ \n            model: '',\n            name: '', \n            price: 0, \n            stock: 0,"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf8');
console.log("Updated formData in AdminDashboard");
