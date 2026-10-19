
import { useState } from "react";
import {
  Wallet,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import "./LandingNavbar.css";
import Logo from "/favicon.svg"

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="landing-navbar">
      <div className="landing-nav-container">
        {/* Brand */}
        <a href="/" className="landing-brand" onClick={closeMenu}>
          <span className="landing-brand-icon">
            <img src="/favicon.svg" alt="" width="40" height="40" />
          </span>

          <span className="landing-brand-name">
            Split<span>Ease</span>
          </span>
        </a>

        {/* Navigation Links */}
        <nav
          className={`landing-nav-links ${mobileMenuOpen ? "landing-nav-open" : ""
            }`}
        >
          <a href="#features" onClick={closeMenu}>
            Features
          </a>

          <a href="#how-it-works" onClick={closeMenu}>
            How it works
          </a>

          <a href="#about" onClick={closeMenu}>
            About us
          </a>

          {/* Mobile CTA */}
          <div className="landing-mobile-actions">
            <a
              href="/login"
              className="landing-login-btn"
              onClick={closeMenu}
            >
              Log in
            </a>

            <a
              href="/signup"
              className="landing-cta-btn"
              onClick={closeMenu}
            >
              Get started
              <ArrowUpRight size={17} />
            </a>
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="landing-nav-actions">
          <a href="/login" className="landing-login-btn">
            Log in
          </a>

          <a href="/signup" className="landing-cta-btn">
            Get started
            <ArrowUpRight size={17} />
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="landing-menu-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
