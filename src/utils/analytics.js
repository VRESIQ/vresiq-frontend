/*
 * analytics.js
 * Thin wrapper around window.gtag for GA4.
 * All callers import from here so the integration point is centralised.
 *
 * GA4 Measurement ID: G-KRRC930LPF
 * send_page_view is disabled in the gtag('config') call in index.html
 * so that React Router controls every page_view event manually.
 */

const GA_ID = "G-KRRC930LPF";

/**
 * Send a page_view event to GA4.
 * Called by usePageTracking on every route change.
 *
 * @param {string} path - e.g. "/dashboard", "/resume/abc123/edit"
 * @param {string} [title] - document title at time of navigation
 */
export function trackPageView(path, title) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title || document.title,
    send_to: GA_ID,
  });
}

/**
 * Generic GA4 event helper.
 *
 * @param {string} eventName - GA4 event name
 * @param {object} [params]  - additional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, { ...params, send_to: GA_ID });
}
