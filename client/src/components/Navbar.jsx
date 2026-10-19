
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  ArrowLeftRight,
  Plus,
  Bell,
  UserRound,
  ChevronDown,
  Menu,
  X,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";

import "./Navbar.css";

const navLinks = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Settle Up", href: "/settle-up", icon: ArrowLeftRight },
];

export default function Navbar() {
  const [activeLink, setActiveLink] = useState("/");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <a
          href="/"
          className="navbar-logo"
          onClick={() => setActiveLink("/")}
        >
          <span className="logo-icon">
            <Wallet size={23} strokeWidth={2.3} />
          </span>
          <span className="logo-text">
            Split<span>Ease</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className={`nav-links ${mobileOpen ? "nav-open" : ""}`}>
          {navLinks.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              className={`nav-link ${
                activeLink === href ? "active" : ""
              }`}
              onClick={() => {
                setActiveLink(href);
                setMobileOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </a>
          ))}

          {/* Mobile Add Expense */}
          <button
            className="mobile-add-btn"
            onClick={() => {
              setMobileOpen(false);
              window.dispatchEvent(new Event("open-add-expense"));
            }}
          >
            <Plus size={18} />
            Add Expense
          </button>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button
            className="add-expense-btn"
            onClick={() =>
              window.dispatchEvent(new Event("open-add-expense"))
            }
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Expense</span>
          </button>

          {/* Notifications */}
          <div className="navbar-dropdown">
            <button
              className={`icon-btn ${
                notificationsOpen ? "icon-btn-active" : ""
              }`}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            {notificationsOpen && (
              <div className="dropdown-menu notification-menu">
                <h3>Notifications</h3>
                <div className="notification-item">
                  <span className="notification-icon">
                    <ReceiptText size={18} />
                  </span>
                  <div>
                    <p>Stay up to date</p>
                    <span>
                      New expense and settlement updates will appear here.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="navbar-dropdown">
            <button
              className="profile-btn"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
            >
              <span className="avatar">
                <UserRound size={19} />
              </span>
              <span className="profile-name">My Account</span>
              <ChevronDown
                size={16}
                className={profileOpen ? "chevron-rotated" : ""}
              />
            </button>

            {profileOpen && (
              <div className="dropdown-menu profile-menu">
                <div className="profile-menu-header">
                  <span className="avatar">
                    <UserRound size={20} />
                  </span>
                  <div>
                    <strong>My Account</strong>
                    <span>Manage your profile</span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <a href="/profile" className="dropdown-item">
                  <UserRound size={17} />
                  My Profile
                </a>

                <a href="/settings" className="dropdown-item">
                  <Settings size={17} />
                  Settings
                </a>

                <button
                  className="dropdown-item logout-item"
                  onClick={() => {
                    setProfileOpen(false);
                    window.dispatchEvent(new Event("logout"));
                  }}
                >
                  <LogOut size={17} />
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="mobile-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
    </header>
  );
}
