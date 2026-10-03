const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const oldMap = `      const tableData = o.items.map((item, idx) => {
        let desc = item.description || "-";
        if (desc.length > 50) desc = desc.substring(0, 47) + "...";

        let warranty = "-";
        if (item.warrantyMonths) {
          warranty =
            item.warrantyMonths > 12
              ? \`\${item.warrantyMonths / 12} Yrs\`
              : \`\${item.warrantyMonths} Mos\`;
        } else if (item.specs?.Warranty) {
          warranty = item.specs.Warranty;
        }

        return [
          (idx + 1).toString(),
          item.name,
          desc,
          item.brand || "-",
          item.quantity.toString(),
          type === "challan" ? "-" : item.price.toFixed(2),
          warranty,
          type === "challan" ? "-" : (item.price * item.quantity).toFixed(2),
        ];
      });`;

const newMap = `      const tableData = o.items.map((item, idx) => {
        let desc = item.description || "-";
        if (desc.length > 50) desc = desc.substring(0, 47) + "...";

        let warranty = "-";
        if (item.warrantyMonths) {
          warranty =
            item.warrantyMonths > 12
              ? \`\${item.warrantyMonths / 12} Yrs\`
              : \`\${item.warrantyMonths} Mos\`;
        } else if (item.specs?.Warranty) {
          warranty = item.specs.Warranty;
        }

        const discount = item.discount || 0;
        const total = (item.price * item.quantity) - discount;

        return [
          (idx + 1).toString(),
          item.name,
          desc,
          item.brand || "-",
          warranty,
          item.quantity.toString(),
          "Pcs",
          type === "challan" ? "-" : discount.toFixed(2),
          type === "challan" ? "-" : item.price.toFixed(2),
          type === "challan" ? "-" : total.toFixed(2),
        ];
      });`;

code = code.replace(oldMap, newMap);

const oldHead = `      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "S.N.",
            "Product Name",
            "Description",
            "Brand",
            "Unit",
            "Unit Price",
            "Warranty",
            "Total (TK.)",
          ],
        ],`;

const newHead = `      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "SN",
            "Item",
            "Description",
            "Brand",
            "Warranty",
            "Quantity",
            "Unit",
            "Discount",
            "Price",
            "Total",
          ],
        ],`;

code = code.replace(oldHead, newHead);

const oldColumnStyles = `        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "left", cellWidth: 45 },
          2: { halign: "left", cellWidth: 40 },
          3: { halign: "center", cellWidth: 16 },
          4: { halign: "center", cellWidth: 12 },
          5: { halign: "right", cellWidth: 18 },
          6: { halign: "center", cellWidth: 16 },
          7: { halign: "right", cellWidth: 21 },
        },`;

const newColumnStyles = `        columnStyles: {
          0: { halign: "center", cellWidth: 8 }, // SN
          1: { halign: "left", cellWidth: 35 }, // Item
          2: { halign: "left", cellWidth: 35 }, // Description
          3: { halign: "center", cellWidth: 15 }, // Brand
          4: { halign: "center", cellWidth: 15 }, // Warranty
          5: { halign: "center", cellWidth: 12 }, // Quantity
          6: { halign: "center", cellWidth: 10 }, // Unit
          7: { halign: "right", cellWidth: 15 }, // Discount
          8: { halign: "right", cellWidth: 18 }, // Price
          9: { halign: "right", cellWidth: 18 }, // Total
        },`;

code = code.replace(oldColumnStyles, newColumnStyles);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log('Fixed pdf.ts');
