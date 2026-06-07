import { useState } from "react";
import { AsYouType } from "libphonenumber-js";
import "./SmartInputs.css";

// 50 most common countries with their dial codes and flag emojis
const COUNTRIES = [
  { code: "IN", dial: "+91",  flag: "🇮🇳", name: "India" },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "CA", dial: "+1",   flag: "🇨🇦", name: "Canada" },
  { code: "AU", dial: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "France" },
  { code: "SG", dial: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "JP", dial: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "CN", dial: "+86",  flag: "🇨🇳", name: "China" },
  { code: "KR", dial: "+82",  flag: "🇰🇷", name: "South Korea" },
  { code: "PK", dial: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "BD", dial: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "LK", dial: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "NP", dial: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "NZ", dial: "+64",  flag: "🇳🇿", name: "New Zealand" },
  { code: "ZA", dial: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "BR", dial: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "MX", dial: "+52",  flag: "🇲🇽", name: "Mexico" },
  { code: "AR", dial: "+54",  flag: "🇦🇷", name: "Argentina" },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Italy" },
  { code: "ES", dial: "+34",  flag: "🇪🇸", name: "Spain" },
  { code: "NL", dial: "+31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "SE", dial: "+46",  flag: "🇸🇪", name: "Sweden" },
  { code: "NO", dial: "+47",  flag: "🇳🇴", name: "Norway" },
  { code: "CH", dial: "+41",  flag: "🇨🇭", name: "Switzerland" },
  { code: "RU", dial: "+7",   flag: "🇷🇺", name: "Russia" },
  { code: "TR", dial: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "EG", dial: "+20",  flag: "🇪🇬", name: "Egypt" },
  { code: "PH", dial: "+63",  flag: "🇵🇭", name: "Philippines" },
  { code: "ID", dial: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "MY", dial: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "TH", dial: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "VN", dial: "+84",  flag: "🇻🇳", name: "Vietnam" },
  { code: "PL", dial: "+48",  flag: "🇵🇱", name: "Poland" },
  { code: "UA", dial: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "IR", dial: "+98",  flag: "🇮🇷", name: "Iran" },
  { code: "IQ", dial: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "QA", dial: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "KW", dial: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "OM", dial: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "BH", dial: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "JO", dial: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "IL", dial: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "GH", dial: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "ET", dial: "+251", flag: "🇪🇹", name: "Ethiopia" },
];

const PhoneInput = ({ value = "", onChange, placeholder, hint }) => {
  // Parse the stored value — it's in "+91-9876543210" format
  // Split on the first hyphen to get code and number separately
  const parseStored = (stored) => {
    if (!stored) return { country: COUNTRIES[0], number: "" };
    const parts = stored.split("-");
    const dialCode = parts[0];
    const found = COUNTRIES.find((c) => c.dial === dialCode);
    return {
      country: found || COUNTRIES[0],
      number: parts.slice(1).join("-"),
    };
  };

  const parsed = parseStored(value);
  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [rawNumber, setRawNumber] = useState(parsed.number);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleNumberChange = (e) => {
    // AsYouType formats as user types (e.g., "98765 43210" for IN)
    const formatter = new AsYouType(selectedCountry.code);
    const formatted = formatter.input(e.target.value.replace(/\D/g, ""));
    setRawNumber(formatted);
    onChange(`${selectedCountry.dial}-${formatted}`);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearch("");
    onChange(`${country.dial}-${rawNumber}`);
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  return (
    <div className="phone-input-container">
      <div className="phone-input-wrap">
        <button
          type="button"
          className="phone-country-btn"
          onClick={() => setDropdownOpen((o) => !o)}
        >
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.7 }}>{selectedCountry.code}</span>
          <span className="phone-dial">{selectedCountry.dial}</span>
          <span className="phone-chevron">▾</span>
        </button>

        <input
          type="tel"
          className="phone-number-input"
          value={rawNumber || ""}
          onChange={handleNumberChange}
          placeholder={placeholder || "Phone number"}
        />

        {dropdownOpen && (
          <div className="phone-dropdown">
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="phone-search"
              autoFocus
            />
            <div className="phone-country-list">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`phone-country-option ${c.code === selectedCountry.code ? "active" : ""}`}
                  onClick={() => handleCountrySelect(c)}
                >
                  <span style={{ opacity: 0.6, fontSize: "0.8rem", width: "24px", display: "inline-block", fontWeight: "600" }}>{c.code}</span>
                  <span>{c.name}</span>
                  <span className="phone-dial">{c.dial}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {hint && <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block" }}>{hint}</small>}
    </div>
  );
};

export default PhoneInput;
