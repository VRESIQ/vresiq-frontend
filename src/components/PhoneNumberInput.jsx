import React, { useState, useEffect, useRef } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  isValidPhoneNumber
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import "./common/SmartInputs.css";

const PhoneNumberInput = ({
  value = "",
  onChange,
  placeholder,
  hint,
  defaultCountry = "US",
  disabled = false,
  required = false
}) => {
  const allCountries = getCountries();

  // Helper: robust parser to extract country and local number from any input format
  const parseValue = (val) => {
    if (!val) return { country: defaultCountry, local: "" };

    const cleaned = val.trim();

    // 1. Handle old VResIQ format with hyphen: +91-9876543210
    if (cleaned.includes("-")) {
      const parts = cleaned.split("-");
      const dial = parts[0].trim();
      const rest = parts.slice(1).join("-").trim();
      const foundCountry = allCountries.find(
        (c) => `+${getCountryCallingCode(c)}` === dial
      );
      if (foundCountry) {
        return { country: foundCountry, local: rest };
      }
    }

    // 2. Try parsing standard E.164 (+919876543210)
    if (cleaned.startsWith("+")) {
      try {
        const parsed = parsePhoneNumber(cleaned);
        if (parsed && parsed.country) {
          return { country: parsed.country, local: parsed.nationalNumber };
        }
      } catch (e) {
        // Fallback to dial prefix search
      }
    }

    // 3. Fallback: Check if value starts with any dial code (without + sign)
    for (const c of allCountries) {
      const prefix = getCountryCallingCode(c);
      if (cleaned.startsWith(prefix) && cleaned.length > prefix.length + 4) {
        return { country: c, local: cleaned.slice(prefix.length) };
      }
    }

    // 4. Default fallback
    return { country: defaultCountry, local: cleaned };
  };

  const parsed = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);
  const lastValueRef = useRef(value);

  // Sync internal state ONLY when the value prop changes from outside (not from user typing)
  useEffect(() => {
    if (value !== lastValueRef.current) {
      const updated = parseValue(value);
      setSelectedCountry(updated.country);
      setLocalNumber(updated.local);
      lastValueRef.current = value;
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getE164Value = (countryCode, localNum) => {
    if (!localNum) return "";
    const cleanNum = localNum.replace(/\D/g, "");
    const dialCode = getCountryCallingCode(countryCode);
    return `+${dialCode}${cleanNum}`;
  };

  const handleNumberChange = (e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/[^\d\s\-()]/g, "");
    setLocalNumber(cleanVal);
    const e164 = getE164Value(selectedCountry, cleanVal);
    lastValueRef.current = e164;
    onChange(e164);
  };

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    setDropdownOpen(false);
    setSearch("");
    const e164 = getE164Value(countryCode, localNumber);
    lastValueRef.current = e164;
    onChange(e164);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const dialCode = getCountryCallingCode(selectedCountry);
  const FlagIcon = flags[selectedCountry];

  // Search filter
  const filteredCountries = allCountries.filter((c) => {
    const name = en[c] ? en[c].toLowerCase() : "";
    const code = c.toLowerCase();
    const prefix = getCountryCallingCode(c);
    const query = search.toLowerCase();
    return name.includes(query) || code.includes(query) || prefix.includes(query);
  });

  // Reset active list index on search changes
  useEffect(() => {
    setActiveIdx(0);
  }, [search]);

  // Scroll active country dropdown item into view
  useEffect(() => {
    if (dropdownOpen && optionRefs.current[activeIdx]) {
      optionRefs.current[activeIdx].scrollIntoView({
        block: "nearest",
        behavior: "auto"
      });
    }
  }, [activeIdx, dropdownOpen]);

  // Keyboard navigation inside container
  const handleKeyDown = (e) => {
    if (!dropdownOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setDropdownOpen(false);
      if (buttonRef.current) buttonRef.current.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, filteredCountries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries[activeIdx]) {
        handleCountrySelect(filteredCountries[activeIdx]);
      }
    }
  };

  // Validation checking
  const currentE164 = getE164Value(selectedCountry, localNumber);
  const isValid = currentE164 ? isValidPhoneNumber(currentE164) : true;
  const showError = touched && localNumber.length > 0 && !isValid;

  return (
    <div className="phone-input-container" ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="phone-input-wrap">
        <button
          ref={buttonRef}
          type="button"
          className="phone-country-btn"
          onClick={() => !disabled && setDropdownOpen((o) => !o)}
          disabled={disabled}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-label="Select country dial code"
        >
          {FlagIcon && (
            <FlagIcon
              title={en[selectedCountry]}
              style={{
                width: "20px",
                height: "14px",
                borderRadius: "2px",
                objectFit: "cover"
              }}
            />
          )}
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.7 }}>
            {selectedCountry}
          </span>
          <span className="phone-dial">+{dialCode}</span>
          <span className="phone-chevron" aria-hidden="true">▾</span>
        </button>

        <input
          type="tel"
          className="phone-number-input"
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          placeholder={placeholder || "Enter local number"}
          disabled={disabled}
          required={required}
          aria-invalid={showError}
        />

        {dropdownOpen && (
          <div className="phone-dropdown" ref={dropdownRef} role="listbox">
            <input
              type="text"
              placeholder="Search by country, code, or dial code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="phone-search"
              autoFocus
              aria-label="Search countries"
            />
            <div className="phone-country-list">
              {filteredCountries.map((c, index) => {
                const OptionFlag = flags[c];
                const countryName = en[c] || c;
                const callingCode = getCountryCallingCode(c);
                const isSelected = c === selectedCountry;
                const isActive = index === activeIdx;

                return (
                  <button
                    key={c}
                    ref={(el) => (optionRefs.current[index] = el)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`phone-country-option ${isSelected ? "active" : ""} ${isActive ? "focused" : ""}`}
                    onClick={() => handleCountrySelect(c)}
                    style={{
                      backgroundColor: isActive ? "var(--wash-2, #ebebdf)" : isSelected ? "var(--wash, #f5f5f5)" : "transparent"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {OptionFlag && (
                        <OptionFlag
                          title={countryName}
                          style={{
                            width: "18px",
                            height: "12px",
                            borderRadius: "1px",
                            objectFit: "cover"
                          }}
                        />
                      )}
                      <span style={{ opacity: 0.6, fontSize: "0.8rem", fontWeight: "600" }}>
                        {c}
                      </span>
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {countryName}
                    </span>
                    <span className="phone-dial">+{callingCode}</span>
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div style={{ padding: "10px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showError && (
        <small style={{ color: "var(--danger, #dc2626)", fontSize: "0.78rem", marginTop: "0.35rem", display: "block" }}>
          Please enter a valid phone number for {en[selectedCountry] || selectedCountry}.
        </small>
      )}
      {hint && !showError && (
        <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block" }}>
          {hint}
        </small>
      )}
    </div>
  );
};

export default PhoneNumberInput;
