import { Order, Transaction, SiteSettings } from "../types";
import { formatCurrency } from "./utils";

function amountToWords(num: number): string {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";

  const numStr = Math.floor(num).toString();
  if (numStr.length > 9) return "Amount too large";

  const n = ("000000000" + numStr)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
  if (!n) return "";

  let str = "";

  let crore = parseInt(n[1]);
  if (crore > 0) {
    if (crore < 20) str += a[crore];
    else str += b[Math.floor(crore / 10)] + " " + a[crore % 10];
    str += "Crore ";
  }

  let lakh = parseInt(n[2]);
  if (lakh > 0) {
    if (lakh < 20) str += a[lakh];
    else str += b[Math.floor(lakh / 10)] + " " + a[lakh % 10];
    str += "Lakh ";
  }

  let thousand = parseInt(n[3]);
  if (thousand > 0) {
    if (thousand < 20) str += a[thousand];
    else str += b[Math.floor(thousand / 10)] + " " + a[thousand % 10];
    str += "Thousand ";
  }

  let units = parseInt(n[4]);
  if (units > 0) {
    let hundred = Math.floor(units / 100);
    let rem = units % 100;

    if (hundred > 0) {
      str += a[hundred] + "Hundred ";
    }
    if (rem > 0) {
      if (rem < 20) str += a[rem];
      else str += b[Math.floor(rem / 10)] + " " + (rem % 10 ? a[rem % 10] : "");
    }
  }

  return str.trim();
}

export const generatePDF = async (
  order: Order | Transaction,
  type: "invoice" | "quotation" | "challan" | "receipt",
  settings: SiteSettings,
  action: "download" | "doc" = "download",
): Promise<any> => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = 20;

  // Header Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(type === "receipt" ? "MONEY RECEIPT" : type.toUpperCase(), 15, currentY + 10);

  // Company Info (Right Aligned)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  try {
    const urlsToTry = [settings?.logoUrl, "/logo.png", "/logo.jpeg"].filter(Boolean);
    let dataUrl = "";
    let loadedImg: HTMLImageElement | null = null;

    for (const url of urlsToTry) {
      if (!url) continue;
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          dataUrl = canvas.toDataURL("image/png");
          loadedImg = img;
          break; // successfully loaded
        }
      } catch (e) {
        console.warn(`Failed to load logo from ${url}`, e);
      }
    }

    const businessNameText = settings?.businessName || settings?.brandName || "CLICK2IT BD";
    
    if (loadedImg && dataUrl) {
      const textWidth = doc.getTextWidth(businessNameText);
      const logoHeight = 16;
      const logoWidth = (loadedImg.width / loadedImg.height) * logoHeight;
      doc.addImage(
        dataUrl,
        "PNG",
        pageWidth - 15 - textWidth - logoWidth - 5,
        currentY - 11,
        logoWidth,
        logoHeight,
      );
    }
  } catch (err) {
    console.error("Error in logo processing for PDF", err);
  }

  doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth - 15, currentY, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  
    let finalAddress = settings?.address || "Shop No. 1072, Level 10, Multiplan Center\n69-71, New Elephant Road, Dhaka-1205";
    if (finalAddress.trim() === 'Dhaka, Bangladesh') {
      finalAddress = "Shop No. 1072, Level 10, Multiplan Center\n69-71, New Elephant Road, Dhaka-1205";
    }
    
    let finalPhone = settings?.contactPhone || "+8809640887777, +8801729887777";
    if (finalPhone.trim() === '+8809640887777' || finalPhone.trim() === '+880 123456789') {
      finalPhone = "+8809640887777, +8801729887777";
    }

    const addressLines = doc.splitTextToSize(finalAddress.replace(/\\n/g, '\n'), 80);

  
  let addrY = currentY + 6;
  addressLines.forEach((line) => {
    doc.text(line, pageWidth - 15, addrY, { align: "right" });
    addrY += 5;
  });
  
  doc.text(finalPhone, pageWidth - 15, addrY, { align: "right" });
  doc.text(settings.website || "www.click2itbd.com", pageWidth - 15, addrY + 5, { align: "right" });

  currentY = Math.max(currentY + 25, addrY + 15);

  if (type === "receipt") {
      const tx = order as Transaction;

      // --- Info Boxes (same as Invoice) ---
      const boxHeight = 32;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, (pageWidth - 30) / 2, boxHeight, "F");
      doc.rect(15 + (pageWidth - 30) / 2, currentY, (pageWidth - 30) / 2, boxHeight, "F");

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15 + (pageWidth - 30) / 2, currentY, 15 + (pageWidth - 30) / 2, currentY + boxHeight);

      // Left box
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("Bill To:", 20, currentY + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(tx.entityName || "N/A", 20, currentY + 18);

      // Right box
      const rightX = 15 + (pageWidth - 30) / 2 + 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("Receipt Details:", rightX, currentY + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Receipt No:  ${tx.referenceId || "N/A"}`, rightX, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(`Date:  ${new Date(tx.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, rightX, currentY + 25);

      currentY += boxHeight + 12;

      // --- Payment Table (matching Invoice table style) ---
      autoTable(doc, {
        startY: currentY,
        head: [["S.N.", "Description / Ref", "Payment Method", "Amount"]],
        body: [
          [
            "1",
            tx.description || `Payment received from ${tx.entityName}`,
            tx.paymentMethod ? tx.paymentMethod.charAt(0).toUpperCase() + tx.paymentMethod.slice(1).toLowerCase() : "Cash",
            formatCurrency(tx.amount, settings),
          ],
        ],
        theme: "plain",
        headStyles: {
          fillColor: [15, 22, 33],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: 4,
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 40 },
          3: { halign: "right", cellWidth: 35 },
        },
        didParseCell: (data: any) => {
          if (data.section === "head" && data.column.index === 3) {
            data.cell.styles.halign = "right";
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY;

      // --- Total row ---
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, pageWidth - 30, 12, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Total TK.", pageWidth - 50, currentY + 8);
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(tx.amount, settings), pageWidth - 15, currentY + 8, { align: "right" });

      currentY += 20;

      // --- Taka In Word box ---
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(15, currentY, pageWidth - 30, 12, "FD");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Taka In Word: ", 20, currentY + 8);
      const words = amountToWords(tx.amount);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(`Taka ${words} Only`, 52, currentY + 8);
      }

      currentY += 30;
    } else {
    const o = order as Order;

    // Light Grey Box Backgrounds
    doc.setFillColor(248, 250, 252);
    
    // Calculate dynamic box height based on address length
    const splitAddr = doc.splitTextToSize(
      o.shippingAddress || o.customerPhone || "N/A",
      (pageWidth - 30) / 2 - 10,
    );
    // Base lines + extra for address + extra for workOrder
    let rightSideLines = 2; // Details No, Date
    if (o.workOrderNumber) rightSideLines++;
    
    const leftSideHeight = 22 + (splitAddr.length * 5) + 5; // 22 is start of addr, + height, + bottom padding
    const rightSideHeight = 16 + (rightSideLines * 6) + 5; 
    
    const boxHeight = Math.max(leftSideHeight, rightSideHeight, 32); // minimum 32 height

    // Left Box - Bill To
    doc.rect(15, currentY, (pageWidth - 30) / 2, boxHeight, "F");
    // Right Box - Details
    doc.rect(
      15 + (pageWidth - 30) / 2,
      currentY,
      (pageWidth - 30) / 2,
      boxHeight,
      "F",
    );

    // Vertical Divider Line (Subtle)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(
      15 + (pageWidth - 30) / 2,
      currentY,
      15 + (pageWidth - 30) / 2,
      currentY + boxHeight,
    );

    // Box 1 (Left) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(type === "challan" ? "Ship To:" : "Bill To:", 20, currentY + 8);

    doc.text(o.customerName || "N/A", 20, currentY + 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(splitAddr, 20, currentY + 24);

    // Box 2 (Right) Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      type.charAt(0).toUpperCase() + type.slice(1) + " Details:",
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 8,
    );

    doc.setFontSize(10);
    doc.text(
      `${type.charAt(0).toUpperCase() + type.slice(1)} No: `,
      15 + (pageWidth - 30) / 2 + 5,
      currentY + 18,
    );
    doc.setFont("helvetica", "normal");
    doc.text(
      `${o.documentNumber || o.id.substring(0, 8).toUpperCase()}`,
      15 + (pageWidth - 30) / 2 + 30,
      currentY + 18,
    );

    doc.setFont("helvetica", "bold");
    doc.text("Date: ", 15 + (pageWidth - 30) / 2 + 5, currentY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${new Date(o.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      15 + (pageWidth - 30) / 2 + 18,
      currentY + 24,
    );
    
    let currentRightY = currentY + 30;

      doc.setFont("helvetica", "bold");
      doc.text("Prepared By: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
      doc.setFont("helvetica", "normal");
      doc.text(o.createdBy || "Admin", 15 + (pageWidth - 30) / 2 + 28, currentRightY);
      currentRightY += 6;
      
      if (o.workOrderNumber) {
          doc.setFont("helvetica", "bold");
          doc.text("Work Order: ", 15 + (pageWidth - 30) / 2 + 5, currentRightY);
          doc.setFont("helvetica", "normal");
          doc.text(o.workOrderNumber, 15 + (pageWidth - 30) / 2 + 28, currentRightY);
      }

    currentY += boxHeight + 10;

    // Table Data
    const tableData = o.items.map((item: any, idx: number) => {
      let desc = item.description || "-";
      // Strip HTML if exists
      desc = desc.replace(/<[^>]+>/g, "").trim();
      if (desc.length > 50) desc = desc.substring(0, 47) + "...";

      let warranty = "-";
      if (item.warranty) {
        warranty = item.warranty;
      } else if (item.warrantyMonths) {
        warranty = item.warrantyMonths > 12 ? `${item.warrantyMonths / 12} Yrs` : `${item.warrantyMonths} Mos`;
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
    });

    autoTable(doc, {
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
      ],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "left", cellWidth: 45 },
        2: { halign: "left", cellWidth: 40 },
        3: { halign: "center", cellWidth: 16 },
        4: { halign: "center", cellWidth: 12 },
        5: { halign: "right", cellWidth: 18 },
        6: { halign: "center", cellWidth: 16 },
        7: { halign: "right", cellWidth: 21 },
      },
      didDrawCell: (data: any) => {
        // Draw bottom border for rows
        if (data.row.section === "body") {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.1);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
        }
      },
    });

    if (type !== "challan") {
      let finalY = (doc as any).lastAutoTable.finalY + 15;

      const subtotal = o.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );
      const itemDiscounts = o.items.reduce(
        (acc, item) => acc + (Number(item.discount) || 0),
        0
      );
      const discount = (Number(o.discountAmount) || 0) + itemDiscounts;

      const alignRightX = pageWidth - 15;

      doc.setFontSize(11);

      if (discount > 0) {
        doc.setFont("helvetica", "normal");
        doc.text("Subtotal:", pageWidth - 60, finalY);
        doc.text(subtotal.toFixed(2), alignRightX, finalY, { align: "right" });
        finalY += 7;

        doc.text("Discount:", pageWidth - 60, finalY);
        doc.text(`-${discount.toFixed(2)}`, alignRightX, finalY, {
          align: "right",
        });
        finalY += 7;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Total TK.", pageWidth - 60, finalY);
      doc.text(Number(o.total).toFixed(2), alignRightX, finalY, {
        align: "right",
      });

      finalY += 20;

      // Amount in words Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(15, finalY, pageWidth - 30, 12, "FD");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Taka In Word: ", 20, finalY + 8);

      const words = amountToWords(o.total);
      if (words) {
        doc.setFont("helvetica", "normal");
        doc.text(`Taka ${words} Only`, 48, finalY + 8);
      }
      currentY = finalY + 20; // Update global currentY
    } else {
      currentY = (doc as any).lastAutoTable?.finalY + 20 || currentY + 20;
    }
  }

  // Terms and Conditions Section (For Quotations, Invoices, etc.)
  let signatureY = doc.internal.pageSize.getHeight() - 40;
  const ord = order as any;
  if (ord.termsAndConditions || ord.notes) {
    // currentY is already at the correct position from above, just add a small margin
    currentY += 5;

    if (currentY < signatureY - 40) { // If we have space on the page
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      const termsTitle = ord.termsAndConditions ? "Terms & Conditions" : "Notes";
      const termsContent = ord.termsAndConditions || ord.notes;
      
      doc.text(termsTitle + ":", 15, currentY);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      
      const splitTerms = doc.splitTextToSize(termsContent || "", pageWidth - 30);
      doc.text(splitTerms, 15, currentY + 6);
    }
  }

  // Footer / Signatures
  const bottomY = signatureY;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);



  // Authorized Signature
  if (ord?.preparedBy) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    doc.text(`Prepared By: ${ord.preparedBy}`, 15, bottomY - 5);
  }
  doc.line(15, bottomY, 70, bottomY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signature", 15, bottomY + 5);

  // Customer Signature
  if (type === "invoice" || type === "challan" || type === "quotation" || type === "receipt") {
    doc.line(pageWidth - 70, bottomY, pageWidth - 15, bottomY);
    doc.text("Customer Signature", pageWidth - 15, bottomY + 5, {
      align: "right",
    });
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "* Note: There is no warranty in case of Burning or Physical Damages.",
    15,
    bottomY + 20,
  );

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("THANK YOU FOR YOUR BUSINESS", pageWidth / 2, bottomY + 30, {
    align: "center",
  });

  if ((order as any)._autoPrint) {
    doc.autoPrint();
    const blobURL = URL.createObjectURL(doc.output("blob"));
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    iframe.src = blobURL;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 100);
    };
  } else if (action === "download") {
    doc.save(type + "_" + (order.id || "") + ".pdf");
  }

  return doc;
};
