const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

if (!content.includes('ChevronDown')) {
    content = content.replace("import { Copy, Receipt", "import { ChevronDown, ChevronRight, Copy, Receipt");
}

if (!content.includes('expandedOrderIds')) {
    content = content.replace(
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);",
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);\n  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());\n\n  const toggleRow = (id: string) => {\n    const newSet = new Set(expandedOrderIds);\n    if (newSet.has(id)) newSet.delete(id);\n    else newSet.add(id);\n    setExpandedOrderIds(newSet);\n  };"
    );
}

fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
console.log('Added imports and state');