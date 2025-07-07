import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import './Quotation.css';

const Quotation = () => {
  const [quotation, setQuotation] = useState({
    quotationNo: '',
    date: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerAddress: '',
    items: [{ desc: '', qty: 1, unitPrice: 0 }],
    terms: ''
  });

  const [pdfUrl, setPdfUrl] = useState(null);

  // ✅ Fetch terms from backend
  useEffect(() => {
    axios.get('http://localhost:3000/api/terms')
      .then(res => {
        setQuotation(prev => ({ ...prev, terms: res.data.terms }));
      })
      .catch(err => {
        console.error('Failed to fetch terms:', err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuotation(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...quotation.items];
    newItems[index][name] = name === 'qty' || name === 'unitPrice' ? Number(value) : value;
    setQuotation(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setQuotation(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = [...quotation.items];
    newItems.splice(index, 1);
    setQuotation(prev => ({ ...prev, items: newItems }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('QUOTATION', 105, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.text(`Quotation No: ${quotation.quotationNo}`, 14, y);
    doc.text(`Date: ${quotation.date}`, 160, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Buyer:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.buyerName, 30, y);
    y += 6;
    doc.text(quotation.buyerAddress, 30, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(200, 200, 200);
    doc.rect(14, y, 182, 10, 'F');
    doc.text('S/N', 16, y + 7);
    doc.text('Description', 30, y + 7);
    doc.text('Qty', 120, y + 7);
    doc.text('Unit Price', 140, y + 7);
    doc.text('Total', 170, y + 7);
    y += 12;

    doc.setFont('helvetica', 'normal');
    quotation.items.forEach((item, i) => {
      const total = item.qty * item.unitPrice;
      doc.text(`${i + 1}`, 16, y);
      doc.text(item.desc, 30, y);
      doc.text(`${item.qty}`, 120, y);
      doc.text(`${item.unitPrice.toFixed(2)}`, 140, y);
      doc.text(`${total.toFixed(2)}`, 170, y);
      y += 8;
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(quotation.terms, 180);
    doc.text(termsLines, 14, y);

    const blob = doc.output('blob');
    setPdfUrl(URL.createObjectURL(blob));
  };

  return (
    <div className="quotation-container">
      <h1 className="quotation-title">Quotation Generator</h1>
      <div className="quotation-form">
        <input name="quotationNo" placeholder="Quotation No" value={quotation.quotationNo} onChange={handleChange} />
        <input name="date" type="date" value={quotation.date} onChange={handleChange} />
        <input name="buyerName" placeholder="Buyer Name" value={quotation.buyerName} onChange={handleChange} />
        <textarea name="buyerAddress" placeholder="Buyer Address" value={quotation.buyerAddress} onChange={handleChange} />

        <table className="quotation-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price without GST</th>
              <th>Total Price without GST</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td><input name="desc" value={item.desc} onChange={(e) => handleItemChange(index, e)} /></td>
                <td><input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} /></td>
                <td><input type="number" name="unitPrice" value={item.unitPrice} onChange={(e) => handleItemChange(index, e)} /></td>
                <td>{(item.qty * item.unitPrice).toFixed(2)}</td>
                <td><button onClick={() => removeItem(index)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addItem} className="add-item-btn">Add Item</button>

        <textarea
          name="terms"
          placeholder="Terms & Conditions"
          value={quotation.terms}
          readOnly // ✅ Disable editing if terms come from backend
        />

        <button onClick={generatePDF} className="generate-btn">Generate PDF</button>
        {pdfUrl && (
          <div className="pdf-buttons">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="view-btn">View PDF</a>
            <a href={pdfUrl} download="quotation.pdf" className="download-btn">Download PDF</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotation;
