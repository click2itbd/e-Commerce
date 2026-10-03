const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/VendorDueList.tsx', 'utf8');

// 1. Add import
if (!code.includes('printMoneyReceipt')) {
    code = code.replace(
        "import { generatePDF } from '../../../lib/pdf';",
        "import { generatePDF, printMoneyReceipt } from '../../../lib/pdf';"
    );
    // fallback if generatePDF isn't there
    if (!code.includes('printMoneyReceipt')) {
        code = code.replace(
            "import { collection",
            "import { printMoneyReceipt } from '../../../lib/pdf';\nimport { collection"
        );
    }
    
    // 2. Add MR button
    const target = `<button
                                      onClick={() => { setEditTx(t); setEditAmount(t.amt); setEditDate(t.date.slice(0, 16)); }}`;
    
    const replacement = `<button
                                      onClick={() => printMoneyReceipt(t, settings)}
                                      className="text-[11px] bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded text-blue-600 font-medium transition-colors"
                                      title="Print Voucher"
                                    >
                                      Receipt
                                    </button>
                                    <button
                                      onClick={() => { setEditTx(t); setEditAmount(t.amt); setEditDate(t.date.slice(0, 16)); }}`;
                                      
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/purchase/VendorDueList.tsx', code);
    console.log("Added printMoneyReceipt button to VendorDueList");
} else {
    console.log("printMoneyReceipt already in VendorDueList");
}
