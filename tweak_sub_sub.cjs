const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/menus/Menus.tsx', 'utf8');

// Render count in pill
const pillHTML = `
                      {sub.brands && sub.brands.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold ml-1">
                          {sub.brands.length} Brands
                        </span>
                      )}
                      {sub.subCategories && sub.subCategories.length > 0 && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold ml-1">
                          {sub.subCategories.length} Subs
                        </span>
                      )}
`;
c = c.replace(/\{sub\.brands && sub\.brands\.length > 0 && \([\s\S]*?Brands\s*<\/span>\s*\)\}/, pillHTML);

// Add editing capability in the modal
// We need to find the place where sub categories are rendered in edit mode
// Currently it renders `sub.name` and `sub.slug` inputs.
const editBlockRegex = /<input[\s\S]*?value=\{sub\.name\}[\s\S]*?<\/div>\s*<\/div>\s*\)\)/;

const newEditBlock = `
<input
                        type="text"
                        placeholder="Sub Category Name"
                        value={sub.name}
                        onChange={(e) => {
                          const newSubs = [...menuFormData.subCategories];
                          newSubs[idx].name = e.target.value;
                          newSubs[idx].slug = e.target.value
                            .toLowerCase()
                            .replace(/\\s+/g, "-");
                          setMenuFormData({
                            ...menuFormData,
                            subCategories: newSubs,
                          });
                        }}
                        className="text-sm border-gray-200 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Slug"
                        value={sub.slug}
                        onChange={(e) => {
                          const newSubs = [...menuFormData.subCategories];
                          newSubs[idx].slug = e.target.value;
                          setMenuFormData({
                            ...menuFormData,
                            subCategories: newSubs,
                          });
                        }}
                        className="text-sm border-gray-200 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSubs = [...menuFormData.subCategories];
                          newSubs.splice(idx, 1);
                          setMenuFormData({
                            ...menuFormData,
                            subCategories: newSubs,
                          });
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {/* Sub-Sub Categories Edit Block */}
                    <div className="col-span-4 mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">Sub-Sub Categories</span>
                        <button type="button" onClick={() => {
                          const newSubs = [...menuFormData.subCategories];
                          if (!newSubs[idx].subCategories) newSubs[idx].subCategories = [];
                          newSubs[idx].subCategories.push({ id: Math.random().toString(36).substr(2, 9), name: '', slug: '' });
                          setMenuFormData({ ...menuFormData, subCategories: newSubs });
                        }} className="text-[11px] text-[#F97316] font-bold flex items-center gap-1">
                          <Plus size={12} /> Add New
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(sub.subCategories || []).map((subSub: any, subSubIdx: number) => (
                           <div key={subSub.id} className="flex gap-2">
                             <input value={subSub.name} onChange={(e) => {
                                const newSubs = [...menuFormData.subCategories];
                                newSubs[idx].subCategories[subSubIdx].name = e.target.value;
                                newSubs[idx].subCategories[subSubIdx].slug = e.target.value.toLowerCase().replace(/\\s+/g, '-');
                                setMenuFormData({ ...menuFormData, subCategories: newSubs });
                             }} placeholder="Sub-Sub Name" className="text-xs border-gray-200 rounded p-1.5 w-full" />
                             <input value={subSub.slug} onChange={(e) => {
                                const newSubs = [...menuFormData.subCategories];
                                newSubs[idx].subCategories[subSubIdx].slug = e.target.value;
                                setMenuFormData({ ...menuFormData, subCategories: newSubs });
                             }} placeholder="Slug" className="text-xs border-gray-200 rounded p-1.5 w-full" />
                             <button onClick={() => {
                                const newSubs = [...menuFormData.subCategories];
                                newSubs[idx].subCategories.splice(subSubIdx, 1);
                                setMenuFormData({ ...menuFormData, subCategories: newSubs });
                             }} className="text-red-500 p-1 hover:bg-red-100 rounded"><Trash2 size={12}/></button>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
`;

c = c.replace(/<input[\s\n]*type="text"[\s\n]*placeholder="Sub Category Name"[\s\S]*?<\/button>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*\)\)/, newEditBlock);

fs.writeFileSync('src/pages/admin/tabs/menus/Menus.tsx', c);
console.log('Added UI tweaks for Sub-Sub Categories in Menus.tsx');