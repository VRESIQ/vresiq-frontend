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
