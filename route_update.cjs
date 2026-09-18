const fs = require('fs');
let code = fs.readFileSync('src/pages/PCBuilder.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { Navigate } from 'react-router-dom';",
  "import { Navigate, useNavigate, useLocation, Routes, Route } from 'react-router-dom';\nimport { CommunityBuilds } from '../components/PCBuilder/CommunityBuilds';"
);

// 2. Remove activeCategoryModal state
code = code.replace(
  "const [activeCategoryModal, setActiveCategoryModal] = useState<BuilderCategory | null>(null);",
  "const navigate = useNavigate();\n  const location = useLocation();\n  \n  const matchChoose = location.pathname.match(/\\/pc-build\\/choose\\/(.+)/);\n  const categoryId = matchChoose ? matchChoose[1] : null;\n  const activeCategoryModal = categoryId ? [...coreCategories, ...peripheralCategories].find(c => c.id === categoryId) || null : null;"
);

// 3. Update handleSelect to navigate back
code = code.replace(
  "toast.success(`${product.name} selected!`, { icon: '?' });\n  };",
  "toast.success(`${product.name} selected!`, { icon: '?' });\n    navigate('/pc-build');\n  };"
);

// 4. Update onChoose to navigate
code = code.replace(
  "onChoose={() => setActiveCategoryModal(cat)}",
  "onChoose={() => navigate(`/pc-build/choose/${cat.id}`)}"
);

// 5. Update onClose to navigate back
code = code.replace(
  "onClose={() => setActiveCategoryModal(null)}",
  "onClose={() => navigate('/pc-build')}"
);

// 6. Wrap the whole return with a Routes to handle /community-builds separately
code = code.replace(
  "return (\n    <Layout>",
  "const builderContent = (\n    <Layout>"
);

code = code.replace(
  "    </Layout>\n  );\n};",
  "    </Layout>\n  );\n\n  return (\n    <Routes>\n      <Route path=\"/community-builds\" element={<CommunityBuilds />} />\n      <Route path=\"*\" element={builderContent} />\n    </Routes>\n  );\n};"
);

fs.writeFileSync('src/pages/PCBuilder.tsx', code);
