const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

content = content.replace(
  /}\s*};\s*return \(\s*<AuthContext\.Provider/m,
  "}\n    return false;\n  };\n\n  return (\n    <AuthContext.Provider"
);

fs.writeFileSync('src/context/AuthContext.tsx', content, 'utf8');
