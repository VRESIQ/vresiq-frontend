const currentYear = () => new Date().getFullYear();

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

export const sanitizeStrictText = (value = "") => {
  // Strip emojis specifically
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  
  // Allow letters, numbers, spaces, and basic punctuation
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s,\.\-\'\/\(\)\:\&\+\#\@\_\!\?\*\=\%\;\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");

  if (!filtered) return "";
  return filtered.charAt(0).toUpperCase() + filtered.slice(1);
};

export const isNumericPattern = (value = "") => {
  const cleaned = String(value).replace(/[\s\-\+\(\)\.\,\/]/g, "");
  return cleaned.length > 0 && /^\d+$/.test(cleaned);
};

export const sanitizeName = (value = "") => {
  if (isNumericPattern(value)) return "";

  // Allow letters (including international accents), spaces, hyphens, apostrophes, and periods
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z\s\-\'\.\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  // Capitalize first letter of each word (standard name formatting)
  return filtered.replace(/\b\w/g, c => c.toUpperCase());
};

export const sanitizeRole = (value = "") => {
  // Reject purely numeric patterns longer than 2 characters
  if (value.length > 2 && isNumericPattern(value)) {
    return "";
  }

  // Allow letters, numbers, spaces, hyphens, slashes, periods, and ampersands (e.g. "UX/UI Designer & Developer 3")
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\-\'\/\.\&\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");

  if (!filtered) return "";
  return filtered.charAt(0).toUpperCase() + filtered.slice(1);
};

export const sanitizeURL = (value = "") => {
  // Allow valid URL characters (no spaces or emojis)
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\.\-\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\%]/g, "");
};

export const sanitizeEmail = (value = "") => {
  // Allow alphanumeric, periods, hyphens, underscores, @, and +
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\.\-\_\@\+]/g, "");
};

export const sanitizeUsername = (value = "") => {
  // Restricted safe handle characters: alphanumeric, hyphens, underscores, and periods
  return String(value)
    .replace(/[\s\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/[^A-Za-z0-9\-\_\.]/g, "");
};

export const sanitizeLocation = (value = "") => {
  // Location: allow letters, numbers, spaces, commas, periods, hyphens, parentheses
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\,\.\-\(\)\u00C0-\u00FF\u0100-\u017F]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  return filtered.charAt(0).toUpperCase() + filtered.slice(1);
};

export const sanitizeFlexibleDate = (value = "") => {
  // Allow letters, numbers, spaces, hyphens, slashes, commas, periods
  const noEmojis = String(value).replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  const filtered = noEmojis
    .replace(/[^A-Za-z0-9\s\-\/\,\.]/g, "")
    .replace(/\s{2,}/g, " ");
  
  if (!filtered) return "";
  return filtered;
};

