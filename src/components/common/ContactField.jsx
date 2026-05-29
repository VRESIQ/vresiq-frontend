import { sanitizeEmail, sanitizeURL, sanitizeLocation } from "../../utils/inputSanitizers";
import "./SmartInputs.css";

// Normalizes common contact URLs so users don't need to type the full URL every time
const normalize = (platform, raw) => {
  if (!raw || !raw.trim()) return "";
  let val = raw.trim();

  if (platform === "email") {
    if (!val.includes("@")) {
      return `${val}@gmail.com`;
    }
    if (val.endsWith("@")) {
      return `${val}gmail.com`;
    }
    return val;
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

  if (platform === "github") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    if (val.startsWith("github.com")) return `https://${val}`;
    return `https://github.com/${val}`;
  }

  if (platform === "website") {
    if (/^http:\/\//i.test(val)) {
      val = val.replace(/^http:\/\//i, "https://");
    }
    if (val.startsWith("https://")) return val;
    return `https://${val}`;
  }

  return val;
};

const icons = {
  email:    "@",
  linkedin: "in",
  github:   "</>",
  website:  "web",
  location: "loc",
};

const placeholders = {
  email:    "you@email.com",
  linkedin: "linkedin.com/in/username",
  github:   "github.com/username",
  website:  "yoursite.com",
  location: "City, Country",
};

const ContactField = ({ platform, label, value = "", onChange }) => {
  const handleBlur = (e) => {
    const normalized = normalize(platform, e.target.value);
    if (normalized !== e.target.value) {
      onChange(normalized);
    }
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (platform === "email") {
      val = sanitizeEmail(val);
    } else if (platform === "linkedin" || platform === "github" || platform === "website") {
      val = sanitizeURL(val);
    } else if (platform === "location") {
      val = sanitizeLocation(val);
    }
    onChange(val);
  };

  return (
    <div className="contact-field">
      <label className="contact-label">
        {label}
      </label>
      <div className="contact-input-wrap">
        <span className="contact-icon">{icons[platform] || "·"}</span>
        <input
          type={platform === "email" ? "email" : "text"}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholders[platform] || label}
          className="contact-input"
        />
      </div>
    </div>
  );
};

export default ContactField;
