import { useState } from "react";
import { sanitizeYear } from "../../utils/inputSanitizers";
import "./SmartInputs.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DateRangePicker = ({ startDate = "", endDate = "", onChange }) => {
  const parse = (val) => {
    if (!val || val === "Present") return { month: "", year: "" };
    const [month, year] = val.split(" ");
    return { month: month || "", year: year || "" };
  };

  const initialStart = parse(startDate);
  const initialEnd = parse(endDate);
  const [startMonth, setStartMonth] = useState(initialStart.month);
  const [startYear, setStartYear] = useState(initialStart.year);
  const [endMonth, setEndMonth] = useState(initialEnd.month);
  const [endYear, setEndYear] = useState(initialEnd.year);
  const [present, setPresent] = useState(endDate === "Present");

  const buildDate = (month, year) => (month && year ? `${month} ${year}` : "");

  const handleChange = (sm, sy, em, ey, isPresent) => {
    onChange({
      startDate: buildDate(sm, sy),
      endDate: isPresent ? "Present" : buildDate(em, ey),
    });
  };

  return (
    <div className="date-range-wrap">
      <div className="date-group">
        <label className="date-label">Start date</label>
        <div className="date-selects">
          <select
            value={startMonth}
            onChange={(e) => {
              setStartMonth(e.target.value);
              handleChange(e.target.value, startYear, endMonth, endYear, present);
            }}
          >
            <option value="">Month</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={startYear}
            onChange={(e) => {
              const year = sanitizeYear(e.target.value);
              setStartYear(year);
              handleChange(startMonth, year, endMonth, endYear, present);
            }}
            placeholder="Year"
            aria-label="Start year"
          />
        </div>
      </div>

      <div className="date-group">
        <label className="date-label">End date</label>
        {present ? (
          <p className="date-present-text">Present</p>
        ) : (
          <div className="date-selects">
            <select
              value={endMonth}
              onChange={(e) => {
                setEndMonth(e.target.value);
                handleChange(startMonth, startYear, e.target.value, endYear, false);
              }}
              disabled={present}
            >
              <option value="">Month</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={endYear}
              onChange={(e) => {
                const year = sanitizeYear(e.target.value);
                setEndYear(year);
                handleChange(startMonth, startYear, endMonth, year, false);
              }}
              disabled={present}
              placeholder="Year"
              aria-label="End year"
            />
          </div>
        )}
        <label className="date-present-check">
          <input
            type="checkbox"
            checked={present}
            onChange={(e) => {
              setPresent(e.target.checked);
              handleChange(startMonth, startYear, endMonth, endYear, e.target.checked);
            }}
          />
          <span>Currently here</span>
        </label>
      </div>
    </div>
  );
};

export default DateRangePicker;
