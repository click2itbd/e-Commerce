const fs = require('fs');
let code = fs.readFileSync('src/pages/PCBuilder.tsx', 'utf8');

// The logic we want to remove
const oldLogic = `// Load shared build if available
        const buildParam = searchParams.get('build');
        if (buildParam) {
          try {
            const decoded = atob(buildParam);
            const pairs = decoded.split(',');
            const newSelection: Record<string, Product> = {};
            pairs.forEach(pair => {
              const [cat, id] = pair.split(':');
              const foundProduct = productsData.find(p => p.id === id);
              if (foundProduct) {
                newSelection[cat] = foundProduct;
              }
            });
            setSelectedComponents(newSelection);
          } catch (e) {
            console.error('Failed to parse shared build', e);
          }
        }`;

// Let's just regex remove it. It might be indented.
code = code.replace(/\/\/ Load shared build if available[\s\S]*?console\.error\('Failed to parse shared build', e\);\s*\}\s*\}/, '');

const newUseEffect = `
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(location.search);
    const buildParam = params.get('build');
    if (buildParam) {
      try {
        const decoded = atob(buildParam);
        const pairs = decoded.split(',');
        const newSelection = {};
        pairs.forEach(pair => {
          const [cat, id] = pair.split(':');
          const foundProduct = products.find(p => p.id === id);
          if (foundProduct) {
            newSelection[cat] = foundProduct;
          }
        });
        setSelectedComponents(newSelection);
      } catch (e) {
        console.error('Failed to parse shared build', e);
      }
    }
  }, [location.search, products]);
`;

code = code.replace("  const searchParams = new URLSearchParams(window.location.search);", "  // searchParams removed");
code = code.replace("    }, []);\n\n    const handleSelect", "    }, []);\n" + newUseEffect + "\n    const handleSelect");

fs.writeFileSync('src/pages/PCBuilder.tsx', code);
