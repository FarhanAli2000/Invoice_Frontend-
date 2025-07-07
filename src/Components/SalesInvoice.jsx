import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import './SalesInvoice.css';

const SUPPLIER_INFO = {
  supplierName: 'Millennia Tech',
  supplierAddress: 'Office # 02, 3rd Floor, Al Haseeb Arcade UBL Ameen Building, Khana, Islamabad, Pakistan',
  supplierNTN: '8528727-3',
  supplierSTRN: '8528727-3'
};

const buyersData = {
  "NTC Head Quarter Islamabad": {
    address: "Plot No. 181-186, Street No. 2, Industrial Area, Sector I-9/2, Islamabad, Pakistan",
    NTN: "1218153",
    STRN: "07-01-9802-013-64"
  },
  "NTC Head Quarter Quetta": {
    address: "Zarghoon Road, Near Civil Secretariat, Quetta, Balochistan, Pakistan",
    NTN: "128154",
    STRN: "03-01-9802-013-64"
  }
};

const gstOptions = {
  Supply: 18,
  "Services Islamabad": 15,
  "Services KPK": 15,
  "Services PRA": 16,
  "Services SRA": 13
};

const SalesInvoice = () => {
  const [invoice, setInvoice] = useState({
    buyerName: '',
    buyerAddress: '',
    buyerNTN: '',
    buyerSTRN: '',
    date: new Date().toISOString().slice(0, 10),
    items: [{ desc: '', qty: 1, unitPrice: 0 }],
    gstRate: 18,
    gstType: 'Supply'
  });

  const [invoiceNo, setInvoiceNo] = useState('');
  const [error, setError] = useState('');

  const handleBuyerChange = (e) => {
    const selected = e.target.value;
    const buyer = buyersData[selected];
    setInvoice((prev) => ({
      ...prev,
      buyerName: selected,
      buyerAddress: buyer?.address || '',
      buyerNTN: buyer?.NTN || '',
      buyerSTRN: buyer?.STRN || ''
    }));
  };

  const handleGSTTypeChange = (e) => {
    const selected = e.target.value;
    setInvoice((prev) => ({
      ...prev,
      gstType: selected,
      gstRate: gstOptions[selected] || 0
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...invoice.items];
    items[index][name] = name === 'qty' || name === 'unitPrice' ? Number(value) : value;
    setInvoice({ ...invoice, items });
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, unitPrice: 0 }]
    }));
  };

  const deleteItem = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const gst = (subtotal * invoice.gstRate) / 100;
  const total = subtotal + gst;
  const amountInWords = toWords(Math.floor(total)).toUpperCase() + ' RUPEES ONLY';

  const handleSubmit = async () => {
    const payload = {
      ...invoice,
      ...SUPPLIER_INFO,
      subtotal,
      gst,
      total,
      amountInWords
    };

    try {
      const res = await fetch('http://localhost:3000/api/sales-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setInvoiceNo(data.invoiceNo || 'DRAFT');
      alert(`✅ Invoice Submitted! No: ${data.invoiceNo}`);
    } catch (err) {
      console.error(err);
      setError('❌ Server error');
    }
  };

 const generatePDFContent = (doc) => {
  const margin = 20;
  let y = 15;
  const pageWidth = doc.internal.pageSize.width;
  const tableStartY = 100;

  // Title
  doc.setFontSize(16).setFont('helvetica', 'bold');
  doc.text('SALES TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Supplier Details
  doc.setFontSize(10).setFont('helvetica', 'normal');
  doc.text(`Supplier: ${SUPPLIER_INFO.supplierName}`, margin, y); y += 6;
  doc.text(`Address:`, margin, y);
  doc.text(SUPPLIER_INFO.supplierAddress, margin + 20, y, { maxWidth: 150 }); y += 12;
  doc.text(`NTN: ${SUPPLIER_INFO.supplierNTN}`, margin, y); y += 6;
  doc.text(`STRN: ${SUPPLIER_INFO.supplierSTRN}`, margin, y); y += 10;

  // Buyer Details
  doc.setFont('helvetica', 'bold');
  doc.text(`Buyer: ${invoice.buyerName}`, margin, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Address:`, margin, y);
  doc.text(invoice.buyerAddress, margin + 20, y, { maxWidth: 150 }); y += 12;
  doc.text(`NTN: ${invoice.buyerNTN}`, margin, y); y += 6;
  doc.text(`STRN: ${invoice.buyerSTRN}`, margin, y); y += 12;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, tableStartY, pageWidth - margin * 2, 10, 'F');

  doc.text('S.No', margin + 2, tableStartY + 7);
  doc.text('Description', margin + 20, tableStartY + 7);
  doc.text('Qty', pageWidth - 105, tableStartY + 7);
  doc.text('Unit Price', pageWidth - 85, tableStartY + 7);
  doc.text('Exclusive', pageWidth - 65, tableStartY + 7);
  doc.text('GST', pageWidth - 45, tableStartY + 7);
  doc.text('Total', pageWidth - 25, tableStartY + 7);

  // Table Rows
  y = tableStartY + 12;
  doc.setFont('helvetica', 'normal');

  invoice.items.forEach((item, i) => {
    const exclusive = item.qty * item.unitPrice;
    const gstVal = (exclusive * invoice.gstRate) / 100;
    const incl = exclusive + gstVal;

    const descLines = doc.splitTextToSize(item.desc || 'N/A', 60);
    const lineHeight = descLines.length * 5;

    doc.text(`${i + 1}`, margin + 2, y + 5);
    doc.text(descLines, margin + 20, y + 5);
    doc.text(`${item.qty}`, pageWidth - 105, y + 5);
    doc.text(`${item.unitPrice.toFixed(2)}`, pageWidth - 85, y + 5);
    doc.text(`${exclusive.toFixed(2)}`, pageWidth - 65, y + 5);
    doc.text(`${gstVal.toFixed(2)}`, pageWidth - 45, y + 5);
    doc.text(`${incl.toFixed(2)}`, pageWidth - 25, y + 5);

    y += Math.max(10, lineHeight + 2);
  });

  // Totals
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Subtotal:`, pageWidth - 65, y);
  doc.text(`${subtotal.toFixed(2)} PKR`, pageWidth - 20, y, { align: 'right' });
  y += 6;
  doc.text(`GST (${invoice.gstRate}%):`, pageWidth - 65, y);
  doc.text(`${gst.toFixed(2)} PKR`, pageWidth - 20, y, { align: 'right' });
  y += 6;
  doc.text(`Total:`, pageWidth - 65, y);
  doc.text(`${total.toFixed(2)} PKR`, pageWidth - 20, y, { align: 'right' });

  // Amount in Words
  y += 10;
  const rupees = Math.floor(total);
  const paisa = Math.round((total - rupees) * 100);
  let amountInWords = `${toWords(rupees)} rupees`;
  if (paisa > 0) amountInWords += ` and ${toWords(paisa)} paisa`;
  amountInWords += ' only';
  amountInWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());

  doc.setFontSize(10).setFont('helvetica', 'normal');
  const wrappedText = doc.splitTextToSize(`Amount in Words: ${amountInWords}`, pageWidth - margin * 2);
  doc.text(wrappedText, margin, y);

  y += wrappedText.length * 6;
  doc.setFontSize(8).setTextColor(120);
  doc.text('This is a system-generated invoice. No signature is required.', margin, y + 6);
};


  const generatePDF = () => {
    const doc = new jsPDF();
    generatePDFContent(doc);
    doc.save(`Invoice_${invoiceNo || 'DRAFT'}.pdf`);
  };

  const viewPDF = () => {
    const doc = new jsPDF();
    generatePDFContent(doc);
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="invoice-container">
      <h1>Sales Invoice</h1>

      <div className="section">
        <h2>Supplier Information (Fixed)</h2>
        <p><strong>Supplier Name:</strong> {SUPPLIER_INFO.supplierName}</p>
        <p><strong>Supplier Address:</strong> {SUPPLIER_INFO.supplierAddress}</p>
        <p><strong>Supplier NTN:</strong> {SUPPLIER_INFO.supplierNTN}</p>
        <p><strong>Supplier STRN:</strong> {SUPPLIER_INFO.supplierSTRN}</p>
      </div>

      <div className="section">
        <h2>Buyer Information</h2>
        <label><strong>Select Buyer:</strong></label>
        <select value={invoice.buyerName} onChange={handleBuyerChange}>
          <option value="">-- Select Buyer --</option>
          {Object.keys(buyersData).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <p><strong>Buyer Address:</strong> {invoice.buyerAddress}</p>
        <p><strong>Buyer NTN:</strong> {invoice.buyerNTN}</p>
        <p><strong>Buyer STRN:</strong> {invoice.buyerSTRN}</p>
      </div>

      <div className="section">
        <h2>GST Type</h2>
        <label><strong>Choose GST Type:</strong></label>
        <select value={invoice.gstType} onChange={handleGSTTypeChange}>
          {Object.keys(gstOptions).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
        <p><strong>Applied GST Rate:</strong> {invoice.gstRate}%</p>
      </div>

      <div className="section">
        <h2>Invoice Items</h2>
        <div className="item-header-row">
          <strong style={{ width: '5%' }}>S.No</strong>
          <strong style={{ width: '30%' }}>Description</strong>
          <strong style={{ width: '10%' }}>Qty</strong>
          <strong style={{ width: '15%' }}>Unit Price</strong>
          <strong style={{ width: '15%' }}>Exclusive</strong>
          <strong style={{ width: '10%' }}>GST</strong>
          <strong style={{ width: '10%' }}>Total</strong>
          <strong style={{ width: '5%' }}></strong>
        </div>
        {invoice.items.map((item, idx) => {
          const exclusive = item.qty * item.unitPrice;
          const gstVal = (exclusive * invoice.gstRate) / 100;
          const totalVal = exclusive + gstVal;
          return (
            <div key={idx} className="item-row">
              <span style={{ width: '5%' }}>{idx + 1}</span>
              <textarea
                name="desc"
                rows={2}
                placeholder="Description"
                value={item.desc}
                onChange={(e) => handleItemChange(idx, e)}
                style={{ width: '30%' }}
              />
              <input
                name="qty"
                type="number"
                value={item.qty}
                onChange={(e) => handleItemChange(idx, e)}
                style={{ width: '10%' }}
              />
              <input
                name="unitPrice"
                type="number"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(idx, e)}
                style={{ width: '15%' }}
              />
              <span style={{ width: '15%' }}>{exclusive.toFixed(2)}</span>
              <span style={{ width: '10%' }}>{gstVal.toFixed(2)}</span>
              <span style={{ width: '10%' }}>{totalVal.toFixed(2)}</span>
              <button onClick={() => deleteItem(idx)} style={{ width: '5%' }}>Delete</button>
            </div>
          );
        })}
        <button onClick={addItem}>Add Item</button>
      </div>

      <div className="section">
        <h2>Totals</h2>
        <p><strong>Subtotal:</strong> {subtotal.toFixed(2)} PKR</p>
        <p><strong>GST ({invoice.gstRate}%):</strong> {gst.toFixed(2)} PKR</p>
        <p><strong>Total:</strong> {total.toFixed(2)} PKR</p>
        <p><strong>Amount in Words:</strong> {amountInWords}</p>
      </div>

      <button onClick={handleSubmit}>Submit Invoice</button>
      <button onClick={generatePDF}>Download PDF</button>
      <button onClick={viewPDF}>View PDF</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SalesInvoice;
