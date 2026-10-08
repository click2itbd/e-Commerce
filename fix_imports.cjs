const fs = require('fs');

function fixImports(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const nl = c.includes('\r\n') ? '\r\n' : '\n';
  
  if (filePath.includes('Inventory.tsx') && !filePath.includes('Ecommerce')) {
    // Inventory.tsx needs useEffect
    c = c.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect } from 'react';");
  } else if (filePath.includes('EcommerceInventory.tsx')) {
    // EcommerceInventory.tsx needs useRef
    c = c.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
    if (!c.includes('useRef') && c.includes("import React, { useState } from 'react';")) {
        c = c.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
    }
  }

  fs.writeFileSync(filePath, c);
}

fixImports('src/pages/ecommerceDashboard/EcommerceInventory.tsx');
fixImports('src/pages/admin/tabs/inventory/Inventory.tsx');
console.log('Fixed imports in both files');