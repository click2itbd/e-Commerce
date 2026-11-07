import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { logAudit } from '../../../../lib/audit';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { AIPolishButton } from '../../../../components/common/AIPolishButton';
import {  ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus, Settings, FileText, Download, Edit2, Truck, CheckCircle, Clock, AlertCircle, Package, MessageCircle, ShoppingCart , Trash2, Eye, Receipt } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, PaymentAccount } from '../../../../types';
import { calculateAccountBalance, validateSufficientBalance } from '../../../../lib/accountBalance';
import { numberToWords } from '../../../../lib/pdf';

interface ServiceRecord {
  id: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  issueDescription: string;
  isWarranty: boolean;
  serviceCharge: number;
  status: string;
  receivedAt: string;
  equipmentType?: string;
  preparedBy?: string;
  paymentMethod?: string;
  paymentAccountId?: string;
  paymentStatus?: string;
  
  // RMA & Outsource Fields
  serviceType?: 'in_house' | 'outsourced' | 'rma';
  vendorId?: string;
  vendorName?: string;
  rmaStatus?: 'Pending Vendor' | 'Sent to Vendor' | 'Received from Vendor' | 'Delivered';
  newSerialNumber?: string;
  outsourceCost?: number;
  outsourcePaidAmount?: number;
  outsourcePaymentMethod?: string;
  outsourcePaymentAccountId?: string;
  outsourceTxPurchaseId?: string;
  outsourceTxPaymentId?: string;
  outsourcePurchaseId?: string;
  isOutsourced?: boolean;
}

interface SoldSerial {
  id: string;
  serial: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  warrantyEndDate: string;
  soldAt: string;
  orderId: string;
}

interface ServicesProps {
  setActiveTab?: (tab: string) => void;
}

const Services: React.FC<ServicesProps> = ({ setActiveTab }) => {
  const { isAdmin, hasPermission, profile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [soldSerials, setSoldSerials] = useState<SoldSerial[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  
  const suggestEquipmentType = (name: string): string => {
    if (!name) return '';
    const n = name.toLowerCase();
    if (n.includes('hdd') || n.includes('ssd') || n.includes('hard drive') || n.includes('harddisk') || n.includes('storage') || n.includes('nvme') || n.includes('m.2')) return 'Hard Drive / Storage';
    if (n.includes('laptop') || n.includes('notebook') || n.includes('macbook')) return 'Laptop';
    if (n.includes('desktop') || n.includes('pc ') || n.includes('casing') || n.includes('computer')) return 'Desktop';
    if (n.includes('monitor') || n.includes('display') || n.includes('screen')) return 'Monitor';
    if (n.includes('printer') || n.includes('scanner')) return 'Printer';
    if (n.includes('motherboard') || n.includes('mainboard')) return 'Motherboard';
    if (n.includes('gpu') || n.includes('graphics card') || n.includes('rtx') || n.includes('gtx') || n.includes('radeon')) return 'Graphics Card';
    if (n.includes('ram') || n.includes('memory')) return 'RAM / Memory';
    if (n.includes('power supply') || n.includes('psu')) return 'Power Supply';
    if (n.includes('ups') || n.includes('ips')) return 'UPS / Power';
    if (n.includes('router') || n.includes('switch') || n.includes('modem') || n.includes('access point')) return 'Networking';
    if (n.includes('camera') || n.includes('cctv')) return 'CCTV / Camera';
    return '';
  };

  const defaultFormData: any = {
    serialNumber: '',
    customerName: '',
    customerPhone: '',
    productName: '',
    issueDescription: '',
    isWarranty: false,
    serviceCharge: 0,
    status: 'received',
    equipmentType: '',
    preparedBy: '',
    paymentMethod: '',
    paymentAccountId: '',
    paymentStatus: 'pending',
    serviceType: 'in_house' as 'in_house' | 'outsourced' | 'rma',
    vendorId: '',
    vendorName: '',
    outsourceCost: 0,
    outsourcePaidAmount: 0,
    outsourcePaymentMethod: '',
    outsourcePaymentAccountId: '',
    outsourcePurchaseId: '',
    isOutsourced: false,
    rmaStatus: 'Pending Vendor' as any,
    newSerialNumber: '',
  };
  
  const [serviceFormData, setServiceFormData] = useState(defaultFormData);
  const [viewingRecord, setViewingRecord] = useState<ServiceRecord | null>(null);
  const [ledgerView, setLedgerView] = useState<'ledger' | 'products'>('products');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      // 1. Query sold_serials directly
      const serialsSnap = await getDocs(query(collection(db, 'sold_serials'), orderBy('soldAt', 'desc')));
      const serials: SoldSerial[] = serialsSnap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          serial: data.serial || '',
          productName: data.productName || 'Product',
          customerName: data.customerName || 'Walk-in Customer',
          customerPhone: data.customerPhone || '',
          warrantyEndDate: data.warrantyEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          soldAt: data.soldAt || new Date().toISOString(),
          orderId: data.orderId || data.orderDocumentNumber || docSnap.id,
        };
      });

      // 2. Also check recent orders for any items with selectedSerials
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
      ordersSnap.forEach(orderDoc => {
        const orderData = orderDoc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((itm: any) => {
            if (itm.selectedSerials && Array.isArray(itm.selectedSerials)) {
              itm.selectedSerials.forEach((ser: string) => {
                if (!serials.some(s => s.serial.toLowerCase() === ser.toLowerCase())) {
                  const months = itm.warrantyMonths || 12;
                  const soldDate = orderData.createdAt || new Date().toISOString();
                  const endD = new Date(new Date(soldDate).getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
                  serials.push({
                    id: `${orderDoc.id}-${ser}`,
                    serial: ser,
                    productName: itm.name || 'Product',
                    customerName: orderData.customerName || 'Customer',
                    customerPhone: orderData.customerPhone || '',
                    warrantyEndDate: endD,
                    soldAt: soldDate,
                    orderId: orderData.documentNumber || orderDoc.id,
                  });
                }
              });
            }
          });
        }
      });

        setSoldSerials(serials);
  
        // 3. Fetch Service Records
        const servicesSnap = await getDocs(query(collection(db, 'services'), orderBy('receivedAt', 'desc')));
        setServiceRecords(servicesSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            serviceType: data.serviceType || 'in_house',
            vendorId: data.vendorId || '',
            rmaStatus: data.rmaStatus || 'Pending Vendor',
            newSerialNumber: data.newSerialNumber || '',
          } as ServiceRecord;
        }));
        
        // 4. Fetch Vendors
        const vendorsSnap = await getDocs(query(collection(db, 'vendors'), orderBy('name')));
        setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));
        const custSnap = await getDocs(query(collection(db, 'customers')));
        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const accSnap = await getDocs(query(collection(db, 'payment_accounts')));
        setPaymentAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const txSnap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));
        setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      } catch (err) {
        console.error(err);
        toast.error('Failed to load service data');
      }
    };
  
    useEffect(() => {
    fetchData();
  }, []);

  // Global Barcode Scanner for Warranty Check
  useEffect(() => {
    let barcode = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === "Enter") {
        if (barcode.trim().length > 0) {
          setLedgerSearchQuery(barcode.trim());
          setLedgerView("ledger");
        }
        barcode = "";
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = "";
        }, 200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this service record?')) return;
    try {
      const deletedService = serviceRecords.find((s: any) => s.id === id);
      if (deletedService?.outsourceTxPaymentId) {
        try { await deleteDoc(doc(db, 'transactions', deletedService.outsourceTxPaymentId)); } catch (e) { console.warn('Could not delete old outsource payment tx', e); }
      }
      if (deletedService?.outsourceTxPurchaseId) {
        try { await deleteDoc(doc(db, 'transactions', deletedService.outsourceTxPurchaseId)); } catch (e) { console.warn('Could not delete old outsource purchase tx', e); }
      }
      if (deletedService?.outsourcePurchaseId) {
        try { await deleteDoc(doc(db, 'purchases', deletedService.outsourcePurchaseId)); } catch (e) { console.warn('Could not delete old outsource purchase bill doc', e); }
      }
      await deleteDoc(doc(db, 'services', id));
      await logAudit('DELETE', 'Service', `Deleted service ticket #${deletedService?.serialNumber || id} for ${deletedService?.customerName}`, profile?.displayName || profile?.email || 'Admin');
      toast.success('Service record deleted successfully');
    } catch (err) {
      console.error('Error deleting service:', err);
      toast.error('Failed to delete service record');
    }
  };

  const printServiceReceipt = async (record: ServiceRecord) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // TOP LEFT: SERVICE RECEIPT
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("SERVICE RECEIPT", 14, currentY + 10);

      // TOP RIGHT: COMPANY INFO
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
            console.warn(`Failed to load logo from ${url}`);
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
      doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth - 14, currentY, { align: "right" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      
      let finalAddress = settings?.address || "Shop No. 1072, Level 10, Multiplan Center\n69-71, New Elephant Road, Dhaka-1205";
      if (finalAddress.trim() === 'Dhaka, Bangladesh') {
         finalAddress = "Shop No. 1072, Level 10, Multiplan Center\n69-71, New Elephant Road, Dhaka-1205";
      }
      const addressLines = doc.splitTextToSize(finalAddress, 80);
      addressLines.forEach((line: string) => {
        currentY += 5;
        doc.text(line, pageWidth - 14, currentY, { align: "right" });
      });
      
      const finalPhones = settings?.contactPhone ? (settings.contactPhone.includes('+880') ? settings.contactPhone : `+8809640887777, +8801729887777`) : "+8809640887777, +8801729887777";
      currentY += 5;
      doc.text(finalPhones, pageWidth - 14, currentY, { align: "right" });
      
      currentY += 5;
      doc.text("www.click2itbd.com", pageWidth - 14, currentY, { align: "right" });

      currentY += 15;

      // CUSTOMER & TICKET DETAILS BOX
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY, pageWidth - 28, 35, "F");
      
      // Vertical separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2, currentY + 5, pageWidth / 2, currentY + 30);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139); // slate-500
      
      let boxY = currentY + 8;
      doc.text("Customer Information:", 20, boxY);
      doc.text("Ticket Details:", (pageWidth / 2) + 6, boxY);

      boxY += 8;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(record.customerName || "Walk-in Customer", 20, boxY);
      
      doc.setFontSize(10);
      doc.text(`Ticket No: `, (pageWidth / 2) + 6, boxY);
      doc.text(record.id.slice(-6).toUpperCase(), (pageWidth / 2) + 26, boxY);

      boxY += 7;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Phone: ${record.customerPhone || "N/A"}`, 20, boxY);
      doc.text(`Date: ${new Date(record.receivedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}`, (pageWidth / 2) + 6, boxY);

      boxY += 7;
      doc.text(`Status: ${record.status.toUpperCase()}`, (pageWidth / 2) + 6, boxY);

      currentY += 45;

      // TABLE
      autoTable(doc, {
        startY: currentY,
        head: [['S.N.', 'Product Details', 'Information']],
        body: [
          ['1', 'Product Name', record.productName || ''],
          ['2', 'Serial / IMEI', record.serialNumber || ''],
          ['3', 'Equipment Type', record.equipmentType || 'N/A'],
          ['4', 'Service Type', record.isWarranty ? 'Warranty Service' : (record.serviceType === 'rma' ? 'Warranty / RMA' : (record.serviceType === 'outsourced' ? 'Outsourced Repair' : 'Paid Service'))],
          ['5', 'Issue Description', record.issueDescription || '']
        ],
        theme: 'plain',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
          cellPadding: 4
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          cellPadding: 6,
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'normal' },
          1: { cellWidth: 70 },
          2: { cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 40;
      
      if (finalY > 260) {
        doc.addPage();
        finalY = 40;
      }

      // SIGNATURES
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      
      // Authorized Signature
      doc.line(14, finalY, 70, finalY);
      doc.text("Authorized Signature", 14, finalY + 5);
      
      // Customer Signature
      doc.line(pageWidth - 70, finalY, pageWidth - 14, finalY);
      doc.text("Customer Signature", pageWidth - 14, finalY + 5, { align: "right" });

      finalY += 15;
      
      // Note
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("* Note: There is no warranty in case of Burning or Physical Damages.", 14, finalY);

      finalY += 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("THANK YOU FOR YOUR BUSINESS", pageWidth / 2, finalY, { align: "center" });

      doc.save(`Service_Receipt_${record.id.slice(-6)}.pdf`);
      toast.success('Receipt generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt');
    }
  };

  const printServiceBill = async (record: ServiceRecord) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.brandName || 'CLICK2IT', 14, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      currentY += 6;
      doc.text(settings?.contactEmail || '', 14, currentY);
      currentY += 5;
      doc.text(settings?.contactPhone || '', 14, currentY);
      
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text('SERVICE BILL', pageWidth - 14, 25, { align: 'right' });

      currentY += 10;
      doc.setLineWidth(0.5);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(`Name: ${record.customerName}`, 14, currentY);
      currentY += 5;
      doc.text(`Phone: ${record.customerPhone}`, 14, currentY);

      let rightColY = currentY - 11;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', pageWidth - 60, rightColY);
      doc.setFont('helvetica', 'normal');
      rightColY += 6;
      doc.text(`Invoice No: BILL-${record.id.slice(-6).toUpperCase()}`, pageWidth - 60, rightColY);
      rightColY += 5;
      doc.text(`Date: ${new Date(record.receivedAt).toLocaleDateString()}`, pageWidth - 60, rightColY);

      currentY = Math.max(currentY, rightColY) + 15;

      autoTable(doc, {
        startY: currentY,
        head: [['Description', 'Amount']],
        body: [
          [`Service charge for ${record.productName} (SN: ${record.serialNumber})`, formatCurrency(record.serviceCharge, settings)],
          ['Issue: ' + record.issueDescription, ''],
        ],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Due: ${formatCurrency(record.serviceCharge, settings)}`, pageWidth - 14, finalY, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(`Payment Status: ${record.paymentStatus?.toUpperCase() || 'PENDING'}`, 14, finalY);

      doc.save(`Service_Bill_${record.id.slice(-6)}.pdf`);
      toast.success('Bill generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate bill');
    }
  };

  const printServiceMoneyReceipt = async (record: ServiceRecord) => {
    try {
      const { jsPDF } = await import('jspdf');
      // Standard A5 Landscape format (210mm width x 148mm height)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 148

      // Outer Decorative Border (Dark Navy)
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);
      doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

      // Inner Decorative Thin Border
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.25);
      doc.rect(8.8, 8.8, pageWidth - 17.6, pageHeight - 17.6);

      // Header Company Logo
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
          } catch (e) {}
        }
        if (loadedImg && dataUrl) {
          const logoHeight = 12;
          const logoWidth = (loadedImg.width / loadedImg.height) * logoHeight;
          doc.addImage(dataUrl, "PNG", 14, 12, logoWidth, logoHeight);
        }
      } catch (err) {}

      // Header Company Name & Address (Centered)
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(settings?.businessName || settings?.brandName || "CLICK2IT BD", pageWidth / 2, 16, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const address = settings?.address || "Shop No. 1072, Level 10, Multiplan Center, 69-71 New Elephant Road, Dhaka-1205";
      doc.text(String(address), pageWidth / 2, 21, { align: "center" });

      const phone = settings?.contactPhone || "+8809640887777, +8801729887777";
      const email = settings?.contactEmail || "support@click2itbd.com";
      doc.text(`Phone: ${phone} | Email: ${email}`, pageWidth / 2, 25.5, { align: "center" });

      // Title Badge: MONEY RECEIPT (Clean English, No Mojibake)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect((pageWidth / 2) - 28, 29.5, 56, 7.5, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text("MONEY RECEIPT", pageWidth / 2, 34.6, { align: "center" });

      // Receipt Metadata Row
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      const receiptNo = `MR-SVC-${record.serialNumber || record.id.slice(-6).toUpperCase()}`;
      doc.text(`Receipt No: ${receiptNo}`, 14, 43);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Ticket ID: #${record.id.slice(-6).toUpperCase()}`, (pageWidth / 2), 43, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const recDate = new Date(record.receivedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Date: ${recDate}`, pageWidth - 14, 43, { align: "right" });

      // Thin separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(14, 46, pageWidth - 14, 46);

      // Line 1: Received with thanks from
      let rowY = 55;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Received with thanks from :", 14, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(record.customerName || "Customer", 62, rowY);
      if (record.customerPhone) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`(Phone: ${record.customerPhone})`, 140, rowY);
      }
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.3);
      doc.line(60, rowY + 1.5, pageWidth - 14, rowY + 1.5);

      // Line 2: The sum of BDT & Payment Mode & Status
      rowY = 66;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("The sum of BDT :", 14, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${Number(record.serviceCharge || 0).toLocaleString()} /-`, 46, rowY);
      doc.setDrawColor(203, 213, 225);
      doc.line(44, rowY + 1.5, 92, rowY + 1.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Payment Mode :", 98, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text((record.paymentMethod || "Cash").toUpperCase(), 126, rowY);
      doc.line(124, rowY + 1.5, 155, rowY + 1.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Status :", 161, rowY);
      doc.setFont("helvetica", "bold");
      if (record.paymentStatus === 'paid') {
        doc.setTextColor(16, 140, 50); // emerald green
        doc.text("PAID", 175, rowY);
      } else {
        doc.setTextColor(220, 38, 38); // rose red
        doc.text("PENDING", 175, rowY);
      }
      doc.setDrawColor(203, 213, 225);
      doc.line(173, rowY + 1.5, pageWidth - 14, rowY + 1.5);

      // Line 3: Amount (in words)
      rowY = 77;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Amount (in words) :", 14, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      let words = numberToWords(Number(record.serviceCharge || 0)).replace(/\s*and\s*Only$/i, '').replace(/\s*Only$/i, '').trim();
      const wordsText = words ? `${words} Taka Only` : 'Zero Taka Only';
      doc.text(wordsText, 48, rowY);
      doc.setDrawColor(203, 213, 225);
      doc.line(46, rowY + 1.5, pageWidth - 14, rowY + 1.5);

      // Line 4: On account of
      rowY = 88;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("On account of :", 14, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const purpose = `Service & Repair charge for ${record.productName} (S/N: ${record.serialNumber || record.id.slice(-6).toUpperCase()})`;
      doc.text(purpose.slice(0, 85), 42, rowY);
      doc.setDrawColor(203, 213, 225);
      doc.line(40, rowY + 1.5, pageWidth - 14, rowY + 1.5);

      // Line 5: Remarks / Issue Note (if provided)
      rowY = 99;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Work / Issue :", 14, rowY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const issueNote = record.issueDescription ? record.issueDescription.slice(0, 95) : "Servicing & hardware maintenance";
      doc.text(issueNote, 38, rowY);
      doc.setDrawColor(203, 213, 225);
      doc.line(36, rowY + 1.5, pageWidth - 14, rowY + 1.5);

      // Bottom Row: Total Amount Box (Left) + Customer Signature (Center) + Authorized Signature (Right)
      const bottomY = 114;

      // 1. Amount Box (Left)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(15, 23, 42); // slate-900
      doc.setLineWidth(0.6);
      doc.roundedRect(14, bottomY, 52, 15, 1.5, 1.5, "FD");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL AMOUNT (PAID)", 40, bottomY + 4.5, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${Number(record.serviceCharge || 0).toLocaleString()} /-`, 40, bottomY + 11.5, { align: "center" });

      // 2. Customer Signature (Center)
      const custSigCenter = 110;
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.35);
      doc.line(custSigCenter - 22, bottomY + 11, custSigCenter + 22, bottomY + 11);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Customer Signature", custSigCenter, bottomY + 15, { align: "center" });

      // 3. Authorized Signature & Store Stamp (Right)
      const authSigCenter = 172;
      doc.line(authSigCenter - 24, bottomY + 11, authSigCenter + 24, bottomY + 11);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Authorized Signature", authSigCenter, bottomY + 15, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("For CLICK2IT BD", authSigCenter, bottomY + 18.5, { align: "center" });

      // Footer disclaimer note
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("* Note: Computer repairs carry warranty strictly as per invoice terms. Please keep this receipt safe.", pageWidth / 2, 138, { align: "center" });

      doc.save(`Money_Receipt_SVC_${record.serialNumber || record.id.slice(-6)}.pdf`);
      toast.success('Money Receipt downloaded successfully');
    } catch (err) {
      console.error('Failed to generate Money Receipt:', err);
      toast.error('Failed to generate Money Receipt');
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPaidOrZero = Number(serviceFormData.serviceCharge || 0) <= 0 || serviceFormData.paymentStatus === "paid";
      const isOutsourcedMode = Boolean(
        serviceFormData.serviceType === 'outsourced' ||
        serviceFormData.serviceType === 'rma' ||
        serviceFormData.isOutsourced ||
        serviceFormData.vendorId ||
        (serviceFormData.vendorName && serviceFormData.vendorName.trim() !== '') ||
        (Number(serviceFormData.outsourceCost) || 0) > 0
      );
      const oPaid = Number(serviceFormData.outsourcePaidAmount) || 0;
      const oCost = Number(serviceFormData.outsourceCost) || 0;

      // Balance validation for outsource payment
      if (isOutsourcedMode && oPaid > 0) {
        if (!serviceFormData.outsourcePaymentAccountId) {
          toast.error('আউটসোর্স মেরামতের টাকা পরিশোধ করতে অনুগ্রহ করে একটি পেমেন্ট অ্যাকাউন্ট (Paid From Account) সিলেক্ট করুন অথবা সম্পূর্ণ টাকা ডিউ হিসেবে রাখুন!');
          return;
        }
        const targetAcc = paymentAccounts.find(a => a.id === serviceFormData.outsourcePaymentAccountId);
        const balanceCheck = validateSufficientBalance(targetAcc, transactions, oPaid);
        if (!balanceCheck.valid) {
          toast.error(balanceCheck.error || 'নির্বাচিত পেমেন্ট অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
          return;
        }
      }

      // Resolve customer payment method
      let pMethod = serviceFormData.paymentMethod || '';
      if (serviceFormData.paymentAccountId) {
        const acc = paymentAccounts.find(a => a.id === serviceFormData.paymentAccountId);
        if (acc) pMethod = acc.type || acc.name;
      }

      // Resolve outsource payment method
      let oMethod = serviceFormData.outsourcePaymentMethod || '';
      if (serviceFormData.outsourcePaymentAccountId) {
        const acc = paymentAccounts.find(a => a.id === serviceFormData.outsourcePaymentAccountId);
        if (acc) oMethod = acc.type || acc.name;
      }

      // Resolve / Auto-register Vendor for Outsource
      let vId = serviceFormData.vendorId || '';
      let vName = (serviceFormData.vendorName || '').trim();

      if (isOutsourcedMode && (oCost > 0 || vName || vId)) {
        if (!vName && vId) {
          const match = vendors.find(v => v.id === vId);
          if (match) vName = match.name;
        }

        if (!vId && vName) {
          const match = vendors.find(v => v.name.toLowerCase().trim() === vName.toLowerCase());
          if (match) {
            vId = match.id;
          } else {
            // Auto-create registered vendor in Firestore so it permanently exists in Vendor Due List
            try {
              const newVendorRef = await addDoc(collection(db, 'vendors'), {
                name: vName,
                phone: '',
                address: '',
                category: 'Outsource Service',
                createdAt: new Date().toISOString(),
                createdBy: profile?.displayName || profile?.email || 'Admin',
              });
              vId = newVendorRef.id;
            } catch (vErr) {
              console.warn('Could not auto-create vendor doc:', vErr);
            }
          }
        }
      }

      // Clean undefined fields for Firestore
      const cleanData: any = {};
      Object.entries({
        ...serviceFormData,
        vendorId: vId,
        vendorName: vName || serviceFormData.vendorName || '',
        paymentMethod: pMethod,
        outsourcePaymentMethod: oPaid > 0 ? oMethod : '',
        outsourcePaymentAccountId: oPaid > 0 ? serviceFormData.outsourcePaymentAccountId : '',
        paymentStatus: isPaidOrZero ? "paid" : (serviceFormData.paymentStatus || "pending"),
        receivedAt: serviceFormData.receivedAt 
          ? (serviceFormData.receivedAt.includes('T') ? serviceFormData.receivedAt : `${serviceFormData.receivedAt}T12:00:00.000Z`)
          : (editingService?.receivedAt || new Date().toISOString()),
      }).forEach(([k, v]) => {
        if (v !== undefined) cleanData[k] = v;
      });

      // Manage Outsource Financial Transactions & Purchase Bill
      if (isOutsourcedMode && oCost > 0) {
        // If editing, delete prior outsource transactions & purchase doc to avoid duplicates
        if (editingService?.outsourceTxPaymentId) {
          try { await deleteDoc(doc(db, 'transactions', editingService.outsourceTxPaymentId)); } catch (e) { console.warn('Could not delete old outsource payment tx', e); }
        }
        if (editingService?.outsourceTxPurchaseId) {
          try { await deleteDoc(doc(db, 'transactions', editingService.outsourceTxPurchaseId)); } catch (e) { console.warn('Could not delete old outsource purchase tx', e); }
        }
        if (editingService?.outsourcePurchaseId) {
          try { await deleteDoc(doc(db, 'purchases', editingService.outsourcePurchaseId)); } catch (e) { console.warn('Could not delete old outsource purchase doc', e); }
        }

        const docRefNum = cleanData.serialNumber || editingService?.serialNumber || cleanData.id || `SVC-${Date.now().toString().slice(-6)}`;
        const ticketDesc = cleanData.productName ? `${cleanData.productName} (S/N: ${docRefNum})` : `Ticket #${docRefNum}`;
        const finalTxDate = cleanData.receivedAt || new Date().toISOString();
        const vendorDisplayName = vName || 'Outsource Workshop';

        // 1. Create a purchase bill record in `purchases` collection so VendorDueList shows it in unpaid bills
        let purchaseDocRefId = '';
        try {
          const purDoc = await addDoc(collection(db, 'purchases'), {
            billNumber: `SVC-${docRefNum}`,
            documentNumber: `SVC-${docRefNum}`,
            vendorId: vId || '',
            vendorName: vendorDisplayName,
            total: oCost,
            grandTotal: oCost,
            paidAmount: oPaid,
            paid: oPaid,
            due: Math.max(0, oCost - oPaid),
            paymentStatus: oPaid >= oCost ? 'paid' : (oPaid > 0 ? 'partial' : 'pending'),
            paymentMethod: oPaid > 0 ? (oMethod || 'cash') : 'due',
            paymentAccountId: oPaid > 0 ? (serviceFormData.outsourcePaymentAccountId || '') : '',
            items: [{
              name: `Outsource Repair: ${cleanData.productName || 'Service Item'} (Ticket #${docRefNum})`,
              quantity: 1,
              unitPrice: oCost,
              purchasePrice: oCost,
              total: oCost,
            }],
            date: finalTxDate,
            createdAt: new Date().toISOString(),
            createdBy: profile?.displayName || profile?.email || 'Admin',
            type: 'service_outsource',
            source: 'service_warranty',
            serviceTicketNumber: docRefNum,
          });
          purchaseDocRefId = purDoc.id;
          cleanData.outsourcePurchaseId = purDoc.id;
        } catch (purDocErr) {
          console.warn('Could not create outsource purchase doc:', purDocErr);
        }

        // 2. Create purchase transaction in `transactions` collection for vendor ledger & due balance
        const purTx = await addDoc(collection(db, 'transactions'), {
          type: 'purchase',
          entityType: 'vendor',
          entityId: vId || undefined,
          entityName: vendorDisplayName,
          amount: oCost,
          date: finalTxDate,
          documentNumber: `SVC-${docRefNum}`,
          referenceId: purchaseDocRefId,
          reference: `SVC-${docRefNum}`,
          description: `Outsource repair bill for ticket #${docRefNum} - ${ticketDesc}`,
          category: 'Service & Repair Outsource',
          createdAt: new Date().toISOString(),
          createdBy: profile?.displayName || profile?.email || 'Admin',
        });
        cleanData.outsourceTxPurchaseId = purTx.id;

        // 3. If outsourcePaidAmount > 0, create payment_made / expense transaction
        if (oPaid > 0 && serviceFormData.outsourcePaymentAccountId) {
          const payTx = await addDoc(collection(db, 'transactions'), {
            type: vId ? 'payment_made' : 'expense',
            entityType: vId ? 'vendor' : undefined,
            entityId: vId || undefined,
            entityName: vendorDisplayName,
            amount: oPaid,
            date: finalTxDate,
            paymentAccountId: serviceFormData.outsourcePaymentAccountId,
            paymentMethod: oMethod || 'cash',
            documentNumber: `SVC-${docRefNum}`,
            referenceId: purchaseDocRefId,
            reference: `SVC-${docRefNum}`,
            description: `Outsource repair payment for ticket #${docRefNum} - ${ticketDesc} to ${vendorDisplayName}`,
            category: 'Service & Repair Outsource',
            createdAt: new Date().toISOString(),
            createdBy: profile?.displayName || profile?.email || 'Admin',
          });
          cleanData.outsourceTxPaymentId = payTx.id;
        }
      }

      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), cleanData);
        await logAudit('EDIT', 'Service', `Edited service ticket #${cleanData.serialNumber || editingService.id} (${cleanData.status})`, profile?.displayName || profile?.email || 'Admin');
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'services'), cleanData);
        toast.success('Service added successfully');
      }

      setIsAddingService(false);
      setEditingService(null);
      setServiceFormData(defaultFormData);
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleDeliverToPOS = (record: ServiceRecord) => {
    if (record.serviceCharge > 0 && !record.isWarranty) {
      if (window.confirm('Do you want to send this service charge to the Sales form for billing?')) {
        const pendingServiceItem = {
          id: `svc-${record.id}`,
          name: `Service: ${record.productName} (Ticket: ${record.serialNumber || record.id.slice(-6).toUpperCase()})`,
          price: record.serviceCharge,
          costPrice: 0,
          stock: 999,
          quantity: 1,
          isCustomService: true,
          hasSerialTracking: false,
          hasWarranty: false,
          selectedSerials: [],
        };
        localStorage.setItem('pos_pending_service_item', JSON.stringify(pendingServiceItem));
        if (setActiveTab) {
          setActiveTab('sales');
        } else {
          navigate('/pos');
        }
      }
    }
  };

  const updateRmaStatus = async (record: ServiceRecord, newStatus: string, newSerial?: string) => {
    try {
      const updates: any = { rmaStatus: newStatus };
      if (newSerial) {
        updates.newSerialNumber = newSerial;
      }
      if (newStatus === 'Delivered') {
        updates.status = 'delivered'; // Also update the generic status
      }
      await updateDoc(doc(db, 'services', record.id), updates);
      toast.success(`RMA Status updated to ${newStatus}`);
      fetchData();

      if (newStatus === 'Delivered') {
        handleDeliverToPOS(record);
      }
    } catch (error) {
      console.error('Error updating RMA status:', error);
      toast.error('Failed to update status');
    }
  };

  const togglePaymentStatus = async (record: ServiceRecord) => {
    try {
      const nextStatus = record.paymentStatus === "paid" ? "pending" : "paid";
      await updateDoc(doc(db, "services", record.id), { paymentStatus: nextStatus });
      toast.success(`Payment status set to ${nextStatus.toUpperCase()}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    }
  };

  const updateServiceStatus = async (record: ServiceRecord, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "delivered" && Number(record.serviceCharge || 0) <= 0) {
        updates.paymentStatus = "paid";
      }
      await updateDoc(doc(db, 'services', record.id), updates);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchData();

      if (newStatus === 'delivered') {
        handleDeliverToPOS(record);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-[#EF4444]" /> Warranty & Service
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-md">
          <button
            onClick={() => setLedgerView('ledger')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-sm transition-all",
              ledgerView === 'ledger' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Warranty Check
          </button>
          <button
            onClick={() => setLedgerView('products')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-sm transition-all",
              ledgerView === 'products' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Service Tracking
          </button>
        </div>
        <button
          onClick={() => {
            setServiceFormData(defaultFormData);
            setEditingService(null);
            setIsAddingService(true);
            if (ledgerView !== 'products') setLedgerView('products');
          }}
          className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Receive Product for Service
        </button>
      </div>

      {isAddingService && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#081621] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shadow-md">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                    {editingService ? 'Edit Service Record' : 'Add New Service Record'}
                    {editingService && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        Ticket #{editingService.serialNumber || editingService.id.slice(-6).toUpperCase()}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comprehensive service intake, vendor outsourcing & warranty management
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddingService(false); setEditingService(null); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60 space-y-4">
              {/* Top Controls: Horizontal Pill Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Service Type Selection */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Service Execution Mode</span>
                    <span className="text-[10px] font-bold text-slate-400">Choose where repair is done</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceFormData({ ...serviceFormData, serviceType: 'in_house', isOutsourced: false })}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-bold text-center transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                        serviceFormData.serviceType === 'in_house' && !serviceFormData.isOutsourced
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      🛠️ In-House
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceFormData({ ...serviceFormData, serviceType: 'outsourced', isOutsourced: true })}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-bold text-center transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                        serviceFormData.serviceType === 'outsourced' || serviceFormData.isOutsourced
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                      )}
                    >
                      🤝 Outsourced
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceFormData({ ...serviceFormData, serviceType: 'rma', isOutsourced: false })}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-bold text-center transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                        serviceFormData.serviceType === 'rma'
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                      )}
                    >
                      🏷️ Warranty / RMA
                    </button>
                  </div>
                </div>

                {/* Billing / Warranty Selection */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Billing & Warranty Policy</span>
                    <span className="text-[10px] font-bold text-slate-400">Customer charge policy</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceFormData({ ...serviceFormData, isWarranty: false })}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-bold text-center transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                        !serviceFormData.isWarranty
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                      )}
                    >
                      💵 Paid Service
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceFormData({ ...serviceFormData, isWarranty: true, serviceCharge: 0, paymentStatus: 'paid' })}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-bold text-center transition-all border flex items-center justify-center gap-1.5 cursor-pointer",
                        serviceFormData.isWarranty
                          ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                      )}
                    >
                      🛡️ Warranty / Free Service
                    </button>
                  </div>
                </div>
              </div>

              {/* Outsourced Repair / RMA Partner Section */}
              {(serviceFormData.serviceType === 'outsourced' || serviceFormData.serviceType === 'rma' || serviceFormData.isOutsourced) && (
                <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-xl border border-blue-200 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                        {serviceFormData.serviceType === 'rma' ? '🏷️ Supplier / RMA Partner Routing' : '🤝 3rd-Party Outsource Workshop / Mechanic'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                      Outsource Costing & Accounts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-black text-blue-900 uppercase mb-1">
                        Select Registered Vendor (Optional)
                      </label>
                      <select
                        value={serviceFormData.vendorId || ''}
                        onChange={e => {
                          const vId = e.target.value;
                          const foundVendor = vendors.find(v => v.id === vId);
                          setServiceFormData({
                            ...serviceFormData,
                            vendorId: vId,
                            vendorName: foundVendor ? foundVendor.name : (vId === '' ? '' : serviceFormData.vendorName)
                          });
                        }}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                      >
                        <option value="">-- Select from Registered Vendors --</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-blue-900 uppercase mb-1">
                        Vendor / Technician / Workshop Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={serviceFormData.serviceType === 'outsourced' || serviceFormData.serviceType === 'rma' || serviceFormData.isOutsourced}
                        value={serviceFormData.vendorName || ''}
                        onChange={e => {
                          const name = e.target.value;
                          const matched = vendors.find(v => v.name.toLowerCase().trim() === name.toLowerCase().trim());
                          setServiceFormData({
                            ...serviceFormData,
                            vendorName: name,
                            vendorId: matched ? matched.id : serviceFormData.vendorId
                          });
                        }}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                        placeholder="e.g. Master Tech Lab, Smart Care, or Md. Shakil"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-blue-900 uppercase mb-1">
                        Repair / Outsource Cost (৳)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serviceFormData.outsourceCost || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, outsourceCost: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-blue-900 uppercase mb-1">
                        Amount Paid to Vendor (৳)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serviceFormData.outsourcePaidAmount || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, outsourcePaidAmount: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                        placeholder="0"
                      />
                      {(serviceFormData.outsourceCost || 0) > 0 && (Number(serviceFormData.outsourcePaidAmount) || 0) === 0 && (
                        <p className="text-[10px] text-blue-700 mt-1 font-bold">
                          ℹ️ কোনো পেমেন্ট দেওয়া হয়নি — সম্পূর্ণ ৳{serviceFormData.outsourceCost} ভেন্ডর ডিউ (Vendor Due)-তে রেকর্ড হবে।
                        </p>
                      )}
                      {(serviceFormData.outsourceCost || 0) > (serviceFormData.outsourcePaidAmount || 0) && (Number(serviceFormData.outsourcePaidAmount) || 0) > 0 && (
                        <p className="text-[10px] text-amber-800 mt-1 font-bold">
                          ⚠️ আংশিক পরিশোধ: ৳{serviceFormData.outsourcePaidAmount} পরিশোধ হবে, বাকি ৳{(serviceFormData.outsourceCost || 0) - (serviceFormData.outsourcePaidAmount || 0)} ভেন্ডর ডিউ হিসেবে জমা থাকবে।
                        </p>
                      )}
                      {(serviceFormData.outsourceCost || 0) > 0 && (Number(serviceFormData.outsourcePaidAmount) || 0) >= (serviceFormData.outsourceCost || 0) && (
                        <p className="text-[10px] text-emerald-700 mt-1 font-bold">
                          ✅ সম্পূর্ণ পরিশোধ: ভেন্ডরের কোনো বকেয়া (Due) থাকবে না।
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-blue-900 uppercase mb-1">
                        Paid From Account {(Number(serviceFormData.outsourcePaidAmount) || 0) > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={serviceFormData.outsourcePaymentAccountId || ''}
                        onChange={e => {
                          const accId = e.target.value;
                          const acc = paymentAccounts.find(a => a.id === accId);
                          setServiceFormData({
                            ...serviceFormData,
                            outsourcePaymentAccountId: accId,
                            outsourcePaymentMethod: acc ? (acc.type || acc.name) : ''
                          });
                        }}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                        disabled={!((Number(serviceFormData.outsourcePaidAmount) || 0) > 0)}
                      >
                        <option value="">
                          {(Number(serviceFormData.outsourcePaidAmount) || 0) > 0 ? '-- Select Payment Account --' : '-- No Payment (Full Due) --'}
                        </option>
                        {paymentAccounts?.map((acc: any) => {
                          const bal = calculateAccountBalance(acc, transactions);
                          return (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type || 'account'}) — ব্যালেন্স: ৳{Math.round(bal).toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                      {serviceFormData.outsourcePaymentAccountId && (() => {
                        const targetAcc = paymentAccounts.find(a => a.id === serviceFormData.outsourcePaymentAccountId);
                        const selBal = targetAcc ? calculateAccountBalance(targetAcc, transactions) : 0;
                        const isOver = (Number(serviceFormData.outsourcePaidAmount) || 0) > selBal;
                        return (
                          <div className="mt-2 space-y-1.5">
                            <div className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold ${
                              selBal > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                              <span>অ্যাকাউন্ট ব্যালেন্স:</span>
                              <span>৳{Math.round(selBal).toLocaleString()}</span>
                            </div>
                            {isOver && (
                              <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg text-xs space-y-1.5">
                                <div className="font-black text-red-900 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>অপর্যাপ্ত ব্যালেন্স! নির্বাচিত অ্যাকাউন্টে পর্যাপ্ত টাকা নেই।</span>
                                </div>
                                <p className="text-[11px] text-red-700">
                                  বর্তমান ব্যালেন্স <b>৳{Math.round(selBal).toLocaleString()}</b>, কিন্তু পরিশোধ চাওয়া হয়েছে <b>৳{Number(serviceFormData.outsourcePaidAmount).toLocaleString()}</b>। ব্যালেন্স নেগেটিভ করা যাবে না। আপনি চাইলে বাকি বা পুরো টাকা ডিউ রাখতে পারেন:
                                </p>
                                <div className="flex flex-wrap gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setServiceFormData(prev => ({ ...prev, outsourcePaidAmount: 0 }))}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                                  >
                                    সম্পূর্ণ টাকা ডিউ রাখুন (৳0 পরিশোধ)
                                  </button>
                                  {selBal > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setServiceFormData(prev => ({ ...prev, outsourcePaidAmount: Math.floor(selBal) }))}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                                    >
                                      সর্বোচ্চ ৳{Math.floor(selBal).toLocaleString()} পরিশোধ করুন
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Column Horizontal Form Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Customer & Reception Details */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <span>👤</span> Customer & Reception
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Serial Number / S/N <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.serialNumber}
                        onChange={e => setServiceFormData({ ...serviceFormData, serialNumber: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. SN12345678"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        value={serviceFormData.customerName}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        onChange={e => {
                          const cName = e.target.value;
                          const c = customers.find((x: any) => x.name.toLowerCase() === cName.toLowerCase());
                          setServiceFormData({
                            ...serviceFormData,
                            customerName: cName,
                            customerPhone: c ? c.phone : serviceFormData.customerPhone
                          });
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="Type to search or enter customer..."
                      />
                      {showCustomerDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          {customers.filter((c: any) => c.name.toLowerCase().includes(serviceFormData.customerName.toLowerCase())).length > 0 ? (
                            customers.filter((c: any) => c.name.toLowerCase().includes(serviceFormData.customerName.toLowerCase())).map((c: any) => (
                              <div
                                key={c.id}
                                className="px-3 py-2 cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setServiceFormData({
                                    ...serviceFormData,
                                    customerName: c.name,
                                    customerPhone: c.phone || serviceFormData.customerPhone
                                  });
                                  setShowCustomerDropdown(false);
                                }}
                              >
                                <div className="font-bold text-xs text-slate-800">{c.name}</div>
                                {c.phone && <div className="text-[10px] text-slate-500 font-medium">{c.phone}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                              No matching customer. Will be saved as entered.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Customer Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={serviceFormData.customerPhone}
                        onChange={e => setServiceFormData({ ...serviceFormData, customerPhone: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Prepared By (Staff)</label>
                    <input
                      type="text"
                      value={serviceFormData.preparedBy || ''}
                      onChange={e => setServiceFormData({ ...serviceFormData, preparedBy: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                      placeholder="Staff name"
                    />
                  </div>
                </div>

                {/* Column 2: Product & Issue Details */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <span>💻</span> Device & Fault Details
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Product / Item Name <span className="text-red-500">*</span>
                        </label>
                        <AIPolishButton
                          text={serviceFormData.productName}
                          onPolished={polished => {
                            const suggested = (!serviceFormData.equipmentType || serviceFormData.equipmentType === 'Laptop') ? suggestEquipmentType(polished) : '';
                            setServiceFormData({
                              ...serviceFormData,
                              productName: polished,
                              ...(suggested ? { equipmentType: suggested } : {})
                            });
                          }}
                          label="Polish"
                          size="sm"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={serviceFormData.productName}
                        onChange={e => {
                          const pName = e.target.value;
                          const suggested = (!serviceFormData.equipmentType || serviceFormData.equipmentType === 'Laptop') ? suggestEquipmentType(pName) : '';
                          setServiceFormData({
                            ...serviceFormData,
                            productName: pName,
                            ...(suggested ? { equipmentType: suggested } : {})
                          });
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Dell Inspiron 15 3000 Series Laptop"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Equipment Category</label>
                      <input
                        type="text"
                        list="equipment-type-suggestions"
                        value={serviceFormData.equipmentType || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, equipmentType: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Hard Drive / Storage, Laptop, Desktop..."
                      />
                      <datalist id="equipment-type-suggestions">
                        <option value="Hard Drive / Storage" />
                        <option value="Laptop" />
                        <option value="Desktop" />
                        <option value="Monitor" />
                        <option value="Printer" />
                        <option value="Motherboard" />
                        <option value="Graphics Card (GPU)" />
                        <option value="RAM / Memory" />
                        <option value="Power Supply (PSU)" />
                        <option value="UPS / IPS" />
                        <option value="Networking / Router" />
                        <option value="Accessories" />
                      </datalist>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Issue / Problem Description <span className="text-red-500">*</span>
                        </label>
                        <AIPolishButton
                          text={serviceFormData.issueDescription}
                          onPolished={polished => setServiceFormData({ ...serviceFormData, issueDescription: polished })}
                          label="Polish"
                          size="sm"
                        />
                      </div>
                      <textarea
                        required
                        value={serviceFormData.issueDescription}
                        onChange={e => setServiceFormData({ ...serviceFormData, issueDescription: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        rows={3}
                        placeholder="Describe exact customer symptoms, damage or defect notes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Column 3: Billing & Status */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <span>💰</span> Billing & Ticket Status
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Service Charge (৳)</label>
                      <input
                        type="number"
                        min={0}
                        disabled={serviceFormData.isWarranty}
                        value={serviceFormData.serviceCharge}
                        onChange={e => setServiceFormData({ ...serviceFormData, serviceCharge: Number(e.target.value) || 0 })}
                        className={cn(
                          "w-full border rounded-lg p-2 text-xs font-bold",
                          serviceFormData.isWarranty
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-900 border-slate-200 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        )}
                        placeholder="0"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Payment Status</label>
                        <select
                          value={serviceFormData.paymentStatus || (Number(serviceFormData.serviceCharge) <= 0 ? 'paid' : 'pending')}
                          onChange={e => setServiceFormData({ ...serviceFormData, paymentStatus: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Service Status</label>
                        <select
                          value={serviceFormData.status || 'received'}
                          onChange={e => setServiceFormData({ ...serviceFormData, status: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                        >
                          <option value="received">Received</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready">Ready for Pickup</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Payment Method / Account
                      </label>
                      <select
                        value={serviceFormData.paymentAccountId || ''}
                        onChange={e => {
                          const accId = e.target.value;
                          const acc = paymentAccounts.find(a => a.id === accId);
                          setServiceFormData({
                            ...serviceFormData,
                            paymentAccountId: accId,
                            paymentMethod: acc ? (acc.type || acc.name) : ''
                          });
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                      >
                        <option value="">-- Select Payment Method / Account --</option>
                        {paymentAccounts?.map((acc: any) => {
                          const bal = calculateAccountBalance(acc, transactions);
                          return (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type || 'account'}) — ব্যালেন্স: ৳{Math.round(bal).toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Received Date</label>
                      <input
                        type="date"
                        value={serviceFormData.receivedAt?.split('T')[0] || ''}
                        onChange={e => setServiceFormData({ ...serviceFormData, receivedAt: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => { setIsAddingService(false); setEditingService(null); }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#EF4444] hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={15} />
                  {editingService ? 'Update Service Ticket' : 'Receive Product & Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ledgerView === 'ledger' && (
        <div className="p-8 bg-gray-50/30 min-h-[60vh] flex flex-col items-center">
          <div className="max-w-3xl w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-blue-100 text-blue-600 rounded-full mb-2 shadow-sm">
                <ShieldCheck size={40} />
              </div>
              <h3 className="font-bold text-3xl text-gray-800 tracking-tight">Warranty Checker</h3>
              <p className="text-gray-500 text-lg">Scan barcode or enter serial number to verify warranty validity.</p>
              
              <div className="relative max-w-xl mx-auto mt-6 shadow-sm rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input
                  type="text"
                  placeholder="Scan or type serial number..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-lg transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-4">
              {(ledgerSearchQuery ? soldSerials.filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase())) : soldSerials.slice(0, 10))
                .map(record => {
                  const wEndDate = new Date(record.warrantyEndDate);
                  const isExpired = wEndDate < new Date();
                  const daysLeft = Math.ceil((wEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={record.id} className="bg-white border-2 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg">{record.productName}</h4>
                          <p className="font-mono text-sm text-gray-500">SN: {record.serial}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm",
                            isExpired ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
                          )}>
                            {isExpired ? <X size={16} /> : <CheckCircle size={16} />}
                            {isExpired ? 'Warranty Expired' : 'Active Warranty'}
                          </span>
                          {!isExpired && (
                            <span className="text-xs text-gray-500 font-medium">
                              {daysLeft} days remaining
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t border-gray-100 pt-4">
                        <div>
                          <span className="text-gray-500 block mb-1">Customer</span>
                          <span className="font-medium">{record.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Sold Date</span>
                          <span className="font-medium">{new Date(record.soldAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Warranty Ends</span>
                          <span className="font-medium">{wEndDate.toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Order Ref</span>
                          <span className="font-medium">{record.orderId}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => {
                            setServiceFormData({
                              serialNumber: record.serial,
                              customerName: record.customerName,
                              customerPhone: record.customerPhone,
                              productName: record.productName,
                              issueDescription: '',
                              isWarranty: !isExpired,
                              serviceCharge: isExpired ? 500 : 0,
                              status: 'received',
                              equipmentType: suggestEquipmentType(record.productName) || '',
                              preparedBy: '',
                              paymentMethod: '',
                              paymentAccountId: '',
                              paymentStatus: 'pending',
                              serviceType: 'in_house',
                              vendorId: '',
                              vendorName: '',
                              outsourceCost: 0,
                              outsourcePaidAmount: 0,
                              outsourcePaymentMethod: '',
                              outsourcePaymentAccountId: '',
                              isOutsourced: false,
                              rmaStatus: 'Pending Vendor',
                              newSerialNumber: '',
                            });
                            setEditingService(null);
                            setIsAddingService(true);
                            setLedgerView('products');
                          }}
                          className="text-sm bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2 px-6 rounded-md transition-all shadow-sm"
                        >
                          Receive Product for Service
                        </button>
                      </div>
                    </div>
                  );
                })}
              {ledgerSearchQuery && soldSerials.filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase())).length === 0 && (
                <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="font-bold text-gray-700 text-lg">No warranty records found</p>
                  <p className="text-sm mt-1">The serial number doesn't match any sold product.</p>
                </div>
              )}
              {!ledgerSearchQuery && soldSerials.length > 0 && (
                <div className="text-center text-xs text-gray-400 mt-6 font-medium">
                  Showing {Math.min(10, soldSerials.length)} most recent sales. Type or scan a barcode to search.
                </div>
              )}
              {!ledgerSearchQuery && soldSerials.length === 0 && (
                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mt-4">
                  <p className="font-bold text-gray-700">No sold items with serial numbers found.</p>
                  <p className="text-sm mt-1">Make sure you scan serial numbers during POS checkout to enable warranty tracking.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ledgerView === 'products' && (
        <div className="flex flex-col bg-gray-50/30">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-white">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600"><Clock size={24} /></div>
              <div>
                <p className="text-sm text-amber-800 font-medium">Pending</p>
                <h4 className="text-2xl font-bold text-amber-900">{serviceRecords.filter(r => r.status === 'received' || r.rmaStatus === 'Pending Vendor').length}</h4>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><Wrench size={24} /></div>
              <div>
                <p className="text-sm text-blue-800 font-medium">In Repair</p>
                <h4 className="text-2xl font-bold text-blue-900">{serviceRecords.filter(r => r.status === 'in_progress' || r.rmaStatus === 'Sent to Vendor').length}</h4>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg text-green-600"><CheckCircle size={24} /></div>
              <div>
                <p className="text-sm text-green-800 font-medium">Ready</p>
                <h4 className="text-2xl font-bold text-green-900">{serviceRecords.filter(r => r.status === 'ready' || r.rmaStatus === 'Received from Vendor').length}</h4>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Package size={24} /></div>
              <div>
                <p className="text-sm text-purple-800 font-medium">Delivered</p>
                <h4 className="text-2xl font-bold text-purple-900">{serviceRecords.filter(r => r.status === 'delivered' || r.rmaStatus === 'Delivered').length}</h4>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {['All', 'Pending', 'In Progress', 'Ready', 'Delivered', 'RMA'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                    filterStatus === f 
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search ticket, customer, SN..."
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-gray-900 focus:ring-0 text-sm transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Ticket / Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product / SN</th>
                  <th className="px-6 py-4">Status & Type</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceRecords
                  .filter(r => {
                    const searchLower = serviceSearchQuery.toLowerCase();
                    const matchesSearch = r.serialNumber?.toLowerCase().includes(searchLower) || 
                                          r.customerName?.toLowerCase().includes(searchLower) ||
                                          r.id.toLowerCase().includes(searchLower);
                    if (!matchesSearch) return false;
                    
                    if (filterStatus === 'All') return true;
                    if (filterStatus === 'Pending') return r.status === 'received' || r.rmaStatus === 'Pending Vendor';
                    if (filterStatus === 'In Progress') return r.status === 'in_progress' || r.rmaStatus === 'Sent to Vendor';
                    if (filterStatus === 'Ready') return r.status === 'ready' || r.rmaStatus === 'Received from Vendor';
                    if (filterStatus === 'Delivered') return r.status === 'delivered' || r.rmaStatus === 'Delivered';
                    if (filterStatus === 'RMA') return r.serviceType === 'rma';
                    
                    return true;
                  })
                  .map((record) => (
                  <tr key={record.id} className="bg-white border-b hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(record)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer flex items-center gap-1"
                        title="Click to view full ticket details"
                      >
                        <span>{record.id.slice(-6).toUpperCase()}</span>
                      </button>
                      <div className="text-xs text-gray-500">{new Date(record.receivedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{record.customerName}</div>
                      <div className="text-xs text-gray-500">{record.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold line-clamp-1">{record.productName}</div>
                      <div className="text-xs font-mono text-gray-500">
                        {record.serialNumber}
                        {record.newSerialNumber && (
                          <span className="text-green-600 block mt-0.5">
                            ↳ Replaced: {record.newSerialNumber}
                          </span>
                        )}
                      </div>
                      {record.equipmentType && <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{record.equipmentType}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {record.serviceType === 'rma' ? (
                          <>
                            <span className="px-2 py-1 rounded text-[10px] font-bold w-fit bg-indigo-100 text-indigo-800 flex items-center gap-1 border border-indigo-200">
                              <ShieldCheck size={12} /> VENDOR RMA
                            </span>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.rmaStatus === 'Pending Vendor' ? "bg-amber-100 text-amber-800" :
                              record.rmaStatus === 'Sent to Vendor' ? "bg-blue-100 text-blue-800" :
                              record.rmaStatus === 'Received from Vendor' ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {record.rmaStatus?.toUpperCase()}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.status === 'received' ? "bg-amber-100 text-amber-800" :
                              record.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                              record.status === 'ready' ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.isWarranty ? "bg-purple-100 text-purple-800" :
                              Number(record.serviceCharge) <= 0 ? "bg-slate-100 text-slate-700" :
                              "bg-orange-100 text-orange-800"
                            )}>
                              {record.isWarranty ? "WARRANTY" : Number(record.serviceCharge) <= 0 ? "FREE / COMPLIMENTARY" : "PAID SERVICE"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {!record.isWarranty ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-sm text-gray-900">{formatCurrency(record.serviceCharge, settings)}</span>
                          <div className="flex flex-wrap items-center gap-1">
                            {Number(record.serviceCharge) <= 0 ? (
                              <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                PAID / NO CHARGE
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => togglePaymentStatus(record)}
                                title="Click to toggle Paid / Pending"
                                className={cn(
                                  "px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase cursor-pointer hover:opacity-80 active:scale-95 transition-all",
                                  record.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}
                              >
                                {record.paymentStatus || 'pending'}
                              </button>
                            )}
                            {Number(record.serviceCharge) > 0 && record.paymentMethod && (
                              <span className="text-[9px] text-gray-500 bg-gray-100 py-0.5 px-1.5 rounded-[4px] uppercase">{record.paymentMethod.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Free (Warranty)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end">
                       {record.serviceType === 'rma' ? (
                         <>
                           {record.rmaStatus === 'Pending Vendor' && (
                             <button onClick={() => updateRmaStatus(record, 'Sent to Vendor')} className="text-orange-500 hover:text-orange-700 mx-1 bg-orange-50 hover:bg-orange-100 p-1.5 rounded shadow-sm transition-all" title="Send to Vendor">
                               <Truck size={16} />
                             </button>
                           )}
                           {record.rmaStatus === 'Sent to Vendor' && (
                             <button onClick={() => {
                               const newSerial = prompt('Enter new Serial Number if replaced (or leave blank if same):');
                               if (newSerial !== null) {
                                 updateRmaStatus(record, 'Received from Vendor', newSerial);
                               }
                             }} className="text-blue-500 hover:text-blue-700 mx-1 bg-blue-50 hover:bg-blue-100 p-1.5 rounded shadow-sm transition-all" title="Receive from Vendor">
                               <RefreshCw size={16} />
                             </button>
                           )}
                           {record.rmaStatus === 'Received from Vendor' && (
                             <button onClick={() => updateRmaStatus(record, 'Delivered')} className="text-green-600 hover:text-green-800 mx-1 bg-green-50 hover:bg-green-100 p-1.5 rounded shadow-sm transition-all" title="Deliver to Customer">
                               <CheckCircle size={16} />
                             </button>
                           )}
                         </>
                       ) : (
                         <div className="flex flex-wrap items-center gap-1.5">
                           {record.status === 'received' && (
                             <button onClick={() => updateServiceStatus(record, 'in_progress')} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors" title="Mark In Progress">
                               <Wrench size={12} /> Start Repair
                             </button>
                           )}
                           {record.status === 'in_progress' && (
                             <button onClick={() => updateServiceStatus(record, 'ready')} className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded transition-colors" title="Mark Ready">
                               <CheckCircle size={12} /> Mark Ready
                             </button>
                           )}
                           {record.status === 'ready' && (
                             <button onClick={() => updateServiceStatus(record, 'delivered')} className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded transition-colors" title="Mark Delivered">
                               <Package size={12} /> Deliver
                             </button>
                           )}
                           {record.status === 'delivered' && (
                              <div className="flex items-center gap-1.5">
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded shadow-2xs">
                                  <CheckCircle size={12} className="text-emerald-600" /> Delivered
                                </span>
                                <button onClick={() => updateServiceStatus(record, 'received')} className="text-gray-400 hover:text-amber-700 p-1 rounded hover:bg-amber-50 transition-colors" title="Revert to Received / In Progress">
                                  <RefreshCw size={11} />
                                </button>
                              </div>
                           )}
                         </div>
                       )}

                       <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100 w-full">
                         <button
                           type="button"
                           onClick={() => setViewingRecord(record)}
                           className="text-gray-500 hover:text-indigo-700 bg-gray-50 hover:bg-indigo-50 p-1.5 rounded shadow-sm transition-all"
                           title="View Ticket Details"
                         >
                           <Eye size={14} />
                         </button>
                         {record.customerPhone && (
                           <a href={`https://wa.me/${record.customerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 p-1.5 rounded shadow-sm transition-all" title="Message on WhatsApp">
                             <MessageCircle size={14} />
                           </a>
                         )}
                         <button onClick={() => printServiceReceipt(record)} className="text-gray-500 hover:text-blue-700 bg-gray-50 hover:bg-blue-50 p-1.5 rounded shadow-sm transition-all" title="Print Receipt">
                           <FileText size={14} />
                         </button>
                         {!record.isWarranty && record.serviceCharge > 0 && (
                            <>
                              <button onClick={() => printServiceBill(record)} className="text-gray-500 hover:text-green-700 bg-gray-50 hover:bg-green-50 p-1.5 rounded shadow-sm transition-all" title="Print Bill">
                                <Download size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => printServiceMoneyReceipt(record)}
                                className="text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 p-1.5 rounded shadow-sm transition-all"
                                title="Print Money Receipt (মানি রিসিট)"
                              >
                                <Receipt size={14} />
                              </button>
                            </>
                          )}
                         {!record.isWarranty && record.serviceCharge > 0 && (record.status === 'delivered' || record.rmaStatus === 'Delivered') && (
                           <button onClick={() => handleDeliverToPOS(record)} className="text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 p-1.5 rounded shadow-sm transition-all" title="Send to Sales">
                             <ShoppingCart size={14} />
                           </button>
                         )}
                         <button onClick={() => { setEditingService(record); setServiceFormData({...record, receivedAt: record.receivedAt ? record.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0], vendorId: record.vendorId || '', vendorName: record.vendorName || '', serviceType: record.serviceType || (record.vendorId || record.vendorName || record.isOutsourced ? 'outsourced' : 'in_house'), rmaStatus: record.rmaStatus || 'Pending Vendor', equipmentType: record.equipmentType || suggestEquipmentType(record.productName) || '', isWarranty: !!record.isWarranty, status: record.status || 'received', paymentMethod: record.paymentMethod || '', paymentAccountId: record.paymentAccountId || '', paymentStatus: record.paymentStatus || 'pending', medeaPayment: (record as any).medeaPayment || '', outsourceCost: record.outsourceCost || 0, outsourcePaidAmount: record.outsourcePaidAmount || 0, outsourcePaymentMethod: record.outsourcePaymentMethod || '', outsourcePaymentAccountId: record.outsourcePaymentAccountId || '', outsourcePurchaseId: record.outsourcePurchaseId || '', isOutsourced: record.isOutsourced || ((record.outsourceCost || 0) > 0)}); setIsAddingService(true); }} className="text-gray-500 hover:text-amber-700 bg-gray-50 hover:bg-amber-50 p-1.5 rounded shadow-sm transition-all ml-auto" title="Edit Service/Payment">
                           <Edit2 size={14} />
                         </button>
                          <button onClick={() => handleDeleteService(record.id)} className="text-gray-500 hover:text-red-700 bg-gray-50 hover:bg-red-50 p-1.5 rounded shadow-sm transition-all" title="Delete Service">
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ── VIEW SERVICE TICKET DETAILS MODAL ── */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      Service Ticket #{viewingRecord.serialNumber || viewingRecord.id.slice(-6).toUpperCase()}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                      {viewingRecord.serviceType === 'rma' ? 'Vendor RMA' : (viewingRecord.serviceType === 'outsourced' || viewingRecord.isOutsourced ? 'Outsourced' : 'In-House')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Received: {new Date(viewingRecord.receivedAt).toLocaleString()}
                    {viewingRecord.deliveredAt && ` • Delivered: ${new Date(viewingRecord.deliveredAt).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">Current Status:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                    viewingRecord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    viewingRecord.status === 'ready' ? 'bg-green-100 text-green-800 border border-green-200' :
                    viewingRecord.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {viewingRecord.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">Policy:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                    viewingRecord.isWarranty ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    Number(viewingRecord.serviceCharge) <= 0 ? 'bg-slate-100 text-slate-800' :
                    'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}>
                    {viewingRecord.isWarranty ? 'Warranty Service' : Number(viewingRecord.serviceCharge) <= 0 ? 'Free Service' : 'Paid Service'}
                  </span>
                </div>
              </div>

              {/* Customer & Product Information (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Customer Details */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Customer Information
                  </span>
                  <div className="font-bold text-sm text-gray-900">{viewingRecord.customerName}</div>
                  <div className="text-gray-600 flex items-center gap-1.5">
                    <span>Phone:</span>
                    <strong className="text-gray-900">{viewingRecord.customerPhone || 'N/A'}</strong>
                  </div>
                  {viewingRecord.customerEmail && (
                    <div className="text-gray-600">
                      <span>Email:</span> <span className="text-gray-900">{viewingRecord.customerEmail}</span>
                    </div>
                  )}
                  {viewingRecord.customerAddress && (
                    <div className="text-gray-600">
                      <span>Address:</span> <span className="text-gray-900">{viewingRecord.customerAddress}</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Device / Product Details
                  </span>
                  <div className="font-bold text-sm text-gray-900">{viewingRecord.productName}</div>
                  <div className="text-gray-600 flex items-center gap-1.5 font-mono">
                    <span>Serial No:</span>
                    <strong className="text-gray-900">{viewingRecord.serialNumber || 'N/A'}</strong>
                  </div>
                  {viewingRecord.equipmentType && (
                    <div className="text-gray-600">
                      <span>Equipment Type:</span> <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold">{viewingRecord.equipmentType}</span>
                    </div>
                  )}
                  {viewingRecord.newSerialNumber && (
                    <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                      <span>Replacement S/N:</span> <strong className="font-mono">{viewingRecord.newSerialNumber}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue Description */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Reported Issue / Problem Description
                </span>
                <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {viewingRecord.issueDescription || 'No issue description provided.'}
                </p>
              </div>

              {/* Technician Notes */}
              {viewingRecord.notes && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                    Technician Diagnostic Notes
                  </span>
                  <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
                    {viewingRecord.notes}
                  </p>
                </div>
              )}

              {/* Billing & Customer Payment */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Customer Billing & Payment
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 block">Service Charge</span>
                    <strong className="text-sm text-gray-900">৳{Number(viewingRecord.serviceCharge || 0).toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 block">Parts / Cost Price</span>
                    <strong className="text-sm text-gray-900">৳{Number(viewingRecord.costPrice || 0).toLocaleString()}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 block">Payment Status</span>
                    <strong className={`text-xs uppercase font-black ${viewingRecord.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {viewingRecord.paymentStatus || 'pending'}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 block">Payment Method</span>
                    <strong className="text-xs text-gray-800 uppercase">
                      {viewingRecord.paymentMethod || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Outsource / Vendor Repair Details (If Applicable) */}
              {(viewingRecord.serviceType === 'outsourced' || viewingRecord.serviceType === 'rma' || viewingRecord.isOutsourced || (viewingRecord.outsourceCost || 0) > 0 || viewingRecord.vendorName) && (
                <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <span>🤝 Outsource Workshop / Vendor Repair</span>
                    </span>
                    {viewingRecord.serviceType === 'rma' && viewingRecord.rmaStatus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        RMA: {viewingRecord.rmaStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">Assigned Vendor / Workshop</span>
                      <strong className="text-xs text-blue-950">{viewingRecord.vendorName || 'Outsource Workshop'}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-center">
                      <span className="text-[10px] text-slate-500 block">Outsource Cost</span>
                      <strong className="text-xs text-slate-900">৳{Number(viewingRecord.outsourceCost || 0).toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-center">
                      <span className="text-[10px] text-slate-500 block">Amount Paid</span>
                      <strong className="text-xs text-emerald-700">৳{Number(viewingRecord.outsourcePaidAmount || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Remaining Due Banner */}
                  {(Number(viewingRecord.outsourceCost || 0) - Number(viewingRecord.outsourcePaidAmount || 0)) > 0 && (
                    <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>Remaining Vendor Due:</span>
                      <span className="text-rose-700 font-black">
                        ৳{(Number(viewingRecord.outsourceCost || 0) - Number(viewingRecord.outsourcePaidAmount || 0)).toLocaleString()} (Recorded in Vendor Due List)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printServiceReceipt(viewingRecord)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold text-xs border border-gray-300 shadow-2xs transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print Receipt</span>
                </button>

                {!viewingRecord.isWarranty && viewingRecord.serviceCharge > 0 && (
                  <button
                    type="button"
                    onClick={() => printServiceBill(viewingRecord)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold text-xs border border-gray-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Print Bill</span>
                  </button>
                )}
                {!viewingRecord.isWarranty && Number(viewingRecord.serviceCharge || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => printServiceMoneyReceipt(viewingRecord)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    title="Print Money Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Money Receipt</span>
                  </button>
                )}

                {viewingRecord.customerPhone && (
                  <a
                    href={`https://wa.me/${viewingRecord.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-200 shadow-2xs transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rec = viewingRecord;
                    setViewingRecord(null);
                    setEditingService(rec);
                    setServiceFormData({
                      ...rec,
                      receivedAt: rec.receivedAt ? rec.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                      vendorId: rec.vendorId || '',
                      vendorName: rec.vendorName || '',
                      serviceType: rec.serviceType || (rec.vendorId || rec.vendorName || rec.isOutsourced ? 'outsourced' : 'in_house'),
                      rmaStatus: rec.rmaStatus || 'Pending Vendor',
                      equipmentType: rec.equipmentType || suggestEquipmentType(rec.productName) || '',
                      isWarranty: !!rec.isWarranty,
                      status: rec.status || 'received',
                      paymentMethod: rec.paymentMethod || '',
                      paymentAccountId: rec.paymentAccountId || '',
                      paymentStatus: rec.paymentStatus || 'pending',
                      medeaPayment: (rec as any).medeaPayment || '',
                      outsourceCost: rec.outsourceCost || 0,
                      outsourcePaidAmount: rec.outsourcePaidAmount || 0,
                      outsourcePaymentMethod: rec.outsourcePaymentMethod || '',
                      outsourcePaymentAccountId: rec.outsourcePaymentAccountId || '',
                      outsourcePurchaseId: rec.outsourcePurchaseId || '',
                      isOutsourced: rec.isOutsourced || ((rec.outsourceCost || 0) > 0),
                    });
                    setIsAddingService(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
