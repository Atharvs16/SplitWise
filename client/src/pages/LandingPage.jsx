
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ReceiptText,
  Users,
  Scale,
  Wallet,
  CircleHelp,
  ShieldCheck,
  Zap,
} from "lucide-react";

import LandingNavbar from "../components/LandingNavbar";
import FeatureCard from "../components/FeatureCard";
import StepCard from "../components/StepCard";
import Footer from "../components/Footer";

import "./LandingPage.css";

const features = [
  {
    number: "01",
    icon: ReceiptText,
    title: "Every expense, in one place",
    description:
      "Record rent, groceries, dinners, trips, and everyday expenses without losing track of who paid.",
  },
  {
    number: "02",
    icon: Scale,
    title: "Splits that make sense",
    description:
      "Split bills equally or use custom amounts. Everyone can see their share and understand the math.",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Know who owes whom",
    description:
      "See outstanding balances at a glance and keep track of payments until everyone is settled up.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your group",
    description:
      "Start a group for your flatmates, your next trip, or the friends you hang out with.",
  },
  {
    number: "02",
    title: "Add shared expenses",
    description:
      "Enter the amount, choose who paid, and decide how the expense should be split.",
  },
  {
    number: "03",
    title: "Settle up, stress-free",
    description:
      "See the remaining balances and record payments when it's time to settle up.",
  },
];

const faqs = [
  {
    question: "What is SplitEase?",
    answer:
      "SplitEase is an expense-sharing app that helps friends, families, and roommates record shared expenses, calculate each person's share, and track outstanding balances.",
  },
  {
    question: "Can I split an expense unequally?",
    answer:
      "Yes. Your app can support equal splits as well as custom amounts or percentages, depending on the splitting options you implement.",
  },
  {
    question: "Does SplitEase transfer money?",
    answer:
      "The expense tracker can record payments and show who owes whom. Actual money transfers require a separate payment integration; recording a settlement alone does not transfer money.",
  },
  {
    question: "Who can I use SplitEase with?",
    answer:
      "You can design groups for roommates, friends, family, trips, and any other situation where people share costs.",
  },
];

function ExpensePreview() {
  return (
    <div className="preview-wrap">
      <div className="preview-orb preview-orb-one" />
      <div className="preview-orb preview-orb-two" />

      <div className="dashboard-preview">
        <div className="preview-header">
          <div>
            <span className="preview-eyebrow">YOUR OVERVIEW</span>
            <h3>Group balances</h3>
          </div>

          <span className="preview-period">This month</span>
        </div>

        <div className="preview-balance-card">
          <span className="balance-label">
            <span className="balance-status-dot" />
            You are owed
          </span>

          <div className="balance-amount">₹2,450.00</div>

          <div className="balance-caption">
            Across your shared expenses
          </div>

          <div className="balance-progress">
            <span />
          </div>

          <div className="balance-progress-label">
            <span>You're all caught up</span>
            <Check size={15} />
          </div>
        </div>

        <div className="preview-section-heading">
          <h4>Recent activity</h4>
          <span>View all</span>
        </div>

        <div className="preview-expenses">
          <div className="preview-expense-row">
            <div className="expense-emoji expense-emoji-orange">
              <ReceiptText size={19} />
            </div>

            <div className="expense-details">
              <strong>Weekend dinner</strong>
              <span>Trip Buddies · You paid</span>
            </div>

            <div className="expense-values">
              <strong>₹1,200</strong>
              <span className="owed-text">You lent ₹600</span>
            </div>
          </div>

          <div className="preview-expense-row">
            <div className="expense-emoji expense-emoji-purple">
              <Users size={19} />
            </div>

            <div className="expense-details">
              <strong>Monthly groceries</strong>
              <span>Flatmates · Aisha paid</span>
            </div>

            <div className="expense-values">
              <strong>₹850</strong>
              <span className="owe-text">You owe ₹425</span>
            </div>
          </div>

          <div className="preview-expense-row">
            <div className="expense-emoji expense-emoji-blue">
              <Wallet size={19} />
            </div>

            <div className="expense-details">
              <strong>Cab ride</strong>
              <span>Weekend trip · You paid</span>
            </div>

            <div className="expense-values">
              <strong>₹400</strong>
              <span className="owed-text">You lent ₹200</span>
            </div>
          </div>
        </div>

        <div className="preview-footer">
          <span className="preview-footer-icon">
            <ShieldCheck size={17} />
          </span>

          <span>Your shared expenses, organized.</span>
        </div>
      </div>

      <div className="floating-note floating-note-top">
        <span className="floating-note-icon">
          <Check size={17} />
        </span>
        <span>
          <strong>Split calculated</strong>
          <small>Everyone's share is clear</small>
        </span>
      </div>

      <div className="floating-note floating-note-bottom">
        <span className="floating-note-icon note-icon-wallet">
          <Wallet size={17} />
        </span>
        <span>
          <strong>No awkward math</strong>
          <small>Just friends and good times</small>
        </span>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <details className="faq-item">
      <summary>
        <span>{question}</span>
        <CircleHelp size={19} />
      </summary>

      <p>{answer}</p>
    </details>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNavbar />

      <main>
        {/* HERO */}
        <section className="hero-section" id="about">
          <div className="hero-container">
            <div className="hero-copy">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                SHARED EXPENSES, SIMPLIFIED
              </div>

              <h1>
                Split bills.
                <br />
                <span>Not friendships.</span>
              </h1>

              <p className="hero-description">
                Dinner with friends, rent with roommates, or a
                trip with your favorite people. Keep every shared
                expense organized and every balance clear.
              </p>

              <div className="hero-actions">
                <a href="/Auth" className="hero-primary-btn">
                  Get started for free
                  <ArrowRight size={18} />
                </a>

                <a href="#how-it-works" className="hero-secondary-btn">
                  See how it works
                  <ArrowUpRight size={17} />
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-icon">
                  <ShieldCheck size={18} />
                </div>

                <span>
                  Less confusion. More good times together.
                </span>
              </div>
            </div>

            <ExpensePreview />
          </div>

          <div className="hero-bottom-decoration" />
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-kicker">MADE FOR SHARING</span>

              <h2>
                Money shouldn't make
                <br />
                things <span>complicated.</span>
              </h2>

              <p>
                Everything you need to manage shared expenses,
                without the spreadsheets or the mental math.
              </p>
            </div>

            <div className="features-grid">
              {features.map((feature) => (
                <FeatureCard key={feature.number} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how-it-works">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-kicker">THREE SIMPLE STEPS</span>

              <h2>
                From shared bills to
                <br />
                <span>settled balances.</span>
              </h2>

              <p>
                Spend less time figuring out money and more time
                enjoying the moments that matter.
              </p>
            </div>

            <div className="steps-grid">
              {steps.map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta-section">
          <div className="cta-card">
            <div className="cta-decoration cta-decoration-one" />
            <div className="cta-decoration cta-decoration-two" />

            <div className="cta-content">
              <span className="cta-kicker">
                <Zap size={15} />
                MAKE SHARING SIMPLE
              </span>

              <h2>
                Good times.
                <br />
                Fair splits.
              </h2>

              <p>
                Get everyone on the same page. Start organizing
                your shared expenses today.
              </p>

              <a href="/Auth" className="cta-button">
                Create your free account
                <ArrowRight size={18} />
              </a>

              <span className="cta-footnote">
                Simple to start. Easy to keep up with.
              </span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section" id="faq">
          <div className="section-container faq-layout">
            <div className="faq-intro">
              <span className="section-kicker">GOT QUESTIONS?</span>

              <h2>
                A few things
                <br />
                worth <span>knowing.</span>
              </h2>

              <p>
                Here's what to know about managing shared expenses
                with SplitEase.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
