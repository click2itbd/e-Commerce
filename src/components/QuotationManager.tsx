import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, Product, Customer, CartItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, X, Trash2, FileText, Search, Edit, Eye, Printer, Download, CheckCircle, ArrowLeft, Mail, FileSignature } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateDocumentNumber } from '../lib/numbering';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendEmail } from '../services/emailService';
import { Pagination } from './common/Pagination';

export const QuotationManager: React.FC = () => {
  const [quotations, setQuotations] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = {
    documentNumber: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as CartItem[],
    discountAmount: 0,
    termsAndConditions: '',
    status: 'pending' as Order['status'],
    createdAt: '',
    validUntil: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [productSearch, setProductSearch] = useState('');

  // Added custom item modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    discount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(query(collection(db, 'orders'), where('type', '==', 'quotation'), orderBy('createdAt', 'desc'), limit(200)));
      const pSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
      const cSnap = await getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(200)));

      setQuotations(qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (!formData.customerName) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const subtotal = formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
      const finalTotal = Math.max(0, subtotal - formData.discountAmount);
      
      let docRefId = editingId;
      
      if (viewMode === 'edit' && editingId) {
        const updateData = {
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          items: formData.items,
          total: finalTotal,
          discountAmount: formData.discountAmount,
          termsAndConditions: formData.termsAndConditions,
          status: formData.status,
          validUntil: formData.validUntil
        };
        await updateDoc(doc(db, 'orders', editingId), updateData);
        setQuotations(quotations.map(q => q.id === editingId ? { ...q, ...updateData } : q));
        toast.success('Quotation updated successfully!');
      } else {
        const docNumber = await generateDocumentNumber('QUO');
        const newQuotation: Omit<Order, 'id'> = {
          userId: 'admin',
          type: 'quotation',
          status: 'pending',
          documentNumber: docNumber,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          items: formData.items,
          total: finalTotal,
          discountAmount: formData.discountAmount,
          termsAndConditions: formData.termsAndConditions,
          createdAt: new Date().toISOString(),
          validUntil: formData.validUntil
        };
        const docRef = await addDoc(collection(db, 'orders'), newQuotation);
        setQuotations([{ id: docRef.id, ...newQuotation } as Order, ...quotations]);
        toast.success('Quotation created successfully!');
      }
      
      setViewMode('list');
      setFormData(initialFormState);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save quotation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation permanently?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      setQuotations(quotations.filter(q => q.id !== id));
      if (editingId === id && viewMode !== 'list') {
         setViewMode('list');
      }
      toast.success('Quotation deleted');
    } catch (err) {
      toast.error('Failed to delete quotation');
    }
  };

  const addItem = (product: Product) => {
    if (formData.items.find(i => i.id === product.id)) {
      toast.error('Item already added');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...product, quantity: 1, discount: 0 }]
    });
    setProductSearch('');
  };

  const addCustomItem = () => {
    if (!customItemForm.name) {
      toast.error('Item name is required');
      return;
    }
    const newItem: any = {
      id: `custom-${Date.now()}`,
      productId: `custom-${Date.now()}`,
      name: customItemForm.name,
      description: customItemForm.description,
      price: Number(customItemForm.price),
      quantity: Number(customItemForm.quantity),
      discount: Number(customItemForm.discount),
      isCustomService: true,
      category: 'Custom'
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
    setShowCustomModal(false);
    setCustomItemForm({ name: '', description: '', quantity: 1, price: 0, discount: 0 });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'quantity' && value < 1) value = 1;
    if (field === 'discount' && value < 0) value = 0;
    if (field === 'price' && value < 0) value = 0;
    
    (newItems[idx] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
  };

  const filteredQuotations = quotations.filter(q => {
    const s = searchQuery.toLowerCase();
    return q.customerName?.toLowerCase().includes(s) || 
           q.documentNumber?.toLowerCase().includes(s) ||
           q.customerPhone?.toLowerCase().includes(s);
  });

  const handleDownloadPDF = async (q: Order, action: 'download' | 'print' | 'base64' = 'download') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header - Company Info
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      // Add Logo image (adjust width and height for correct aspect ratio)
      doc.addImage(base64data, 'PNG', 14, 15, 30, 15);
    } catch (e) {
      console.error('Error loading logo', e);
      // Fallback text if logo fails
      doc.setFontSize(22);
      doc.setFont('', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text('CLICK 2 IT BD', 14, 22);
    }
    
    doc.setFontSize(9);
    doc.setFont('', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Shop No. 1072, Level-10, Multiplan Center', 14, 35);
    doc.text('69-71, New Elephant Road, Dhaka-1205, Bangladesh.', 14, 39);
    doc.text('Phone: 01916618866, 01712258259 | Web: click2itbd.com', 14, 43);
    
    // Header - Document Title
    doc.setFontSize(20);
    doc.setFont('', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('QUOTATION', pageWidth - 14, 22, { align: 'right' });
    
    // Reset colors
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    
    // Info section Y offset (increased for more breathing room)
    const infoY = 60;
    doc.text(`Quote No: ${q.documentNumber || q.id.slice(0,8)}`, 14, infoY);
    doc.text(`Date: ${new Date(q.createdAt).toLocaleDateString()} ${new Date(q.createdAt).toLocaleTimeString()}`, 14, infoY + 6);
    doc.text(`Status: ${q.status.toUpperCase()}`, 14, infoY + 12);
    if (q.validUntil) {
      doc.setTextColor(220, 38, 38); // Red color for urgency
      doc.text(`Valid Until: ${new Date(q.validUntil).toLocaleDateString()}`, 14, infoY + 18);
      doc.setTextColor(50, 50, 50);
    }
    
    // Customer Info
    doc.setFontSize(11);
    doc.setFont('', 'bold');
    doc.text('Quotation For:', pageWidth - 80, infoY);
    doc.setFont('', 'normal');
    doc.setFontSize(10);
    doc.text(q.customerName || 'N/A', pageWidth - 80, infoY + 6);
    doc.text(`Phone: ${q.customerPhone || 'N/A'}`, pageWidth - 80, infoY + 12);
    doc.text(`Email: ${q.customerEmail || 'N/A'}`, pageWidth - 80, infoY + 18);
    if (q.shippingAddress) {
      doc.text(`Address: ${q.shippingAddress}`, pageWidth - 80, infoY + 24);
    }
    
    // Table (starts further down)
    const tableY = infoY + 35;
    const tableBody = q.items.map(item => [
      item.name + ((item as any).isCustomService ? ' (Custom)' : ''),
      item.quantity.toString(),
      formatCurrency(item.price, {}),
      formatCurrency(item.discount || 0, {}),
      formatCurrency((item.price * item.quantity) - (item.discount || 0), {})
    ]);
    
    let finalY = tableY;
    
    if (q.items.length > 0) {
      autoTable(doc, {
        startY: tableY,
        head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    const subtotal = q.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
    
    doc.text('Subtotal:', 130, finalY);
    doc.text(formatCurrency(subtotal, {}), 195, finalY, { align: 'right' });
    
    doc.text('Discount:', 130, finalY + 7);
    doc.text(formatCurrency(q.discountAmount || 0, {}), 195, finalY + 7, { align: 'right' });
    
    doc.setFont('', 'bold');
    doc.text('Grand Total:', 130, finalY + 15);
    doc.setTextColor(79, 70, 229);
    doc.text(formatCurrency(q.total, {}), 195, finalY + 15, { align: 'right' });
    
      if(q.termsAndConditions) {
          doc.setTextColor(0, 0, 0);
          doc.setFont('', 'bold');
          // Start terms further down from the table/totals
          const termsStartY = finalY + 30;
          doc.text('Terms & Conditions:', 14, termsStartY);
          doc.setFont('', 'normal');
          doc.setFontSize(9);
          const splitTerms = doc.splitTextToSize(q.termsAndConditions, 100);
          doc.text(splitTerms, 14, termsStartY + 6);
          finalY = termsStartY + (splitTerms.length * 4) + 10;
      }
      
        // Signatures
        let sigY = doc.internal.pageSize.getHeight() - 35;
        if (finalY > sigY - 20) {
          doc.addPage();
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        doc.line(14, sigY, 70, sigY);
        doc.text('Client Signature & Stamp', 14, sigY + 5);
        
        doc.line(140, sigY, 196, sigY);
        doc.text('Authorized Signature', 140, sigY + 5);
      
      if (action === 'print') {
        window.open(doc.output('bloburl'), '_blank');
      } else if (action === 'base64') {
        return doc.output('datauristring').split(',')[1];
      } else {
        doc.save(`Quotation_${q.documentNumber || q.id}.pdf`);
      }
    };

  const openEdit = (q: Order) => {
    setFormData({
      documentNumber: q.documentNumber || '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      shippingAddress: q.shippingAddress || '',
      items: q.items || [],
      discountAmount: q.discountAmount || 0,
      termsAndConditions: q.termsAndConditions || '',
      status: q.status || 'pending',
      createdAt: q.createdAt || '',
      validUntil: q.validUntil || ''
    });
    setEditingId(q.id);
    setViewMode('edit');
  };

  const openView = (q: Order) => {
    setFormData({
      documentNumber: q.documentNumber || '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      shippingAddress: q.shippingAddress || '',
      items: q.items || [],
      discountAmount: q.discountAmount || 0,
      termsAndConditions: q.termsAndConditions || '',
      status: q.status || 'pending',
      createdAt: q.createdAt || '',
      validUntil: q.validUntil || ''
    });
    setEditingId(q.id);
    setViewMode('view');
  };

  const handleSendEmail = async (q: Order) => {
    if (!q.customerEmail) {
      toast.error('Customer email is missing for this quotation.');
      return;
    }
    
    const toastId = toast.loading('Sending email...');
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4f46e5;">Quotation ${q.documentNumber || q.id.slice(0,8)}</h2>
        <p>Dear ${q.customerName},</p>
        <p>Please find the details of your quotation below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Qty</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">Price</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${q.items.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${item.price}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${(item.price * item.quantity) - (item.discount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-bottom: 20px;">
          <p><strong>Discount:</strong> ${q.discountAmount || 0}</p>
          <h3 style="color: #4f46e5; margin: 5px 0;">Grand Total: BDT ${q.total}</h3>
        </div>
        
          ${q.validUntil ? `<p><em>This quotation is valid until: ${new Date(q.validUntil).toLocaleDateString()}</em></p>` : ''}
          
          <p>If you have any questions or would like to proceed, please reply to this email.</p>
          <p>Thank you,<br>Click2ItBD</p>
        </div>
      `;

      const success = await sendEmail({
        to: q.customerEmail,
        subject: `Your Quotation from Click2ItBD (${q.documentNumber || q.id.slice(0,8)})`,
        html: htmlContent,
        category: 'Quotation',
        orderId: q.id
      });

      if (success) {
        toast.success('Email sent successfully!', { id: toastId });
      } else {
        toast.error('Failed to send email.', { id: toastId });
      }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <FileText className="text-indigo-600" /> 
          {viewMode === 'list' ? 'Quotations Management' : 
           viewMode === 'create' ? 'Create Quotation' : 
           viewMode === 'edit' ? `Edit Quotation ${formData.documentNumber}` : 
           `Quotation Details ${formData.documentNumber}`}
        </h2>
        
        {viewMode === 'list' ? (
          <button 
            onClick={() => { setFormData(initialFormState); setViewMode('create'); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold shadow hover:bg-indigo-700 transition"
          >
            <Plus size={16} /> New Quotation
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="text-gray-600 bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-gray-200 transition"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {viewMode === 'list' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-bold text-gray-500 mb-1">Active Quotations</div>
            <div className="text-2xl font-black text-indigo-600">{quotations.filter(q => q.status !== 'converted' && q.status !== 'cancelled').length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-bold text-gray-500 mb-1">Active Value</div>
            <div className="text-2xl font-black text-green-600">{formatCurrency(quotations.filter(q => q.status !== 'converted' && q.status !== 'cancelled').reduce((sum, q) => sum + q.total, 0), {})}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-bold text-gray-500 mb-1">Expiring Soon (3 days)</div>
            <div className="text-2xl font-black text-orange-500">
              {quotations.filter(q => q.status !== 'converted' && q.status !== 'cancelled' && q.validUntil && new Date(q.validUntil).getTime() > Date.now() && new Date(q.validUntil).getTime() <= Date.now() + (3 * 24 * 60 * 60 * 1000)).length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                placeholder="Search by quote no, customer, phone..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full border border-gray-300 rounded-md py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="text-sm text-gray-500 font-medium">
               {filteredQuotations.length} Quotations
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Quote No.</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white text-sm">
                {loading ? (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">Loading quotations...</td>
                    </tr>
                ) : filteredQuotations.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 italic">No quotations found.</td>
                    </tr>
                ) : (
                    filteredQuotations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(q => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">
                          {q.documentNumber || q.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{new Date(q.createdAt).toLocaleDateString()}</div>
                          <div className="text-gray-400 text-xs">{new Date(q.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{q.customerName}</div>
                          <div className="text-xs text-gray-500">{q.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">
                           {q.items.length} items
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                             q.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                             q.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                             q.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                             q.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                             q.status === 'converted' ? 'bg-purple-100 text-purple-800' : 
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {q.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          {formatCurrency(q.total, {})}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                             <button onClick={() => openView(q)} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition" title="View">
                                <Eye size={16} />
                             </button>
                             <button onClick={() => openEdit(q)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition" title="Edit">
                                <Edit size={16} />
                             </button>
                             <button onClick={() => handleSendEmail(q)} className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition" title="Email to Customer">
                                <Mail size={16} />
                             </button>
                             <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition" title="Delete">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredQuotations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
        </>
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSaveQuotation} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                <input 
                  required 
                  list="customer-list"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={formData.customerName}
                  onChange={e => {
                    const cName = e.target.value;
                    const c = customers.find(x => x.name === cName);
                    setFormData({
                      ...formData, 
                      customerName: cName,
                      customerPhone: c ? c.phone : formData.customerPhone,
                      customerEmail: c ? c.email : formData.customerEmail,
                      shippingAddress: c ? c.address : formData.shippingAddress
                    });
                  }}
                  placeholder="Select or enter customer"
                />
                <datalist id="customer-list">
                  {customers.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input 
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="Customer phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">PENDING</option>
                  <option value="processing">PROCESSING</option>
                  <option value="accepted">ACCEPTED</option>
                  <option value="completed">COMPLETED</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                  <option value="returned">RETURNED</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Valid Until</label>
                <input 
                  type="date"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={formData.validUntil?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Address</label>
                <textarea 
                  rows={2}
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={formData.shippingAddress}
                  onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                  placeholder="Enter complete delivery or billing address"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-sm mb-4">Line Items</h4>
              <div className="mb-4 relative">
                <div className="flex gap-2 mb-4 relative">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      className="w-full border p-2 pl-9 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                      placeholder="Search product to add (by name or SKU)..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={16} /> Custom Item
                  </button>
                </div>
                {productSearch && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto rounded-md">
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())).length > 0 ? (
                      products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                        <div 
                          key={p.id} 
                          className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between border-b last:border-b-0"
                          onClick={() => addItem(p)}
                        >
                          <div>
                            <div className="font-semibold text-sm">{p.name}</div>
                            {p.sku && <div className="text-xs text-gray-500">SKU: {p.sku}</div>}
                          </div>
                          <span className="text-sm font-mono text-indigo-600">{formatCurrency(p.price, {})}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                    )}
                  </div>
                )}
              </div>

              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 w-24">Price (BDT)</th>
                        <th className="p-2 w-24">Qty</th>
                        <th className="p-2 w-24">Discount</th>
                        <th className="p-2 w-28">Total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-sm font-medium">
                            {(item as any).isCustomService ? (
                              <div>
                                <span className="bg-purple-100 text-purple-700 text-[10px] px-1 rounded mr-1">Custom</span>
                                <input 
                                  type="text"
                                  className="w-full border p-1 rounded mt-1"
                                  placeholder="Item name"
                                  value={item.name}
                                  onChange={e => updateItem(idx, 'name', e.target.value)}
                                />
                              </div>
                            ) : (
                              <div>
                                <div>{item.name}</div>
                                {item.sku && <div className="text-xs text-gray-400 font-normal">SKU: {item.sku}</div>}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              className="w-full border p-1 rounded font-mono text-sm"
                              value={item.price}
                              onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="1" 
                              className="w-full border p-1 rounded text-sm"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="w-full border p-1 rounded font-mono text-sm"
                              value={item.discount || 0}
                              onChange={e => updateItem(idx, 'discount', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2 text-sm font-mono font-bold text-gray-700">
                            {formatCurrency((item.price * item.quantity) - (item.discount || 0), {})}
                          </td>
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50 rounded border border-dashed border-gray-200">
                  No items added yet. Search products or add a custom item.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
               <div>
                    <h4 className="font-bold text-sm mb-2 text-gray-700">Terms & Conditions</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- 50% Advance before starting work, 100% upon completion.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">50% Advance</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- 100% Payment required upon work completion.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">100% on Completion</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- No Warranty provided.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">No Warranty</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- 1 Year Full Warranty.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">1 Yr Warranty</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- 1 Year Warranty for _________ product.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Specific Warranty</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Validity: This quotation is valid for 7 days from the date of issue.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">7 Days Validity</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Installation & Delivery charges are included in this quotation.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Install Included</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Service: 1 Year free service support provided (excluding parts).'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">1 Yr Free Service</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Warranty Void: Warranty does not cover physical damage, burn, or liquid damage.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Damage Policy</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Tax/VAT: Prices are exclusive of VAT and Tax. If applicable, it will be added to the final invoice.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Tax Excluded</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Extra Material: Any extra wiring or materials not mentioned in this quotation will be charged separately.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Extra Wiring</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Timeline: Project will be completed within ____ days after receiving the advance payment.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Timeline</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Stock: Offer is subject to product availability in stock at the time of confirmation.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Subject to Stock</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Maintenance: Annual Maintenance Contract (AMC) is available after the warranty period ends.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">AMC Available</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Payment Method: Payment must be made via Bank Transfer or verified company Mobile Banking account.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Payment Method</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Cancellation Policy: Orders cannot be cancelled once installation materials are dispatched or work has commenced.'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Cancellation</button>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + '- Support Hours: Service support is available during standard business hours (10 AM - 6 PM).'}))} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded text-gray-700">Support Hours</button>
                    </div>
                  <textarea
                    rows={4}
                    placeholder="Enter manual terms and conditions here..."
                    className="w-full border p-2 text-sm rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={formData.termsAndConditions}
                    onChange={e => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  />
               </div>
               
               <div className="text-right space-y-3 flex flex-col justify-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <div className="flex justify-between items-center gap-4 text-sm px-2">
                       <span className="text-gray-500 font-medium">Subtotal:</span>
                       <span className="font-mono font-bold">{formatCurrency(calculateSubtotal(), {})}</span>
                   </div>
                   <div className="flex justify-between items-center gap-4 text-sm px-2">
                       <span className="text-gray-500 font-medium">Global Discount (BDT):</span>
                       <input 
                           type="number" 
                           className="border rounded p-1 w-24 text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none" 
                           value={formData.discountAmount}
                           onChange={e => {
                              let val = parseFloat(e.target.value) || 0;
                              if (val < 0) val = 0;
                              if (val > calculateSubtotal()) val = calculateSubtotal();
                              setFormData({ ...formData, discountAmount: val })
                           }}
                           min="0"
                       />
                   </div>
                   <div className="flex justify-between items-center gap-4 text-lg border-t pt-3 px-2">
                       <span className="font-bold text-gray-800">Total:</span>
                       <span className="font-mono font-black text-indigo-600">
                           {formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), {})}
                       </span>
                   </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setViewMode('list')}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-bold text-sm shadow hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <CheckCircle size={16} />
                {viewMode === 'edit' ? 'Update Quotation' : 'Save Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'view' && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
           {/* Actions */}
           <div className="flex justify-end gap-3 mb-8">
              <button onClick={() => openEdit(quotations.find(q => q.id === editingId)!)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition">
                 <Edit size={16} /> Edit
              </button>
              <button onClick={() => handleDownloadPDF(quotations.find(q => q.id === editingId)!, 'print')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
                 <Printer size={16} /> Print
              </button>
              <button onClick={() => handleDownloadPDF(quotations.find(q => q.id === editingId)!, 'download')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition">
                 <Download size={16} /> Download PDF
              </button>
           </div>

           {/* View Layout */}
           <div className="border border-gray-200 p-8 rounded-lg">
               <div className="flex justify-between items-start mb-8">
                   <div>
                       <h1 className="text-3xl font-black text-indigo-600 mb-1">QUOTATION</h1>
                       <div className="text-sm text-gray-500 font-medium">Quote No: {formData.documentNumber}</div>
                       <div className="text-sm text-gray-500 font-medium">Date: {new Date(formData.createdAt).toLocaleDateString()}</div>
                       <div className="mt-2">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${formData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {formData.status}
                          </span>
                       </div>
                   </div>
                   <div className="text-right">
                       <h3 className="font-bold text-gray-800 mb-1">Quotation For:</h3>
                       <div className="text-sm font-medium text-gray-900">{formData.customerName}</div>
                       {formData.customerPhone && <div className="text-sm text-gray-600">{formData.customerPhone}</div>}
                       {formData.customerEmail && <div className="text-sm text-gray-600">{formData.customerEmail}</div>}
                       {formData.shippingAddress && <div className="text-sm text-gray-600 mt-1 max-w-xs">{formData.shippingAddress}</div>}
                   </div>
               </div>

               <table className="w-full text-left mb-8 border-collapse">
                   <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-sm">
                       <tr>
                           <th className="py-3 px-4 font-bold">Description</th>
                           <th className="py-3 px-4 font-bold text-center">Qty</th>
                           <th className="py-3 px-4 font-bold text-right">Unit Price</th>
                           <th className="py-3 px-4 font-bold text-right">Discount</th>
                           <th className="py-3 px-4 font-bold text-right">Total</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 text-sm">
                       {formData.items.map((item, idx) => (
                           <tr key={idx}>
                               <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900">{item.name}</div>
                                  {(item as any).isCustomService && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Custom</span>}
                               </td>
                               <td className="py-3 px-4 text-center">{item.quantity}</td>
                               <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.price, {})}</td>
                               <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.discount || 0, {})}</td>
                               <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">{formatCurrency((item.price * item.quantity) - (item.discount || 0), {})}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>

               <div className="flex justify-end mb-8">
                   <div className="w-64 space-y-3">
                       <div className="flex justify-between text-sm text-gray-600">
                           <span>Subtotal:</span>
                           <span className="font-mono">{formatCurrency(calculateSubtotal(), {})}</span>
                       </div>
                       <div className="flex justify-between text-sm text-gray-600 border-b pb-3">
                           <span>Discount:</span>
                           <span className="font-mono">{formatCurrency(formData.discountAmount || 0, {})}</span>
                       </div>
                       <div className="flex justify-between font-bold text-lg text-gray-900">
                           <span>Grand Total:</span>
                           <span className="font-mono text-indigo-600">{formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), {})}</span>
                       </div>
                   </div>
               </div>

               {formData.termsAndConditions && (
                   <div className="border-t border-gray-200 pt-6">
                       <h4 className="font-bold text-gray-800 text-sm mb-2">Terms & Conditions</h4>
                       <div className="text-sm text-gray-600 whitespace-pre-wrap">{formData.termsAndConditions}</div>
                   </div>
               )}
           </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Custom Item</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-400 hover:text-red-500 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name *</label>
                <input 
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={customItemForm.name}
                  onChange={e => setCustomItemForm({...customItemForm, name: e.target.value})}
                  placeholder="e.g. Installation Service"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description (optional)</label>
                <input 
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={customItemForm.description}
                  onChange={e => setCustomItemForm({...customItemForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unit Price</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={customItemForm.price}
                    onChange={e => setCustomItemForm({...customItemForm, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                    value={customItemForm.quantity}
                    onChange={e => setCustomItemForm({...customItemForm, quantity: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Discount (optional)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={customItemForm.discount}
                  onChange={e => setCustomItemForm({...customItemForm, discount: Number(e.target.value)})}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={addCustomItem}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md font-bold text-sm shadow hover:bg-indigo-700 transition"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
