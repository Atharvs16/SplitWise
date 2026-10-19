
import { Wallet, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="landing-footer">
            <div className="footer-main">
                <a href="/" className="landing-brand">
                    <span className="landing-brand-icon">
                        <img src="/favicon.svg" alt="" width="23" height="23" />
                    </span>

                    <span className="landing-brand-name">
                        Split<span>Ease</span>
                    </span>
                </a>

                <p className="footer-tagline">
                    Good times should never come with awkward math.
                </p>

                <nav className="footer-links" aria-label="Footer navigation">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How it works</a>
                    <a href="#faq">FAQ</a>
                    <a href="/privacy">Privacy</a>
                </nav>
            </div>

            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} SplitEase</span>

                <span className="footer-made-with">
                    Made for sharing <Heart size={14} />
                </span>
            </div>
        </footer>
    );
}
