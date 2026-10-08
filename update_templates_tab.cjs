const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/templates/TemplatesTab.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Add menus state and fetch logic
const imports = `import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';`;
if (c.includes(imports)) {
  // It's already there.
}

const stateRegex = /const \[templates, setTemplates\] = useState<SpecificationTemplate\[\]>\(\[\]\);/;
const newState = `const [templates, setTemplates] = useState<SpecificationTemplate[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [bulkFields, setBulkFields] = useState('');`;

c = c.replace(stateRegex, newState);

const fetchTemplatesCode = `const fetchTemplates = async () => {`;
const newFetchTemplatesCode = `const fetchMenus = async () => {
    try {
      const snap = await getDocs(collection(db, 'menus'));
      setMenus(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching menus:', error);
    }
  };

  const fetchTemplates = async () => {`;

c = c.replace(fetchTemplatesCode, newFetchTemplatesCode);

const useEffectRegex = /useEffect\(\(\) => \{\s*fetchTemplates\(\);\s*\}, \[\]\);/;
const newUseEffect = `useEffect(() => {
    fetchTemplates();
    fetchMenus();
  }, []);`;
c = c.replace(useEffectRegex, newUseEffect);

// 2. Change Target Category input to a dropdown
const categoryInputRegex = /<input\s*type="text"\s*required\s*value=\{currentTemplate\.category \|\| ''\}\s*onChange=\{\(e\) => setCurrentTemplate\(\{ \.\.\.currentTemplate, category: e\.target\.value \}\)\}\s*className="[^"]*"\s*placeholder="e\.g\. Laptop"\s*\/>/;

const newCategoryInput = `<select
                  required
                  value={currentTemplate.category || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {menus.map(menu => (
                    <option key={menu.id} value={menu.name}>{menu.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>`;
if (c.match(categoryInputRegex)) {
  c = c.replace(categoryInputRegex, newCategoryInput);
}

// 3. Add Bulk Add section before Fields
const fieldsHeaderRegex = /<div className="flex justify-between items-center">\s*<label className="block text-sm font-medium text-gray-700">Fields<\/label>/;

const bulkAddUI = `<div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <label className="block text-sm font-bold text-blue-800 mb-2">Quick Bulk Add (Paste comma-separated fields)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={bulkFields}
                  onChange={e => setBulkFields(e.target.value)}
                  placeholder="e.g. Processor, RAM, Storage, Display, Battery"
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const items = bulkFields.split(',').map(s => s.trim()).filter(s => s);
                      if (items.length > 0) {
                        const newFields = items.map(item => ({
                          id: Date.now().toString() + Math.random().toString(),
                          label: item,
                          name: item.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                          type: 'text' as const,
                          required: false,
                          options: []
                        }));
                        setCurrentTemplate(prev => ({
                          ...prev,
                          fields: [...(prev.fields || []), ...newFields]
                        }));
                        setBulkFields('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = bulkFields.split(',').map(s => s.trim()).filter(s => s);
                    if (items.length > 0) {
                      const newFields = items.map(item => ({
                        id: Date.now().toString() + Math.random().toString(),
                        label: item,
                        name: item.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                        type: 'text' as const,
                        required: false,
                        options: []
                      }));
                      setCurrentTemplate(prev => ({
                        ...prev,
                        fields: [...(prev.fields || []), ...newFields]
                      }));
                      setBulkFields('');
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700"
                >
                  Generate Fields
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Fields</label>`;

if (c.match(fieldsHeaderRegex)) {
  c = c.replace(fieldsHeaderRegex, bulkAddUI);
  fs.writeFileSync('src/pages/admin/tabs/templates/TemplatesTab.tsx', c.replace(/\n/g, nl));
  console.log('Successfully updated TemplatesTab with bulk add and category select');
} else {
  console.log('Regex for Fields header did not match');
}