const currentYear = () => new Date().getFullYear();

/**
 * Educational Comment:
 * - Digit-only validation strips non-numeric characters to ensure integer-only inputs.
 * - Used for fields like Graduation/Passing Year.
 */
export const sanitizeDigits = (value = "") => String(value).replace(/\D/g, "");

export const sanitizeYear = (value = "") => {
  const digits = sanitizeDigits(value).slice(0, 4);
  const maxYear = currentYear() + 10;
  if (digits.length === 4 && Number(digits) > maxYear) {
    return String(maxYear);
  }
  return digits;
};

export const isCompleteYear = (value = "") => /^\d{4}$/.test(String(value));

/**
 * Educational Comment:
 * - sanitizeTextOnly: Restricts inputs to letters (unicode inclusive), spaces, hyphens, and apostrophes.
 * - Capitalizes the first letter of each word to ensure clean title presentation.
 * - Used for: Full Name, Company, Institution, Certification Name, Project Name, Achievement Title, Location.
 */
export const sanitizeTextOnly = (value = "") => {
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z\s\-\'\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");

  if (!filtered) return "";
  return filtered.replace(/(^|[^'])\b([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

export const sanitizeStrictText = (value = "") => {
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\,\.\-\'\/\(\)\:\&\+\#\@\_\!\?\*\=\%\;\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");

  if (!filtered) return "";
  return filtered.charAt(0).toUpperCase() + filtered.slice(1);
};

export const isNumericPattern = (value = "") => {
  const cleaned = String(value).replace(/[\s\-\+\(\)\.\,\/]/g, "");
  return cleaned.length > 0 && /^\d+$/.test(cleaned);
};

/**
 * Educational Comment:
 * - sanitizeName: Specific standard name formatting with word capitalization.
 * - Restricts input to text only (letters, spaces, hyphens, apostrophes) and rejects invalid symbols.
 */
export const sanitizeName = (value = "") => {
  if (isNumericPattern(value)) return "";

  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z\s\-\'\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  return filtered.replace(/(^|[^'])\b([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

export const sanitizeRole = (value = "") => {
  if (value.length > 2 && isNumericPattern(value)) {
    return "";
  }

  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\-\'\/\.\&\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");

  if (!filtered) return "";
  return filtered.replace(/(^|[^'])\b([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

export const sanitizeURL = (value = "") => {
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\.\-\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\%]/g, "");
};

export const sanitizeEmail = (value = "") => {
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\.\-\_\@\+]/g, "");
};

export const sanitizeUsername = (value = "") => {
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\-\_\.]/g, "");
};

export const sanitizeLocation = (value = "") => {
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  // Location text-only constraint with comma allowed for city/country separation
  const filtered = noEmojis
    .replace(/[^A-Za-z\s\-\'\,\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  return filtered.replace(/(^|[^'])\b([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

export const sanitizeFlexibleDate = (value = "") => {
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\-\/\,\.]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  return filtered.replace(/(^|[^'])\b([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

/**
 * Educational Comment:
 * - sanitizeDecimal: Accepts only digits and a single decimal point.
 * - Used for: GPA / CGPA validation.
 */
export const sanitizeDecimal = (value = "") => {
  let cleaned = String(value).replace(/[^0-9\.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
};

/**
 * Educational Comment:
 * - smartNormalizeUrl: Converts shorthand URL inputs into valid absolute URLs.
 * - Ensures there are no duplicated protocols or malformed patterns.
 */
export const smartNormalizeUrl = (platform, raw) => {
  if (!raw || !raw.trim()) return "";
  let val = raw.trim();

  // Strip duplicated protocols
  val = val.replace(/^(https?:\/\/)+/i, "$1");

  if (platform === "github") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    if (val.startsWith("github.com")) return `https://${val}`;
    return `https://github.com/${val}`;
  }

  if (platform === "linkedin") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    if (val.startsWith("linkedin.com")) return `https://${val}`;
    if (val.startsWith("in/")) return `https://linkedin.com/${val}`;
    return `https://linkedin.com/in/${val}`;
  }

  if (platform === "leetcode") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    if (val.startsWith("leetcode.com")) return `https://${val}`;
    return `https://leetcode.com/${val}`;
  }

  if (platform === "hackerrank") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    if (val.startsWith("hackerrank.com")) return `https://${val}`;
    return `https://hackerrank.com/${val}`;
  }

  // Generic Website / URLs
  if (/^http:\/\//i.test(val)) {
    val = val.replace(/^http:\/\//i, "https://");
  }
  if (val.startsWith("https://")) return val;
  return `https://${val}`;
};

/**
 * Educational Comment:
 * - sanitizeRawText: Cleans special symbols and emojis but preserves exact casing.
 * - Used for: Skills, Technologies, Usernames, or generic text where auto-capitalization should be avoided.
 */
export const sanitizeRawText = (value = "") => {
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  return noEmojis
    .replace(/[^A-Za-z0-9\s\,\.\-\'\/\(\)\:\&\+\#\@\_\!\?\*\=\%\;\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");
};

