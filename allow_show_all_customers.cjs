const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/CustomerDueList.tsx', 'utf8');

// 1. Add state for showAll
code = code.replace(/const \[submitting, setSubmitting\] = useState\(false\);/, "const [submitting, setSubmitting] = useState(false);\n  const [showAll, setShowAll] = useState(false);");

// 2. Change the filter logic
code = code.replace(/\.filter\(c => c\.due > 0\)/, ".filter(c => showAll ? true : c.due > 0)");

// 3. Add a checkbox in the UI
const searchBarHtml = `<input
                  type="text"
                  placeholder="Search by name or phone..."`;
const newSearchBarHtml = `<div className="flex items-center gap-2 mr-2">
                  <input type="checkbox" id="showAllCust" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="showAllCust" className="text-sm text-gray-600 font-medium whitespace-nowrap">Show All</label>
                </div>\n                <input
                  type="text"
                  placeholder="Search by name or phone..."`;
code = code.replace(searchBarHtml, newSearchBarHtml);

fs.writeFileSync('src/pages/admin/tabs/sales/CustomerDueList.tsx', code, 'utf8');
console.log("Updated CustomerDueList to allow showing all customers");
