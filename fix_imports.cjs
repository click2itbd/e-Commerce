const fs = require('fs');
let dash = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', 'utf8');

// Fix import - add doc, updateDoc, getDoc
dash = dash.replace(
  "import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';",
  "import { collection, getDocs, doc, updateDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';"
);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', dash, 'utf8');
console.log('Fixed firebase imports');