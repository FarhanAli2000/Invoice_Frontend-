import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home = () => {
  return (
    <div className="home-container" aria-label="Welcome section">
      {/* Hero Section */}
      <section className="home-hero">
        <h1 className="home-title">Welcome to Invoice Generator</h1>
        <p className="home-tagline">Streamline your invoicing with professional, customizable solutions.</p>
        <div className="home-button-group">
          <Link to="/commercial" className="home-btn home-btn-commercial">Create Commercial Invoice</Link>
          <Link to="/sales" className="home-btn home-btn-sales">Create Sales Invoice</Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <h2 className="home-section-title">Why Choose Our Platform?</h2>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <h3 className="home-feature-title">Easy to Use</h3>
            <p className="home-feature-description">
              Intuitive interface to create invoices in minutes, no training required.
            </p>
          </div>
          <div className="home-feature-card">
            <h3 className="home-feature-title">Professional PDFs</h3>
            <p className="home-feature-description">
              Generate polished, downloadable PDF invoices with GST calculations.
            </p>
          </div>
          <div className="home-feature-card">
            <h3 className="home-feature-title">Secure & Reliable</h3>
            <p className="home-feature-description">
              Your data is safe with our secure API and robust backend integration.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home-cta">
        <h2 className="home-cta-title">Ready to Simplify Your Invoicing?</h2>
        <p className="home-cta-description">Join thousands of businesses using our platform to manage invoices effortlessly.</p>
        <Link to="/commercial" className="home-btn home-btn-cta">Get Started Now</Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p className="home-footer-text">Invoice Generator &copy; 2025. All rights reserved.</p>
        <p className="home-footer-contact">Contact us: <a href="mailto:support@invoicegenerator.com" className="home-footer-link">support@invoicegenerator.com</a></p>
        <div className="home-footer-links">
          <a href="/privacy" className="home-footer-link">Privacy Policy</a>
          <a href="/terms" className="home-footer-link">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
