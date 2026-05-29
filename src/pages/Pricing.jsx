import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useRazorpay from "../hooks/useRazorpay";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import "./Pricing.css";

const included = "plan-feature included";
const muted = "plan-feature muted";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startPayment } = useRazorpay();
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  const isPremium = user?.subscriptionPlan?.toLowerCase() === "premium";

  const handleUpgrade = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isPremium) {
      setMessage("Your account already has Pro access.");
      return;
    }

    setPaying(true);
    setMessage("");
    startPayment({
      onSuccess: () => {
        setMessage("Payment verified. Pro access is active on this account.");
        setPaying(false);
      },
      onFailure: (err) => {
        setMessage(err || "Payment could not be completed. Please try again.");
        setPaying(false);
      },
    });
  };

  return (
    <div className="pricing-page premium-shell">
      <nav className="pricing-nav">
        <NavLogo className="pricing-logo" />
        <div className="pricing-nav-links">
          {user && <Link to="/profile" className="btn-back">Profile</Link>}
          <Link to={user ? "/dashboard" : "/login"} className="btn-back">
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="pricing-content">
        <div className="pricing-heading">
          <p>Plans</p>
          <h1>Start free. Upgrade only when the workflow needs it.</h1>
          <span>One-time payment for Pro access, connected to your Razorpay backend.</span>
        </div>

        {message && <div className="pricing-msg">{message}</div>}

        <div className="plans">
          <section className="plan">
            <div className="plan-top">
              <div>
                <p className="plan-name">Free</p>
                <div className="plan-price">INR 0</div>
              </div>
              <span className="plan-chip">Starter</span>
            </div>
            <p className="plan-copy">Best for one polished resume and a simple export flow.</p>
            <ul className="plan-features">
              <li className={included}>1 resume</li>
              <li className={included}>Basic ATS templates</li>
              <li className={included}>PDF download</li>
              <li className={muted}>Premium templates</li>
              <li className={muted}>Unlimited resumes</li>
            </ul>
            {!user ? (
              <Link to="/register" className="plan-btn">Create account</Link>
            ) : !isPremium ? (
              <Link to="/dashboard" className="plan-btn">Current plan</Link>
            ) : (
              <div className="plan-btn disabled">Included with account</div>
            )}
          </section>

          <section className="plan featured">
            <div className="plan-top">
              <div>
                <p className="plan-name">Pro</p>
                <div className="plan-price">INR 299</div>
              </div>
              <div className="plan-corner">
                <div className="plan-badge">Recommended</div>
                <span className="plan-chip dark">One-time</span>
              </div>
            </div>
            <p className="plan-copy">For users who want multiple role-specific resumes and a cleaner template range.</p>
            <ul className="plan-features">
              <li className={included}>Unlimited resumes</li>
              <li className={included}>All premium templates</li>
              <li className={included}>PDF download</li>
              <li className={included}>Profile image upload</li>
              <li className={included}>Future email sharing workflow</li>
            </ul>
            {isPremium ? (
              <div className="plan-btn disabled">Pro is active</div>
            ) : (
              <button className="plan-btn primary" onClick={handleUpgrade} disabled={paying}>
                {paying ? "Opening checkout" : "Upgrade to Pro"}
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
