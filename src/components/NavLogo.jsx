import { Link } from "react-router-dom";

/**
 * NavLogo — consistent "VRESIQ" brand mark used across every page nav.
 *
 * Design: italic bold "V" in accent-dark green, then "RESIQ" in var(--ink).
 * This is the ONLY place the logo markup lives. Changing it here changes it
 * everywhere — Home, Dashboard, Editor, Profile, Pricing.
 *
 * Usage: <NavLogo />
 */
const NavLogo = ({ className = "nav-logo" }) => (
  <Link to="/" className={className} aria-label="VRESIQ home">
    <span className="logo-v">V</span>
    <span className="logo-res">RES</span>
    <span className="logo-iq">IQ</span>
  </Link>
);

export default NavLogo;
