import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { toWords } from 'number-to-words';
import './CommercialInvoice.css';

export const CommercialInvoice = () => {
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

  const [invoice, setInvoice] = useState({
    supplierName: 'Millennia Tech',
    supplierAddress: 'Office # 02, 3rd Floor, Al Haseeb Arcade UBL Ameen Building, Khana, Islamabad, Pakistan',
    supplierNTN: '8528727-3',
    supplierSTRN: '8528727-3',
    buyerName: '',
    buyerAddress: '',
    buyerNTN: '',
    buyerSTRN: '',
    items: [{ qty: 1, desc: '', unitPrice: 0 }],
    date: new Date().toISOString().split('T')[0],
    gstRate: 15,
    supplyType: ''
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  // Auto-resize textarea based on content
  const autoResizeTextarea = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    document.querySelectorAll('textarea').forEach(autoResizeTextarea);
  }, [invoice.buyerAddress, invoice.items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "buyerName" && buyersData[value]) {
      const buyer = buyersData[value];
      setInvoice(prev => ({
        ...prev,
        buyerName: value,
        buyerAddress: buyer.address,
        buyerNTN: buyer.NTN,
        buyerSTRN: buyer.STRN
      }));
    } else if (name === "supplyType") {
      const selectedGST = gstOptions[value] || 0;
      setInvoice(prev => ({
        ...prev,
        supplyType: value,
        gstRate: selectedGST
      }));
    } else {
      setInvoice(prev => ({
        ...prev,
        [name]: name === 'gstRate' ? Number(value) : value
      }));
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...invoice.items];
    newItems[index][name] = name === 'qty' || name === 'unitPrice' ? Number(value) : value;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { qty: 1, desc: '', unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      const newItems = [...invoice.items];
      newItems.splice(index, 1);
      setInvoice(prev => ({ ...prev, items: newItems }));
    }
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const gst = subtotal * (invoice.gstRate / 100);
  const total = subtotal + gst;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice.buyerName || !invoice.supplyType) {
      setError('Buyer name and supply type are required!');
      return;
    }

    const invoiceWithWords = { ...invoice, subtotal, gst, total };

    try {
      const response = await fetch('http://localhost:3000/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceWithWords)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();
      setError(null);
      generatePDF(data);
    } catch (err) {
      setError(`Failed to generate invoice: ${err.message}`);
    }
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('COMMERCIAL INVOICE', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${data._id || 'N/A'}`, margin, y);
    doc.text(`Date: ${data.date}`, pageWidth - margin - 40, y);
    y += 10;

    // Supplier and Buyer Details
    const boxWidth = (pageWidth - 3 * margin) / 2;
    doc.rect(margin, y, boxWidth, 50);
    doc.text('SUPPLIER DETAILS', margin + 2, y + 7);
    doc.text(`Name: ${data.supplierName}`, margin + 2, y + 15);
    doc.text('Address:', margin + 2, y + 23);
    doc.text(data.supplierAddress, margin + 2, y + 31, { maxWidth: boxWidth - 10 });
    doc.text(`NTN: ${data.supplierNTN}`, margin + 2, y + 43);
    doc.text(`STRN: ${data.supplierSTRN}`, margin + 2, y + 49);

    doc.rect(margin + boxWidth + margin, y, boxWidth, 50);
    doc.text('BUYER DETAILS', margin + boxWidth + margin + 2, y + 7);
    doc.text(`Name: ${data.buyerName}`, margin + boxWidth + margin + 2, y + 15);
    doc.text('Address:', margin + boxWidth + margin + 2, y + 23);
    doc.text(data.buyerAddress, margin + boxWidth + margin + 2, y + 31, { maxWidth: boxWidth - 10 });
    doc.text(`NTN: ${data.buyerNTN}`, margin + boxWidth + margin + 2, y + 43);
    doc.text(`STRN: ${data.buyerSTRN}`, margin + boxWidth + margin + 2, y + 49);
    y += 60;

    // Items Table Header
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, maxWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('S/N', margin + 2, y + 7);
    doc.text('QTY', margin + 20, y + 7);
    doc.text('DESCRIPTION', margin + 40, y + 7);
    doc.text('UNIT PRICE', pageWidth - margin - 60, y + 7);
    doc.text('TOTAL', pageWidth - margin - 30, y + 7);
    y += 12;

    // Items Table Content
    doc.setFont('helvetica', 'normal');
    data.items.forEach((item, index) => {
      const descLines = doc.splitTextToSize(item.desc || 'N/A', 80);
      const lineHeight = descLines.length * 5;
      const itemTotal = item.qty * item.unitPrice;

      doc.text(`${index + 1}`, margin + 2, y + 5);
      doc.text(`${item.qty}`, margin + 20, y + 5);
   doc.text(descLines, margin + 40, y + 5);          // X = 40
doc.text(`${item.unitPrice.toFixed(2)}`, margin + 130, y + 5);  // X = 140

      doc.text(`${itemTotal.toFixed(2)}`, pageWidth - margin - 30, y + 5);
      y += Math.max(12, lineHeight + 2);
    });

    // Totals
    y += 5;
    doc.line(pageWidth - margin - 65, y, pageWidth - margin, y);
    y += 7;
    doc.text('Subtotal:', pageWidth - margin - 65, y);
    doc.text(`${data.subtotal.toFixed(2)} PKR`, pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.text(`GST (${data.gstRate}%):`, pageWidth - margin - 65, y);
    doc.text(`${data.gst.toFixed(2)} PKR`, pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.text('Total:', pageWidth - margin - 65, y);
    doc.text(`${data.total.toFixed(2)} PKR`, pageWidth - margin, y, { align: 'right' });

    // Amount in Words
    y += 12;
    const rupees = Math.floor(data.total);
    const paisa = Math.round((data.total - rupees) * 100);
    let amountInWords = `${toWords(rupees)} rupees`;
    if (paisa > 0) amountInWords += ` and ${toWords(paisa)} paisa`;
    amountInWords += ' only';
    amountInWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());
    doc.text(`Amount in Words: ${doc.splitTextToSize(amountInWords, maxWidth - 10)}`, margin, y);
    y += 12;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('This is a system-generated invoice. No signature is required.', margin, y);

    const pdfBlob = doc.output('blob');
    setPdfUrl(URL.createObjectURL(pdfBlob));
  };

  return (
    <div className="ci-container">
      <h1 className="ci-title">Commercial Invoice</h1>
      {error && <div className="ci-error">{error}</div>}
      <form onSubmit={handleSubmit} className="ci-form">
        <div className="ci-section">
          <h2 className="ci-section-title">Supplier Information</h2>
          <div className="ci-form-grid">
            <input name="supplierName" value={invoice.supplierName} readOnly />
            <textarea
              name="supplierAddress"
              value={invoice.supplierAddress}
              readOnly
              onChange={(e) => autoResizeTextarea(e.target)}
            />
            <input name="supplierNTN" value={invoice.supplierNTN} readOnly />
            <input name="supplierSTRN" value={invoice.supplierSTRN} readOnly />
          </div>
        </div>

        <div className="ci-section">
          <h2 className="ci-section-title">Buyer Information</h2>
          <div className="ci-form-grid">
            <select name="buyerName" value={invoice.buyerName} onChange={handleChange} required>
              <option value="">Select Buyer</option>
              {Object.keys(buyersData).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <textarea
              name="buyerAddress"
              value={invoice.buyerAddress}
              readOnly
              onChange={(e) => autoResizeTextarea(e.target)}
            />
            <input name="buyerNTN" value={invoice.buyerNTN} readOnly />
            <input name="buyerSTRN" value={invoice.buyerSTRN} readOnly />
          </div>
        </div>

        <div className="ci-section">
          <h2 className="ci-section-title">Invoice Details</h2>
          <div className="ci-form-grid">
            <input name="date" type="date" value={invoice.date} onChange={handleChange} required />
            <select name="supplyType" value={invoice.supplyType} onChange={handleChange} required>
              <option value="">Select Supply Type</option>
              {Object.keys(gstOptions).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ci-section">
          <h2 className="ci-section-title">Items</h2>
          <table className="ci-items-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Quantity</th>
                <th>Description</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const itemTotal = item.qty * item.unitPrice;
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        name="qty"
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                        min="1"
                      />
                    </td>
                    <td>
                      <textarea
                        name="desc"
                        value={item.desc}
                        onChange={(e) => {
                          handleItemChange(index, e);
                          autoResizeTextarea(e.target);
                        }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        name="unitPrice"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>{itemTotal.toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="ci-btn ci-btn-delete"
                        onClick={() => removeItem(index)}
                        disabled={invoice.items.length === 1}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="ci-btn ci-btn-secondary">
            Add Item
          </button>
        </div>

        <button type="submit" className="ci-btn ci-btn-primary">Generate Invoice</button>
      </form>

      <div className="ci-totals">
        <p><span>Subtotal:</span> {subtotal.toFixed(2)} PKR</p>
        <p><span>GST ({invoice.gstRate}%):</span> {gst.toFixed(2)} PKR</p>
        <p><span>Total:</span> {total.toFixed(2)} PKR</p>
      </div>

      {pdfUrl && (
        <div className="ci-pdf-buttons">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ci-btn ci-btn-secondary">
            View PDF
          </a>
          <a href={pdfUrl} download="invoice.pdf" className="ci-btn ci-btn-download">
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};