import * as fs from 'fs';
import * as babel from '@babel/core';

function findInvalidNesting(filePath: string) {
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
              JSXElement(path: any) {
                const openNode = path.node.openingElement.name;
                const openName = openNode.name || (openNode.property ? openNode.property.name : null);
                if (['ol', 'ul', 'pre', 'button', 'p'].includes(openName)) {
                  path.traverse({
                    JSXElement(childPath: any) {
                      const childNode = childPath.node.openingElement.name;
                      const childName = childNode.name || (childNode.property ? childNode.property.name : null);
                      if (childName === 'p' || childName === 'div' || childName === 'ol' || childName === 'pre' || childName === 'ul') {
                        if (
                            (openName === 'p' && ['p', 'div', 'ol', 'pre', 'ul'].includes(childName)) ||
                            (['ol', 'ul'].includes(openName) && childName === 'p') ||
                            (openName === 'pre' && childName === 'p') ||
                            (openName === 'button' && childName === 'div')
                        ) {
                           console.log(`Found invalid <${childName}> inside <${openName}> at ${filePath}:${childPath.node.loc.start.line}`);
                           found = true;
                        }
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
  } catch (e: any) {
    console.error('Babel error: ' + e.message);
  }
  return found;
}

findInvalidNesting('src/pages/AdminDashboard.tsx');
