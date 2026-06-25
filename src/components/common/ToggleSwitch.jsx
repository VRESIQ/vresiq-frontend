import React from "react";
import "./ToggleSwitch.css";

const ToggleSwitch = ({ checked, onChange, label, id }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange({ target: { checked: !checked } });
    }
  };

  return (
    <div className="toggle-switch-container">
      <span className="toggle-switch-label-text" id={`${id}-label`} onClick={() => document.getElementById(id)?.click()}>
        {label}
      </span>
      <label className="toggle-switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          role="switch"
        />
        <span className="toggle-switch-slider"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
