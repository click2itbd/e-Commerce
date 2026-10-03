const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const targetStr = `      // TOP RIGHT: COMPANY INFO
      doc.setFontSize(14);
      doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth - 14, currentY, { align: "right" });`;

const newStr = `      // TOP RIGHT: COMPANY INFO
      try {
        const urlsToTry = [settings?.logoUrl, "/logo.png", "/logo.jpeg"].filter(Boolean);
        let dataUrl = "";
        let loadedImg: any = null;

        for (const url of urlsToTry) {
          if (!url) continue;
          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => {
              img.onload = () => resolve(true);
              img.onerror = () => reject(new Error("Load failed"));
              img.src = url as string;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              dataUrl = canvas.toDataURL("image/png");
              loadedImg = img;
              break; 
            }
          } catch (e) {
            console.warn(\`Failed to load logo from \${url}\`);
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
            pageWidth - 14 - textWidth - logoWidth - 5,
            currentY - 11,
            logoWidth,
            logoHeight,
          );
        }
      } catch (err) {
        console.error("Error in logo processing for PDF", err);
      }

      doc.setFontSize(14);
      doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth - 14, currentY, { align: "right" });`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log('Added logo to service receipt');
