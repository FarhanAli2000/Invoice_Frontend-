import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import './SalesInvoice.css';

const SUPPLIER_INFO = {
  supplierName: 'Millennia Tech',
  supplierAddress:
    'Office # 02, 3rd Floor, Al Haseeb Arcade UBL Ameen Building, Khana, Islamabad, Pakistan',
  supplierNTN: '8528727-3',
  supplierSTRN: '8528727-3',
};

const buyersData = {
  'NTC Head Quarter Islamabad': {
    address:
      'Plot No. 181-186, Street No. 2, Industrial Area, Sector I-9/2, Islamabad, Pakistan',
    NTN: '1218153',
    STRN: '07-01-9802-013-64',
  },
  'NTC Head Quarter Quetta': {
    address: 'Zarghoon Road, Near Civil Secretariat, Quetta, Balochistan, Pakistan',
    NTN: '128154',
    STRN: '03-01-9802-013-64',
  },
};

const gstOptions = {
  Supply: 18,
  'Services Islamabad': 15,
  'Services KPK': 15,
  'Services PRA': 16,
  'Services SRA': 13,
};

const SalesWithSite = () => {
  const [invoice, setInvoice] = useState({
    buyerName: '',
    buyerAddress: '',
    buyerNTN: '',
    buyerSTRN: '',
    date: new Date().toISOString().slice(0, 10),
    items: [{ site: '', desc: '', qty: 1, unitPrice: 0 }],
    gstRate: 18,
    gstType: 'Supply',
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
      buyerSTRN: buyer?.STRN || '',
    }));
  };

  const handleGSTTypeChange = (e) => {
    const selected = e.target.value;
    setInvoice((prev) => ({
      ...prev,
      gstType: selected,
      gstRate: gstOptions[selected] || 0,
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
      items: [...prev.items, { site: '', desc: '', qty: 1, unitPrice: 0 }],
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
      amountInWords,
    };

    try {
      const res = await fetch('https://invoice-backend-production-24bd.up.railway.app/api/sales-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    doc.setFontSize(14).text('SALES TAX INVOICE', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Supplier: ${SUPPLIER_INFO.supplierName}`, 20, 30);
    doc.text(`Address:`, 20, 36);
    doc.text(SUPPLIER_INFO.supplierAddress, 40, 36, { maxWidth: 150 });
    doc.text(`NTN: ${SUPPLIER_INFO.supplierNTN}`, 20, 44);
    doc.text(`STRN: ${SUPPLIER_INFO.supplierSTRN}`, 20, 50);

    doc.text(`Buyer: ${invoice.buyerName}`, 20, 65);
    doc.text(`Address:`, 20, 71);
    doc.text(invoice.buyerAddress, 40, 71, { maxWidth: 150 });
    doc.text(`NTN: ${invoice.buyerNTN}`, 20, 80);
    doc.text(`STRN: ${invoice.buyerSTRN}`, 20, 86);

    let y = 100;
    doc.setFontSize(11).text('S.No  Site     Description                Qty   Unit Price   Exclusive   GST   Total', 20, y);
    y += 8;

    invoice.items.forEach((item, i) => {
      const exclusive = item.qty * item.unitPrice;
      const gstVal = (exclusive * invoice.gstRate) / 100;
      const incl = exclusive + gstVal;

      doc.text(
        `${i + 1}     ${item.site.slice(0, 10)}     ${item.desc.slice(0, 25)}     ${item.qty}     ${item.unitPrice.toFixed(2)}     ${exclusive.toFixed(2)}     ${gstVal.toFixed(2)}     ${incl.toFixed(2)}`,
        20,
        y
      );
      y += 8;
    });

    y += 5;
    doc.text(`Subtotal: ${subtotal.toFixed(2)} PKR`, 140, y);
    y += 6;
    doc.text(`GST (${invoice.gstRate}%): ${gst.toFixed(2)} PKR`, 140, y);
    y += 6;
    doc.text(`Total: ${total.toFixed(2)} PKR`, 140, y);
    y += 10;
    doc.text(`Amount in Words: ${amountInWords}`, 20, y);
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
      <h1>Sales Invoice with Site</h1>

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
          <strong style={{ width: '15%' }}>Site</strong>
          <strong style={{ width: '25%' }}>Description</strong>
          <strong style={{ width: '10%' }}>Qty</strong>
          <strong style={{ width: '10%' }}>Unit Price</strong>
          <strong style={{ width: '10%' }}>Exclusive</strong>
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
              <input
                name="site"
                type="text"
                placeholder="Site"
                value={item.site}
                onChange={(e) => handleItemChange(idx, e)}
                style={{ width: '15%' }}
              />
              <textarea
                name="desc"
                rows={2}
                placeholder="Description"
                value={item.desc}
                onChange={(e) => handleItemChange(idx, e)}
                style={{ width: '25%' }}
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
                style={{ width: '10%' }}
              />
              <span style={{ width: '10%' }}>{exclusive.toFixed(2)}</span>
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
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SalesWithSite;
