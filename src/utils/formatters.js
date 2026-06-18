/**
 * Format an amount in paise to Indian Rupees (INR) format.
 * @param {number} paise - Amount in paise (1 INR = 100 paise)
 * @returns {string} Formatted INR currency string (e.g., ₹499.00)
 */
export const formatINR = (paise) => {
  if (!paise) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(paise / 100);
};

/**
 * Clean up invalid date keywords and return empty string if invalid.
 */
const cleanInvalidValue = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (
    s === "undefined" ||
    s === "null" ||
    s === "Invalid Date" ||
    s === "-" ||
    s === "null null" ||
    s === "undefined undefined"
  ) {
    return "";
  }
  return s;
};

/**
 * Format partial date (month, year, or month + year).
 * @param {string} monthOrDateStr - Month string or complete date string (e.g., "Jan", "Jan 2023")
 * @param {string} [year] - Year string (e.g., "2023")
 * @returns {string} Formatted date string
 */
export const formatPartialDate = (monthOrDateStr, year) => {
  const cleanedMonth = cleanInvalidValue(monthOrDateStr);
  const cleanedYear = cleanInvalidValue(year);

  let m = "";
  let y = "";

  if (cleanedYear) {
    m = cleanedMonth;
    y = cleanedYear;
  } else if (cleanedMonth) {
    if (cleanedMonth === "Present") {
      return "Present";
    }

    // Check if the input contains a range separator like "-", "–", or " to "
    const rangeSeparator = [ " – ", " - ", " to " ].find(sep => cleanedMonth.includes(sep));
    if (rangeSeparator) {
      const parts = cleanedMonth.split(rangeSeparator);
      return formatDateRange(parts[0], parts[1]);
    }
    // Also check simple hyphens if no spaces
    if (cleanedMonth.includes("-") && !cleanedMonth.includes(" ")) {
      const parts = cleanedMonth.split("-");
      return formatDateRange(parts[0], parts[1]);
    }

    const parts = cleanedMonth.split(/\s+/);
    if (parts.length === 1) {
      const part = parts[0];
      if (/^\d{4}$/.test(part)) {
        y = part;
      } else {
        m = part;
      }
    } else {
      m = parts[0];
      y = parts[1];
    }
  }

  m = cleanInvalidValue(m);
  y = cleanInvalidValue(y);

  if (m && y) return `${m} ${y}`;
  if (m) return m;
  if (y) return y;
  return "";
};

/**
 * Format date range cleanly.
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatPartialDate(startDate);
  const end = formatPartialDate(endDate);

  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return "";
};

