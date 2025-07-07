import React from 'react';
import './app.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CommercialInvoice } from './Components/CommercialInvoice';
import SalesInvoice from './Components/SalesInvoice';
import SalesWithSite from './Components/SalesWithSite';
import { Home } from './Components/home';
import { CommercialInvoiceWithSite } from './Components/CommercialInvoiceWithSite';
import Quotation from './Components/Quotation'; // ✅ NEW import

const App = () => {
  return (
    <Router>
      <div className="app-wrapper">
        <aside className="app-sidebar" aria-label="Navigation menu">
          <div className="app-sidebar-header">
            <div className="app-sidebar-logo" aria-hidden="true">📄</div>
            <h2 className="app-sidebar-title">Invoice App</h2>
          </div>
          <nav className="app-sidebar-nav">
            <ul role="list">
              <li><Link to="/" className="app-sidebar-link">Home</Link></li>
              <li><Link to="/commercial" className="app-sidebar-link">Commercial Invoice</Link></li>
              <li><Link to="/sales" className="app-sidebar-link">Sales Invoice</Link></li>
              <li><Link to="/sales-site" className="app-sidebar-link">Sales Invoice (With Site)</Link></li>
              <li><Link to="/commercial-site" className="app-sidebar-link">Commercial Invoice (With Site)</Link></li>
              <li><Link to="/quotation" className="app-sidebar-link">Quotation</Link></li> {/* ✅ NEW link */}
            </ul>
          </nav>
        </aside>

        <main className="app-main-content" aria-label="Main content">
          <header className="app-main-header">
            <h1 className="app-main-title">Invoice Management</h1>
          </header>

          <section className="app-main-section">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/commercial" element={<CommercialInvoice />} />
              <Route path="/sales" element={<SalesInvoice />} />
              <Route path="/sales-site" element={<SalesWithSite />} />
              <Route path="/commercial-site" element={<CommercialInvoiceWithSite />} />
              <Route path="/quotation" element={<Quotation />} /> {/* ✅ NEW route */}
            </Routes>
          </section>
        </main>
      </div>
    </Router>
  );
};

export default App;
