import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import NavLogo from "../components/NavLogo";
import "./Home.css";

/* ── Hero resume card that tilts in 3D following the mouse ─────────────── */
const TiltCard = () => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    // Map cursor position → rotation angle: center = 0, edges = ±8 degrees
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 16;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -12;
    card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)";
  };

  return (
    <div
      className="resume-product-frame"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Interactive resume preview"
    >
      {/* Glow blob behind the card */}
      <div className="card-glow" aria-hidden="true" />

      <div className="resume-paper">
        {/* Header row */}
        <div className="resume-paper-top">
          <div>
            <div className="paper-name">Venugopal</div>
            <div className="paper-role">VFX Supervisor</div>
          </div>
          <div className="paper-avatar">VG</div>
        </div>

        {/* Divider */}
        <div className="paper-line strong" />

        {/* Two-column body */}
        <div className="paper-grid">
          <div>
            <div className="paper-label">Experience</div>
            <div className="paper-line" />
            <div className="paper-line short" />
            <div className="paper-line" />
            <div className="paper-line short" style={{ width: "55%" }} />
          </div>
          <div>
            <div className="paper-label">Skills</div>
            <div className="skill-bar"><span style={{ width: "92%" }} /></div>
            <div className="skill-bar"><span style={{ width: "78%" }} /></div>
            <div className="skill-bar"><span style={{ width: "65%" }} /></div>
            <div className="skill-bar"><span style={{ width: "85%" }} /></div>
          </div>
        </div>
      </div>

      {/* Floating stat badge */}
      <div className="floating-stat">
        <span>ATS Score</span>
        <strong>96%</strong>
      </div>

      {/* Second floating badge */}
      <div className="floating-stat floating-stat-2">
        <span>Export</span>
        <strong>PDF ↓</strong>
      </div>
    </div>
  );
};

/* ── Feature card that fades in when scrolled into view ────────────────── */
const FeatureCard = ({ index, title, desc, delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // IntersectionObserver — no scroll listener, no performance cost
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`feature-card ${visible ? "card-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="feature-index">0{index}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
};

/* ── Main Home page ─────────────────────────────────────────────────────── */
const Home = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }
    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [isMenuOpen]);

  return (
    <div className="home-container premium-shell">

      {/* ── Navigation ── */}
      <nav className="home-nav">
        <NavLogo className="nav-logo" />
        
        {/* Desktop Navigation */}
        <div className="nav-links">
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard" className="nav-btn primary">Dashboard →</Link>
          ) : (
            <>
              <Link to="/login"    className="nav-link">Sign in</Link>
              <Link to="/register" className="nav-btn primary">Get started →</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="nav-mobile-hamburger" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="nav-mobile-drawer-overlay" onClick={() => setIsMenuOpen(false)}>
            <div className="nav-mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <NavLogo className="nav-logo" />
                <button className="drawer-close" onClick={() => setIsMenuOpen(false)}>×</button>
              </div>
              <div className="drawer-links">
                <Link to="/pricing" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                {user ? (
                  <>
                    <Link to="/dashboard" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                    <Link to="/profile" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="drawer-link" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
                    <Link to="/register" className="drawer-btn primary" onClick={() => setIsMenuOpen(false)}>Get started →</Link>
                  </>
                )}
                <div className="drawer-toggle-row">
                  <span>Theme Mode</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <header className="hero-section">
        <div className="hero-content">
          <p className="hero-kicker">
            <span className="kicker-brand">VRESIQ</span> <span className="kicker-pronounce" style={{ opacity: 0.7, fontStyle: "italic", fontSize: "0.95em" }}>(/v-res-eye-cue/)</span> • Smart Resume OS
          </p>

          <h1 className="hero-title">
            Build resumes that<br />
            <span className="hero-title-gradient">actually get read.</span>
          </h1>

          <p className="hero-subtitle">
            Multiple resume templates, section controls, live preview,
            and direct PDF download from the builder.
          </p>

          <div className="hero-actions">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="hero-btn primary-lg"
            >
              Start building free →
            </Link>
            <Link to="/pricing" className="hero-btn secondary-lg">
              View Pro plans
            </Link>
          </div>

          <div className="hero-proof">
            <span>✓ ATS-optimized</span>
            <span>✓ Multiple templates</span>
            <span>✓ PDF export</span>
            <span>✓ Live preview</span>
          </div>
        </div>

        {/* Interactive 3D tilt card */}
        <div className="hero-visual">
          <TiltCard />
        </div>
      </header>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <div className="section-heading fade-in-up">
          <p>Built around the real flow</p>
          <h2 className="section-title">From blank page to interview-ready.</h2>
        </div>

        <div className="features-grid">
          <FeatureCard
            index={1} delay={0}
            title="Smart structured editor"
            desc="Profile, contact, experience, education, skills, projects — each section has intelligent inputs like phone country dial codes and date range pickers."
          />
          <FeatureCard
            index={2} delay={80}
            title="Template selection"
            desc="Choose from multiple layouts and switch instantly while editing."
          />
          <FeatureCard
            index={3} delay={160}
            title="Full customization"
            desc="Accent color, header style, divider style, photo shape, section visibility/order, and optional sections."
          />
          <FeatureCard
            index={4} delay={240}
            title="One-click PDF"
            desc="High-fidelity PDF export matching the live preview exactly. Free users get a minimal watermark; Pro exports are clean."
          />
          <FeatureCard
            index={5} delay={320}
            title="Email your resume"
            desc="Pro users can send their resume PDF directly to any email address without leaving the builder. No third-party tools."
          />
          <FeatureCard
            index={6} delay={400}
            title="Built on real backend"
            desc="Authentication, resume persistence, image upload, email verification, and secure API flow are implemented."
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <p className="cta-kicker">Ready to start?</p>
          <h2>Build the resume you'd proudly link on LinkedIn.</h2>
          <p>Free to start. No credit card required.</p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="hero-btn primary-lg cta-btn"
          >
            Open VRESIQ →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-v">V</span>
            <span className="logo-res">RES</span>
            <span className="logo-iq">IQ</span>
          </div>
          <div className="footer-links">
            <Link to="/pricing">Pricing</Link>
            <Link to={user ? "/dashboard" : "/login"}>
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          Copyright {new Date().getFullYear()} VRESIQ. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Home;
