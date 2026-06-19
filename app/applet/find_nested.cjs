const fs = require('fs');
const babel = require('@babel/core');

function findInvalidNesting(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let found = false;

  try {
    babel.transformSync(code, {
      filename: filePath,
      presets: ['@babel/preset-typescript', ['@babel/preset-react', {runtime: 'automatic'}]],
      plugins: [
        function() {
          return {
            visitor: {
              JSXElement(path) {
                const openNode = path.node.openingElement.name;
                const openName = openNode.name || (openNode.property ? openNode.property.name : null);
                if (openName === 'p' || openName === 'Typography' || openName === 'CardDescription' || openName === 'DialogDescription') {
                  path.traverse({
                    JSXElement(childPath) {
                      const childNode = childPath.node.openingElement.name;
                      const childName = childNode.name || (childNode.property ? childNode.property.name : null);
                      if (['div', 'ol', 'pre', 'ul'].includes(childName)) {
                        console.log(`Found invalid <${childName}> inside <${openName}> at ${filePath}:${childPath.node.loc.start.line}`);
                        found = true;
                      }
                    }
                  });
                }
              }
            }
          };
        }
      ]
    });
  } catch (e) {
    console.error('Babel error: ' + e.message);
  }
  return found;
}

findInvalidNesting('src/pages/AdminDashboard.tsx');
