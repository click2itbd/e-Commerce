const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// Add expandedOrderIds state
if (!content.includes('expandedOrderIds')) {
    content = content.replace(
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);",
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);\n  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());\n\n  const toggleRow = (id: string) => {\n    const newSet = new Set(expandedOrderIds);\n    if (newSet.has(id)) newSet.delete(id);\n    else newSet.add(id);\n    setExpandedOrderIds(newSet);\n  };"
    );
}

// Modify the TR to add expand button and the expandable row underneath
const trStart = `<tr key={order.id} className={cn(
                        "hover:bg-gray-50 transition-colors",
                        selectedOrderIds.includes(order.id) && "bg-red-50/50"
                      )}>`;

// Wait, the TR doesn't have an onClick or expand button.