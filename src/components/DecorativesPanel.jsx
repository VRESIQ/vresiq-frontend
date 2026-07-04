import "./DecorativesPanel.css";
import ToggleSwitch from "./common/ToggleSwitch";

const DIVIDER_OPTIONS = [
  { value: "line",     label: "Line" },
  { value: "thick",    label: "Thick" },
  { value: "dots",     label: "Dots" },
  { value: "gradient", label: "Gradient" },
];

const HEADER_OPTIONS = [
  { value: "minimal",    label: "Minimal" },
  { value: "card",       label: "Card" },
  { value: "full-bleed", label: "Full Bleed" },
];

const PHOTO_OPTIONS = [
  { value: "circle",  label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "square",  label: "Square" },
  { value: "none",    label: "None" },
];

const PROGRESS_OPTIONS = [
  { value: "bar",       label: "Bar" },
  { value: "dots",      label: "Dots" },
  { value: "text-only", label: "Text" },
];

const BULLET_OPTIONS = [
  { value: "disc",        label: "• Dot" },
  { value: "circle",      label: "◦ Circle" },
  { value: "square",      label: "▪ Square" },
  { value: "dash",        label: "– Dash" },
  { value: "arrow",       label: "› Arrow" },
  { value: "decimal",     label: "1. Number" },
  { value: "lower-roman", label: "i. Roman" },
  { value: "upper-roman", label: "I. Roman" },
  { value: "lower-alpha", label: "a. Alpha" },
  { value: "none",        label: "None" },
];

const getContrastRatioAgainstWhite = (hex) => {
  try {
    const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
    if (cleanHex.length !== 7) return 21.0; // assume good contrast
    const r = parseInt(cleanHex.slice(1, 3), 16);
    const g = parseInt(cleanHex.slice(3, 5), 16);
    const b = parseInt(cleanHex.slice(5, 7), 16);

    const getL = (v) => {
      const srgb = v / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    };

    const luminance = 0.2126 * getL(r) + 0.7152 * getL(g) + 0.0722 * getL(b);
    // White has luminance 1.0; formula: (brighter + 0.05) / (darker + 0.05)
    const whiteLuminance = 1.0;
    const lighter = Math.max(luminance, whiteLuminance);
    const darker = Math.min(luminance, whiteLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  } catch (e) {
    return 21.0;
  }
};

const DecorativesPanel = ({ decoratives = {}, onChange, skillsMode = "individual" }) => {
  const set = (key, value) => onChange({ ...decoratives, [key]: value });

  const useCustomAccent = decoratives.useCustomAccent === "true";
  const activeColor = decoratives.accentColor || "#111410";
  const contrast = getContrastRatioAgainstWhite(activeColor);
  const isLowContrast = contrast < 4.5;

  return (
    <div className="dec-panel">
      <div className="dec-group">
        <div style={{ marginBottom: useCustomAccent ? "12px" : "0" }}>
          <ToggleSwitch
            id="use-custom-accent"
            label="Use Custom Accent Color"
            checked={useCustomAccent}
            onChange={(e) => set("useCustomAccent", e.target.checked ? "true" : "false")}
          />
        </div>

        {useCustomAccent && (
          <div className="dec-color-picker-block" style={{ marginTop: "8px" }}>
            <label className="dec-label">Accent color</label>
            <div className="dec-color-row">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="dec-color-input"
              />
              <span className="dec-color-hex">{activeColor}</span>
            </div>
            {isLowContrast && (
              <div className="dec-contrast-warning" style={{
                marginTop: "8px",
                padding: "8px 12px",
                background: "rgba(249, 115, 22, 0.1)",
                border: "1px solid rgba(249, 115, 22, 0.2)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: "#fdba74"
              }}>
                Contrast Warning: {contrast.toFixed(1)}:1. WCAG AA requires at least 4.5:1 for readable body text on light backgrounds.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dec-group">
        <label className="dec-label">Divider style</label>
        <div className="dec-chips">
          {DIVIDER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`dec-chip ${(decoratives.dividerStyle || "line") === o.value ? "active" : ""}`}
              onClick={() => set("dividerStyle", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dec-group">
        <label className="dec-label">Header style</label>
        <div className="dec-chips">
          {HEADER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`dec-chip ${(decoratives.headerStyle || "minimal") === o.value ? "active" : ""}`}
              onClick={() => set("headerStyle", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dec-group">
        <label className="dec-label">Photo shape</label>
        <div className="dec-chips">
          {PHOTO_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`dec-chip ${(decoratives.photoShape || "circle") === o.value ? "active" : ""}`}
              onClick={() => set("photoShape", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>



      {skillsMode !== "category" && (
        <div className="dec-group">
          <label className="dec-label">Skill progress style</label>
          <div className="dec-chips">
            {PROGRESS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`dec-chip ${(decoratives.progressStyle || "bar") === o.value ? "active" : ""}`}
                onClick={() => set("progressStyle", o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dec-group">
        <label className="dec-label">Bullet style</label>
        <div className="dec-chips">
          {BULLET_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`dec-chip ${(decoratives.bulletStyle || "disc") === o.value ? "active" : ""}`}
              onClick={() => set("bulletStyle", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dec-toggles">
        <ToggleSwitch
          id="page-border"
          label="Page border"
          checked={decoratives.pageBorder === "true"}
          onChange={(e) => set("pageBorder", e.target.checked ? "true" : "false")}
        />
        <ToggleSwitch
          id="section-numbers"
          label="Section numbers"
          checked={decoratives.sectionNumbers === "true"}
          onChange={(e) => set("sectionNumbers", e.target.checked ? "true" : "false")}
        />
        <ToggleSwitch
          id="high-density"
          label="High-Density Spacing"
          checked={decoratives.highDensity === "true"}
          onChange={(e) => set("highDensity", e.target.checked ? "true" : "false")}
        />
        <ToggleSwitch
          id="link-style"
          label="Professional hyperlinks"
          checked={decoratives.linkStyle === "professional"}
          onChange={(e) => set("linkStyle", e.target.checked ? "professional" : "standard")}
        />
        <ToggleSwitch
          id="accent-links"
          label="Accent-colored links"
          checked={decoratives.accentLinks !== "false"}
          onChange={(e) => set("accentLinks", e.target.checked ? "true" : "false")}
        />
      </div>
    </div>
  );
};

export default DecorativesPanel;
