
import { Link, useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <main className="not-found-page">
      <div className="not-found-container">
        {/* Brand */}
        <Link to="/" className="not-found-brand">
          <span className="brand-icon">↗</span>
          <span>SplitEase</span>
        </Link>

        {/* Illustration */}
        <div className="not-found-illustration">
          <div className="illustration-circle" />

          <div className="receipt-card">
            <div className="receipt-question">?</div>
            <div className="receipt-line line-long" />
            <div className="receipt-line line-short" />
            <div className="receipt-line line-medium" />
            <div className="receipt-divider" />
            <div className="receipt-amount">₹ — —</div>
          </div>

          <div className="floating-icon floating-arrow">↗</div>
          <div className="floating-icon floating-rupee">₹</div>
          <div className="floating-dot dot-one" />
          <div className="floating-dot dot-two" />
        </div>

        {/* Error content */}
        <div className="not-found-content">
          <span className="error-badge">
            <span className="error-badge-dot" />
            ERROR 404
          </span>

          <h1>
            Oops! This split
            <br />
            <span>went missing.</span>
          </h1>

          <p className="not-found-description">
            Looks like this page isn't part of the plan.
            It may have been moved, or the link might
            be incorrect. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="not-found-actions">
            <Link to="/" className="home-button">
              <span>⌂</span>
              Back to Dashboard
              <span className="button-arrow">→</span>
            </Link>

            <button
              type="button"
              className="back-button"
              onClick={handleGoBack}
            >
              ← Go back
            </button>
          </div>

          <div className="not-found-footer">
            <span className="footer-check">✓</span>
            Your money is safe. This page just isn't here.
          </div>
        </div>
      </div>
    </main>
  );
}
