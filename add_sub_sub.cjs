const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/menus/Menus.tsx', 'utf8');

// 1. Add state
if (!c.includes('isAddingSubSubCategory')) {
  c = c.replace(/const \[isAddingBrand, setIsAddingBrand\] = useState\(false\);/, "const [isAddingBrand, setIsAddingBrand] = useState(false);\n  const [isAddingSubSubCategory, setIsAddingSubSubCategory] = useState(false);\n  const [subSubFormData, setSubSubFormData] = useState({ menuId: '', subCategoryId: '', name: '', slug: '' });");
}

// 2. Add handleSaveSubSubCategory
const handleLogic = `
  const handleSaveSubSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSubFormData.menuId || !subSubFormData.subCategoryId) {
      toast.error("Please select parent and sub category");
      return;
    }
    try {
      const parentMenu = menus.find((m: any) => m.id === subSubFormData.menuId);
      if (!parentMenu) return;

      const subCategory = parentMenu.subCategories.find((s: any) => s.id === subSubFormData.subCategoryId);
      if (!subCategory) return;

      const newSubSub = {
        id: Math.random().toString(36).substr(2, 9),
        name: subSubFormData.name,
        slug: subSubFormData.slug || subSubFormData.name.toLowerCase().replace(/\\s+/g, "-"),
      };

      if (!subCategory.subCategories) subCategory.subCategories = [];
      subCategory.subCategories.push(newSubSub);

      await updateDoc(doc(db, "menus", parentMenu.id), {
        subCategories: parentMenu.subCategories,
      });

      toast.success("Sub-Sub Category added successfully");
      setIsAddingSubSubCategory(false);
      setSubSubFormData({ menuId: "", subCategoryId: "", name: "", slug: "" });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error adding sub-sub category");
    }
  };
`;
if (!c.includes('handleSaveSubSubCategory')) {
  c = c.replace(/useEffect\(\(\) => \{/, handleLogic + "\n  useEffect(() => {");
}

// 3. Add + Add Sub-Sub Category button
c = c.replace(/<button\s*onClick=\{\(\) => setIsAddingSubCategory\(true\)\}/, "<button\n              onClick={() => setIsAddingSubSubCategory(true)}\n              className=\"bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm\"\n            >\n              <Plus size={18} /> Add Sub-Sub Category\n            </button>\n            <button\n              onClick={() => setIsAddingSubCategory(true)}");

// 4. Add the form UI
const formUI = `
        {isAddingSubSubCategory && (
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <form onSubmit={handleSaveSubSubCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Parent Category
                  </label>
                  <select
                    required
                    value={subSubFormData.menuId}
                    onChange={(e) =>
                      setSubSubFormData({ ...subSubFormData, menuId: e.target.value, subCategoryId: "" })
                    }
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  >
                    <option value="">Select Category</option>
                    {menus.map((menu: any) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Sub Category
                  </label>
                  <select
                    required
                    value={subSubFormData.subCategoryId}
                    onChange={(e) =>
                      setSubSubFormData({ ...subSubFormData, subCategoryId: e.target.value })
                    }
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    disabled={!subSubFormData.menuId}
                  >
                    <option value="">Select Sub Category</option>
                    {menus
                      .find((m: any) => m.id === subSubFormData.menuId)
                      ?.subCategories?.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Sub-Sub Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={subSubFormData.name}
                    onChange={(e) =>
                      setSubSubFormData({ ...subSubFormData, name: e.target.value })
                    }
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="e.g. Smart Watch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={subSubFormData.slug}
                    onChange={(e) =>
                      setSubSubFormData({ ...subSubFormData, slug: e.target.value })
                    }
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                >
                  Add Sub-Sub Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubSubCategory(false)}
                  className="bg-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
`;

if (!c.includes('onSubmit={handleSaveSubSubCategory}')) {
  c = c.replace(/\{isAddingSubCategory && \(/, formUI + "\n        {isAddingSubCategory && (");
}

fs.writeFileSync('src/pages/admin/tabs/menus/Menus.tsx', c);
console.log('Menus.tsx patched for sub-sub categories!');