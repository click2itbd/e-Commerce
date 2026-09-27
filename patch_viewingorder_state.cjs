const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

if(!content.includes('const [viewingOrder, setViewingOrder]')) {
    content = content.replace(
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);",
        "const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);\n  const [viewingOrder, setViewingOrder] = useState<any | null>(null);"
    );
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
}