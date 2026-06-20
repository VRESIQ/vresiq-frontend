import { useEffect, useMemo } from "react";
import { loadTemplateFont, getFontVars, FONT_MAP } from "../utils/fonts";
import "./ResumePreview.css";
import { formatPartialDate, formatDateRange } from "../utils/formatters";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const hasText = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "object") {
    return String(v.value || "").trim().length > 0;
  }
  return String(v || "").trim().length > 0;
};

const cleanEmail = (email) => {
  if (!email) return "";
  return String(email).trim().replace(/^mailto:/i, "");
};

const cleanPhone = (phone) => {
  if (!phone) return "";
  return String(phone).trim().replace(/^tel:/i, "");
};

const formatUrl = (url) => {
  if (!url) return "";
  let trimmed = String(url).trim();
  if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  } else if (!/^https:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
};

const formatPhone = (phone) => {
  if (!phone) return "";
  return cleanPhone(phone).replace(/[^\d+]/g, "");
};

const getLinkedInUrl = (val) => {
  if (!val) return "";
  let trimmed = String(val).trim();
  if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  } else if (!/^https:\/\//i.test(trimmed)) {
    if (/linkedin\.com/i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    } else {
      trimmed = `https://linkedin.com/in/${trimmed}`;
    }
  }
  return trimmed;
};

const getGithubUrl = (val) => {
  if (!val) return "";
  let trimmed = String(val).trim();
  if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://");
  } else if (!/^https:\/\//i.test(trimmed)) {
    if (/github\.com/i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    } else {
      trimmed = `https://github.com/${trimmed}`;
    }
  }
  return trimmed;
};

const isUrl = (str) => {
  if (!str) return false;
  const trimmed = String(str).trim();
  return /^https?:\/\//i.test(trimmed) || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i.test(trimmed);
};

const getLocationUrl = (location) => {
  if (!location) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

const renderLinkOrText = (text, className, isTitle = false) => {
  if (!text) return null;
  const strText = String(text);
  const trimmed = strText.trim();
  if (isUrl(trimmed)) {
    return (
      <a href={formatUrl(trimmed)} target="_blank" rel="noopener noreferrer" className="resume-link rp-compact-url" style={isTitle ? { fontWeight: 600 } : undefined}>
        {trimmed.replace(/^(https?:\/\/)?(www\.)?/, "")} <span className="external-link-icon">↗</span>
      </a>
    );
  }
  return isTitle ? <strong style={{ fontWeight: 600 }}>{strText}</strong> : strText;
};


const icon = (section) => ({
  Experience: "", Education: "", Skills: "",
  Projects: "", Certifications: "", Languages: "", Interests: "",
}[section] || "");

// ─── Shared section-level components ─────────────────────────────────────────
const STitle = ({ children, showIcon, dec, sectionNumber }) => {
  const prefix = showIcon ? `${icon(children)} ` : "";
  const num = dec?.sectionNumbers === "true";
  return (
    <h3 className="rp-stitle" data-divider={dec?.dividerStyle || "line"}>
      {num && sectionNumber && <span className="rp-stitle-num" data-number={sectionNumber} aria-hidden="true" />}
      {prefix}{children}
    </h3>
  );
};

const handleContactClick = (e) => {
  const href = e.currentTarget.getAttribute("href");
  if (href && (href.startsWith("mailto:") || href.startsWith("tel:"))) {
    e.preventDefault();
    window.location.href = href;
  }
};

const buildContactEntries = (c = {}) => {
  const entries = [];

  if (hasText(c.email)) {
    const emailObj = typeof c.email === "object" && c.email !== null ? c.email : { value: c.email, displayText: "" };
    const emailVal = emailObj.value || "";
    const emailText = emailObj.displayText || cleanEmail(emailVal);
    const cleaned = cleanEmail(emailVal);
    entries.push({
      key: "email",
      href: `mailto:${cleaned}`,
      text: emailText,
      className: "rp-contact-link rp-contact-link-email header-link",
      target: undefined,
    });
  }

  if (hasText(c.phone)) {
    const phoneObj = typeof c.phone === "object" && c.phone !== null ? c.phone : { value: c.phone, displayText: "" };
    const phoneVal = phoneObj.value || "";
    const phoneText = phoneObj.displayText || cleanPhone(phoneVal);
    const cleaned = cleanPhone(phoneVal);
    entries.push({
      key: "phone",
      href: `tel:${formatPhone(phoneVal)}`,
      text: phoneText,
      className: "rp-contact-link rp-contact-link-phone header-link",
      target: undefined,
    });
  }

  if (hasText(c.location)) {
    const locObj = typeof c.location === "object" && c.location !== null ? c.location : { value: c.location, displayText: "" };
    const locVal = locObj.value || "";
    const locText = locObj.displayText || locVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    const isValUrl = /^https?:\/\//i.test(locVal.trim());
    const href = isValUrl ? locVal.trim() : getLocationUrl(locVal);
    entries.push({
      key: "location",
      href: href,
      text: locText,
      className: "rp-contact-link rp-contact-link-location header-link",
      target: "_blank",
    });
  }

  if (hasText(c.linkedIn)) {
    const liObj = typeof c.linkedIn === "object" && c.linkedIn !== null ? c.linkedIn : { value: c.linkedIn, displayText: "" };
    const liVal = liObj.value || "";
    const liText = liObj.displayText?.trim() ? liObj.displayText.trim() : liVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    entries.push({
      key: "linkedin",
      href: getLinkedInUrl(liVal),
      text: liText,
      className: "rp-contact-link rp-contact-link-linkedin header-link",
      target: "_blank",
    });
  }

  if (hasText(c.github)) {
    const ghObj = typeof c.github === "object" && c.github !== null ? c.github : { value: c.github, displayText: "" };
    const ghVal = ghObj.value || "";
    const ghText = ghObj.displayText?.trim() ? ghObj.displayText.trim() : ghVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    entries.push({
      key: "github",
      href: getGithubUrl(ghVal),
      text: ghText,
      className: "rp-contact-link rp-contact-link-github header-link",
      target: "_blank",
    });
  }

  if (hasText(c.website)) {
    const webObj = typeof c.website === "object" && c.website !== null ? c.website : { value: c.website, displayText: "" };
    const webVal = webObj.value || "";
    const webText = webObj.displayText?.trim() ? webObj.displayText.trim() : webVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    entries.push({
      key: "website",
      href: formatUrl(webVal),
      text: webText,
      className: "rp-contact-link rp-contact-link-website header-link",
      target: "_blank",
    });
  }

  if (hasText(c.leetCode)) {
    const lcObj = typeof c.leetCode === "object" && c.leetCode !== null ? c.leetCode : { value: c.leetCode, displayText: "" };
    const lcVal = lcObj.value || "";
    const lcText = lcObj.displayText?.trim() ? lcObj.displayText.trim() : lcVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    entries.push({
      key: "leetcode",
      href: formatUrl(lcVal.includes("leetcode.com") ? lcVal : `leetcode.com/${lcVal}`),
      text: lcText,
      className: "rp-contact-link rp-contact-link-leetcode header-link",
      target: "_blank",
    });
  }

  if (hasText(c.hackerRank)) {
    const hrObj = typeof c.hackerRank === "object" && c.hackerRank !== null ? c.hackerRank : { value: c.hackerRank, displayText: "" };
    const hrVal = hrObj.value || "";
    const hrText = hrObj.displayText?.trim() ? hrObj.displayText.trim() : hrVal.trim().replace(/^(https?:\/\/)?(www\.)?/i, "");
    entries.push({
      key: "hackerrank",
      href: formatUrl(hrVal.includes("hackerrank.com") ? hrVal : `hackerrank.com/${hrVal}`),
      text: hrText,
      className: "rp-contact-link rp-contact-link-hackerrank header-link",
      target: "_blank",
    });
  }

  return entries;
};

const ContactRow = ({ c = {} }) => {
  const entries = buildContactEntries(c);
  if (!entries.length) return null;
  return (
    <div className="rp-contact">
      {entries.map((entry, idx) => (
        <span key={entry.key} className="rp-contact-item">
          {entry.href ? (
            <a
              href={entry.href}
              className={entry.className}
              target={entry.target}
              rel={entry.target === "_blank" ? "noopener noreferrer" : undefined}
              onClick={entry.href.startsWith("mailto:") || entry.href.startsWith("tel:") ? handleContactClick : undefined}
            >
              {entry.text}
            </a>
          ) : (
            <span className={entry.className}>{entry.text}</span>
          )}
          {idx < entries.length - 1 && <span className="rp-contact-sep" aria-hidden="true"> · </span>}
        </span>
      ))}
    </div>
  );
};

const AtsContactRow = ({ c = {} }) => {
  const links = buildContactEntries(c);
  if (!links.length) return null;
  return (
    <div className="rp-ats-contact">
      {links.map((link, idx) => (
        <span key={idx} className="rp-ats-contact-item">
          {link.href ? (
            <a
              href={link.href}
              target={link.target}
              rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
              onClick={link.href.startsWith("mailto:") || link.href.startsWith("tel:") ? handleContactClick : undefined}
              className={link.className}
            >
              {link.text}
            </a>
          ) : (
            link.text
          )}
          {idx < links.length - 1 && <span className="rp-ats-bullet"> | </span>}
        </span>
      ))}
    </div>
  );
};

const SkillBar = ({ name, progress = 0, style }) => {
  if (style === "dots") {
    const filled = Math.round((progress / 100) * 5);
    return (
      <div className="rp-skill-row">
        <span className="rp-skill-name">{name}</span>
        <span className="rp-dots">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < filled ? "dot filled" : "dot"} />
          ))}
        </span>
      </div>
    );
  }
  if (style === "text-only") {
    const level = progress >= 80 ? "Expert" : progress >= 60 ? "Proficient" : progress >= 40 ? "Intermediate" : "Beginner";
    return (
      <div className="rp-skill-row">
        <span className="rp-skill-name">{name}</span>
        <span className="rp-skill-level">{level}</span>
      </div>
    );
  }
  // default: bar
  return (
    <div className="rp-skill-bar-wrap">
      <div className="rp-skill-row"><span className="rp-skill-name">{name}</span><small>{progress}%</small></div>
      <div className="rp-bar"><span style={{ width: `${progress}%` }} /></div>
    </div>
  );
};

const ProgressSection = ({ title, items = [], style, showIcon, dec, templateId, sectionNumber, hasBullets = true }) => {
  if (!items.length) return null;
  const isAts = templateId && templateId.startsWith("ats_");

  if (isAts) {
    if (!hasBullets) {
      const listString = items.map(item => item.name || "").filter(Boolean).join(", ");
      return (
        <section className="rp-section">
          <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
          <div className="rp-ats-skills-list">
            {listString}
          </div>
        </section>
      );
    }

    return (
      <section className="rp-section">
        <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
        <ul className="rp-desc-list">
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: "4px" }}>
              <strong>{item.name || ""}</strong>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-skill-list" : "rp-skill-list";

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {items.map((item, i) => (
          <ItemWrapper key={i} style={hasBullets ? { marginBottom: "6px" } : {}}>
            <SkillBar name={item.name || "Skill"} progress={item.progress} style={style} />
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const highlightText = (text, scanMode) => {
  if (!text) return text;
  const strText = String(text);
  if (!scanMode) return strText;
  const tokens = [];
  let lastIndex = 0;
  const regex = /\b(Optimized|Engineered|Spearheaded|Accelerated|Designed|Developed|Implemented|Architected|Launched|Managed|Delivered|Improved|Reduced|Increased|Created|Led|Executed|Systematized|Streamlined|Formulated|Overhauled)\b|(\b\d+(?:%\b|\b\d*\+?|\s*(?:k|m|b|x)?\b)|\$\d+(?:\.\d+)?\s*(?:[km]illion|[kmb])?)/gi;
  let match;
  while ((match = regex.exec(strText)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];
    if (matchIndex > lastIndex) {
      tokens.push(strText.slice(lastIndex, matchIndex));
    }
    const isVerb = /^(Optimized|Engineered|Spearheaded|Accelerated|Designed|Developed|Implemented|Architected|Launched|Managed|Delivered|Improved|Reduced|Increased|Created|Led|Executed|Systematized|Streamlined|Formulated|Overhauled)$/i.test(matchStr);
    if (isVerb) {
      tokens.push(<span key={matchIndex} className="rp-verb-highlight">{matchStr}</span>);
    } else {
      tokens.push(<span key={matchIndex} className="rp-metric-highlight">{matchStr}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < strText.length) {
    tokens.push(strText.slice(lastIndex));
  }
  return tokens.length ? tokens : strText;
};

// Simple inline markdown bold/italics node parser
const parseMarkdown = (text) => {
  if (!text) return [];
  const strText = String(text);
  const parts = [];
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(strText)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(strText.slice(lastIndex, matchIndex));
    }
    if (match[1]) {
      parts.push(<strong key={matchIndex}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={matchIndex}>{match[4]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < strText.length) {
    parts.push(strText.slice(lastIndex));
  }
  
  return parts.length ? parts : [strText];
};

const linkifyText = (text) => {
  if (!text) return [];
  const strText = String(text);
  const parts = [];
  const regex = /\b(https?:\/\/[^\s$.?#].[^\s]*|www\.[^\s$.?#].[^\s]*|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co|in|info|me|dev)(?:\/[^\s]*)?)\b/gi;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(strText)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];
    if (matchIndex > lastIndex) {
      parts.push(strText.slice(lastIndex, matchIndex));
    }
    let href = matchStr;
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    parts.push(
      <a key={matchIndex} href={href} target="_blank" rel="noopener noreferrer" className="resume-link rp-compact-url">
        {matchStr} <span className="external-link-icon">↗</span>
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < strText.length) {
    parts.push(strText.slice(lastIndex));
  }
  return parts.length ? parts : [strText];
};

const linkifyElements = (elements) => {
  if (!Array.isArray(elements)) return elements;
  return elements.flatMap((el) => {
    if (typeof el === "string") {
      return linkifyText(el);
    }
    if (el && el.props && el.props.children) {
      const newChildren = linkifyElements(
        Array.isArray(el.props.children) ? el.props.children : [el.props.children]
      );
      return { ...el, props: { ...el.props, children: newChildren } };
    }
    return el;
  });
};

// Bolds the user's name case-insensitively
const boldCandidateName = (text, fullName) => {
  if (!text) return [];
  const strText = String(text);
  if (!fullName) return parseMarkdown(strText);
  
  const escaped = String(fullName).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = strText.split(regex);
  
  return parts.flatMap((part, i) => {
    if (regex.test(part)) {
      return [<strong key={`name-${i}`}>{part}</strong>];
    } else {
      return parseMarkdown(part);
    }
  });
};

// Formats descriptions and parses newlines/bullets into semantic list items
const renderDescription = (text, fullName, scanMode) => {
  if (!text) return null;
  const strText = String(text);
  const lines = strText.split('\n').map(l => l.trim()).filter(Boolean);
  const isBulletList = lines.some(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
  
  if (isBulletList || lines.length > 1) {
    return (
      <ul className="rp-desc-list">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '');
          return (
            <li key={idx}>
              {linkifyElements(boldCandidateName(cleanLine, fullName))}
            </li>
          );
        })}
      </ul>
    );
  }
  
  return <span className="rp-desc-text">{linkifyElements(boldCandidateName(strText, fullName))}</span>;
};

const ExperienceSection = ({ items = [], showIcon, dec, isTimeline = false, scanMode = false, sectionNumber, fullName, title = "Experience", hasBullets = true }) => {
  if (!items.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets 
    ? (isTimeline ? "rp-timeline rp-desc-list rp-experience-list" : "rp-desc-list rp-experience-list") 
    : (isTimeline ? "rp-timeline rp-experience-list" : "rp-experience-list");

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {items.map((item, i) => (
          <ItemWrapper key={i} className={isTimeline ? "rp-timeline-item" : "rp-item"}>
            {isTimeline && <div className="rp-timeline-dot" />}
            <div className="rp-item-head">
              <strong>{item.role || "Role"}</strong>
              <span className="rp-compact-title">{formatDateRange(item.startDate, item.endDate)}</span>
            </div>
            <div className="rp-item-sub">
              <span className="rp-compact-title">{item.company}</span>
              {hasText(item.location) && <span className="rp-item-location">{item.location}</span>}
            </div>
            {hasText(item.description) && (
              <div className="rp-item-desc">
                {renderDescription(item.description, fullName, scanMode)}
              </div>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const EducationSection = ({ items = [], showIcon, dec, sectionNumber, fullName, scanMode, hasBullets = true }) => {
  if (!items.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-education-list" : "rp-education-list";

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Education</STitle>
      <Wrapper className={wrapperClass}>
        {items.map((item, i) => (
          <ItemWrapper key={i} className="rp-item" style={hasBullets ? { marginBottom: "6px" } : {}}>
            <div className="rp-item-head">
              <strong>{item.institution || "Institution"}</strong>
              {hasText(item.location) && <span className="rp-item-location">{item.location}</span>}
            </div>
            <div className="rp-item-sub">
              <span className="rp-compact-title">{item.degree || "Degree"}</span>
              <span className="rp-compact-title">{formatDateRange(item.startDate, item.endDate)}</span>
            </div>
            {hasText(item.gpa) && (
              <p className="rp-education-gpa">
                <strong>GPA: </strong>{item.gpa}
              </p>
            )}
            {hasText(item.description) && (
              <div className="rp-item-desc" style={{ marginTop: "4px" }}>
                {renderDescription(item.description, fullName, scanMode)}
              </div>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const ProjectsSection = ({ items = [], showIcon, dec, scanMode = false, sectionNumber, fullName, hasBullets = true }) => {
  if (!items.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-projects-list" : "rp-projects-list";

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Projects</STitle>
      <Wrapper className={wrapperClass}>
        {items.map((item, i) => (
          <ItemWrapper key={i} className="rp-item" style={{ marginBottom: "6px" }}>
            {(() => {
              const titleText = item.title || "Project";
              if (titleText.includes(" | ")) {
                const parts = titleText.split(" | ");
                return (
                  <span className="rp-project-title-wrap">
                    <strong>{parts[0]}</strong>
                    <span className="rp-project-tech-inline" style={{ fontWeight: "normal", fontStyle: "italic" }}>
                      {" | "}{parts.slice(1).join(" | ")}
                    </span>
                  </span>
                );
              }
              return <strong>{titleText}</strong>;
            })()}
            {hasText(item.description) && (
              <div className="rp-item-desc">
                {renderDescription(item.description, fullName, scanMode)}
              </div>
            )}
            {[item.github, item.liveDemo].filter(hasText).length > 0 && (
              <p className="rp-links" style={{ marginTop: "2px" }}>
                {hasText(item.github) && (
                  <a href={getGithubUrl(item.github)} target="_blank" rel="noopener noreferrer" className="resume-link rp-compact-url">
                    Github <span className="external-link-icon">↗</span>
                  </a>
                )}
                {hasText(item.github) && hasText(item.liveDemo) && <span className="rp-links-divider"> · </span>}
                {hasText(item.liveDemo) && (
                  <a href={formatUrl(item.liveDemo)} target="_blank" rel="noopener noreferrer" className="resume-link rp-compact-url">
                    {(() => {
                      const lower = item.liveDemo.toLowerCase();
                      if (lower.includes("docs") || lower.includes("wiki") || lower.includes("documentation")) return "Documentation";
                      if (lower.includes("demo") || lower.includes("app") || lower.includes("dashboard")) return "Live Demo";
                      return "Website";
                    })()} <span className="external-link-icon">↗</span>
                  </a>
                )}
              </p>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const CertsSection = ({ items = [], showIcon, dec, sectionNumber, hasBullets = true }) => {
  if (!items.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-certs-list" : "rp-certs-list";

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Certifications</STitle>
      <Wrapper className={wrapperClass}>
        {items.map((item, i) => (
          <ItemWrapper key={i} style={{ marginBottom: "4px" }}>
            <div className="rp-compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              {hasText(item.certificateUrl) ? (
                <a
                  href={formatUrl(item.certificateUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-link rp-compact-url"
                >
                  {item.title || "Certification"} <span className="external-link-icon">↗</span>
                </a>
              ) : (
                <strong>{item.title || "Certification"}</strong>
              )}
               <span className="rp-compact-title">{[item.issuer, formatPartialDate(item.year)].filter(hasText).join(", ")}</span>
            </div>
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const SummarySection = ({ profileInfo = {}, showIcon, dec, scanMode = false, sectionNumber, fullName }) =>
  hasText(profileInfo.summary) ? (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Summary</STitle>
      <div className="rp-summary" style={{ fontSize: "var(--rp-fs-body)", lineHeight: "var(--rp-lh-body)" }}>
        {renderDescription(profileInfo.summary, fullName, scanMode)}
      </div>
    </section>
  ) : null;

const InterestsSection = ({ items = [], showIcon, dec, sectionNumber, hasBullets = true }) => {
  const filled = (items || []).filter(hasText);
  if (!filled.length) return null;

  if (hasBullets) {
    return (
      <section className="rp-section">
        <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Interests</STitle>
        <ul className="rp-desc-list rp-interests-list">
          {filled.map((t, i) => (
            <li key={i} style={{ marginBottom: "4px" }}>
              {t}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>Interests</STitle>
      <div className="rp-tags">
        {filled.map((t, i) => <span key={i} className="rp-tag">{t}</span>)}
      </div>
    </section>
  );
};

const CustomSection = ({ title, items = [], showIcon, dec, scanMode = false, sectionNumber, fullName, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title) || hasText(item.description));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-custom-list" : "rp-custom-list";

  return (
    <section className="rp-section">
      <STitle showIcon={showIcon} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => (
          <ItemWrapper key={i} className="rp-item" style={{ marginBottom: "6px" }}>
            <div className="rp-item-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              {item.title && renderLinkOrText(item.title, "rp-custom-link", true)}
              {hasText(item.date) && <span className="rp-compact-title">{renderLinkOrText(formatPartialDate(item.date), "rp-custom-link")}</span>}
            </div>
            {hasText(item.subtitle) && <p className="rp-item-sub">{renderLinkOrText(item.subtitle, "rp-custom-link")}</p>}
            {hasText(item.description) && (
              <div className="rp-item-desc">
                {renderDescription(item.description, fullName, scanMode)}
              </div>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const PublicationsSection = ({ title, items = [], fullName, dec, sectionNumber, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-publications-list" : "rp-publications-list";

  return (
    <section className="rp-section">
      <STitle showIcon={false} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => {
          let formattedUrl = "";
          if (item.paperUrl) {
            const trimmed = item.paperUrl.trim();
            if (trimmed) {
              formattedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
            }
          }

          return (
            <ItemWrapper key={i} className="rp-citation-item" style={{ marginBottom: "12px", pageBreakInside: "avoid", breakInside: "avoid" }}>
              <div className="rp-citation-content" style={{ display: "block", width: "100%", verticalAlign: "top" }}>
                {/* 1. Publication Title */}
                <div className="rp-publication-title" style={{ fontWeight: "bold" }}>
                  {boldCandidateName(item.title, fullName)}
                </div>
                
                {/* 2. Journal / Conference / Publisher • Date */}
                {(hasText(item.subtitle) || hasText(item.date)) && (
                  <div className="rp-publication-meta" style={{ fontSize: "var(--rp-fs-meta)", color: "var(--rp-meta-color, #666)", marginTop: "2px" }}>
                    {item.subtitle}{item.subtitle && item.date && " • "}{formatPartialDate(item.date)}
                  </div>
                )}

                {/* 3. Authors */}
                {hasText(item.authors) && (
                  <div className="rp-publication-authors" style={{ fontSize: "var(--rp-fs-meta)", marginTop: "2px" }}>
                    {boldCandidateName(item.authors, fullName)}
                  </div>
                )}

                {/* 4. Abstract — falls back to description if abstract field is absent (custom section schema) */}
                {(hasText(item.abstract) || hasText(item.description)) && (
                  <div className="rp-publication-abstract" style={{ fontSize: "var(--rp-fs-body)", color: "var(--rp-body-color, #333)", marginTop: "4px" }}>
                    {renderDescription(item.abstract || item.description, fullName)}
                  </div>
                )}

                {/* 5. Paper URL */}
                {formattedUrl && (
                  <div className="rp-publication-url" style={{ fontSize: "var(--rp-fs-meta)", marginTop: "4px" }}>
                    <a href={formattedUrl} target="_blank" rel="noopener noreferrer" className="resume-link rp-compact-url">
                      Paper Link <span className="external-link-icon">↗</span>
                    </a>
                  </div>
                )}
              </div>
            </ItemWrapper>
          );
        })}
      </Wrapper>
    </section>
  );
};

const PatentsSection = ({ title, items = [], fullName, dec, sectionNumber, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-patents-list" : "rp-patents-list";

  return (
    <section className="rp-section">
      <STitle showIcon={false} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => (
          <ItemWrapper key={i} className="rp-citation-item" style={{ marginBottom: "8px", pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div className="rp-citation-content" style={{ display: "block", width: "100%", verticalAlign: "top" }}>
              {item.subtitle && <span className="rp-citation-prefix">[{item.subtitle}] </span>}
              <strong className="rp-citation-title">
                {boldCandidateName(item.title, fullName)}
              </strong>
              {hasText(item.date) && <span className="rp-citation-date"> ({formatPartialDate(item.date)})</span>}
              {hasText(item.description) && (
                <div className="rp-citation-authors" style={{ marginTop: "2px", fontSize: "var(--rp-fs-meta)", color: "#555" }}>
                  {renderDescription(item.description, fullName)}
                </div>
              )}
            </div>
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};

const AwardsSection = ({ title, items = [], dec, sectionNumber, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-awards-list" : "rp-awards-list";

  return (
    <section className="rp-section">
      <STitle showIcon={false} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => (
          <ItemWrapper key={i} className="rp-item" style={{ marginBottom: "6px" }}>
            <div className="rp-item-head">
              <strong>{item.title}</strong>
              {hasText(item.date) && <span className="rp-compact-title">{formatPartialDate(item.date)}</span>}
            </div>
            {hasText(item.subtitle) && (
              <div className="rp-item-sub"><span className="rp-compact-title">{item.subtitle}</span></div>
            )}
            {hasText(item.description) && (
              <div className="rp-item-desc">
                {renderDescription(item.description, undefined)}
              </div>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};


const TechnicalProfilesSection = ({ title, items = [], dec, sectionNumber, fullName, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-tech-profiles-list" : "rp-tech-profiles-list";

  return (
    <section className="rp-section">
      <STitle showIcon={false} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => {
          const url = item.date ? formatUrl(item.date) : "";
          const hasUrl = hasText(url);
          const platformName = String(item.title);
          return (
            <ItemWrapper key={i} className="rp-compact-item" style={{ marginBottom: "6px" }}>
              <div className="rp-compact-head rp-tech-profile-head">
                <span className="rp-compact-title">
                  {hasUrl ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-link rp-compact-url"
                    >
                      {platformName} <span className="external-link-icon">↗</span>
                    </a>
                  ) : (
                    <strong>{platformName}</strong>
                  )}
                </span>
                {item.date && !isUrl(item.date) && (
                  <span className="rp-compact-date">
                    {formatPartialDate(item.date)}
                  </span>
                )}
              </div>
              {hasText(item.description) && (
                <div className="rp-item-desc" style={{ marginTop: "2px" }}>
                  {renderDescription(item.description, fullName)}
                </div>
              )}
            </ItemWrapper>
          );
        })}
      </Wrapper>
    </section>
  );
};

const MembershipsSection = ({ title, items = [], dec, sectionNumber, fullName, hasBullets = true }) => {
  const filled = (items || []).filter(item => hasText(item.title));
  if (!filled.length) return null;
  const Wrapper = hasBullets ? "ul" : "div";
  const ItemWrapper = hasBullets ? "li" : "div";
  const wrapperClass = hasBullets ? "rp-desc-list rp-memberships-list" : "rp-memberships-list";

  return (
    <section className="rp-section">
      <STitle showIcon={false} dec={dec} sectionNumber={sectionNumber}>{title}</STitle>
      <Wrapper className={wrapperClass}>
        {filled.map((item, i) => (
          <ItemWrapper key={i} className="rp-compact-item" style={{ marginBottom: "6px" }}>
            <div className="rp-compact-head rp-tech-profile-head">
              <span className="rp-compact-title">
                {item.title && renderLinkOrText(item.title, "rp-custom-link", true)}
                {item.subtitle && (
                  <>
                    <span className="rp-compact-title">: </span>
                    {renderLinkOrText(item.subtitle, "rp-custom-link")}
                  </>
                )}
              </span>
              {item.date && (
                <span className="rp-compact-date">
                  {renderLinkOrText(formatPartialDate(item.date), "rp-custom-link")}
                </span>
              )}
            </div>
            {hasText(item.description) && (
              <div className="rp-item-desc" style={{ marginTop: "2px" }}>
                {renderDescription(item.description, fullName)}
              </div>
            )}
          </ItemWrapper>
        ))}
      </Wrapper>
    </section>
  );
};


const Photo = ({ src, shape = "circle" }) =>
  src ? <img src={src} alt="Profile" className={`rp-photo rp-photo-${shape}`} /> : null;

// Renders a target role with a visible "Seeking:" semantic label so recruiters
// cannot confuse it with the candidate's current designation.
const TargetRoleBadge = ({ role, badgeClass = "rp-target-role-badge" }) => {
  if (!role) return null;
  return (
    <div className={badgeClass}>
      <span className="rp-role-seeking-label" aria-label="Seeking:">Seeking: </span>
      {role}
    </div>
  );
};


// ─── Main ResumePreview ───────────────────────────────────────────────────────
const ResumePreview = ({ resume = {}, isFreePlan = false }) => {
  const templateId = resume.template || "template1";
  const dec = normalizeDecoratives(resume.decoratives || {});
  const accent = dec.accentColor || getDefaultAccent(templateId);
  const accentText = getAccentTextColors(accent);
  const accentReadable = getReadableAccent(accent);
  const photoShape = dec.photoShape || "circle";
  const progressStyle = dec.progressStyle || "bar";
  const showIcons = false;
  const pageBorder = dec.pageBorder === "true";
  const profileInfo = resume.profileInfo || {};
  const contactInfo = resume.contactInfo || {};
  const photo = profileInfo.ProfilePreviewUrl || profileInfo.profilePreviewUrl || "";

  // Load template's default fonts
  useEffect(() => { loadTemplateFont(templateId); }, [templateId]);

  // Load custom font pairing stylesheet if selected
  useEffect(() => {
    if (resume.fontPairing) {
      const FONT_URLS = {
        sora: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap",
        playfair: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Lato:wght@300;400;700&display=swap",
        outfit: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap",
        cormorant: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500&display=swap",
        spacegrotesk: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
        raleway: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&family=Nunito+Sans:wght@300;400;600&display=swap",
        jakarta: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Figtree:wght@300;400;500&display=swap",
        ibmplex: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap",
        bodoni: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400&family=Mulish:wght@300;400;500;600&display=swap",
        nunito: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Open+Sans:wght@300;400;500&display=swap",
        fraunces: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;1,400&family=Manrope:wght@300;400;500;600&display=swap",
        sourcecode: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&family=Source+Sans+3:wght@300;400;600&display=swap",
        tinos: "https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap",
        lora: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
      };
      const url = FONT_URLS[resume.fontPairing];
      if (url) {
        const id = `font-pick-${resume.fontPairing}`;
        let existing = document.getElementById(id);
        if (!existing) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = url;
          document.head.appendChild(link);
        }
      }
    }
  }, [resume.fontPairing]);

  // If a Pro user picked a custom font, override the template's default.
  // We build the font vars from the FONT_OPTIONS in the editor — same data source.
  let fontVars = getFontVars(templateId);
  if (resume.fontPairing && resume.fontPairing !== 'inter') {
    // Map the fontPairing ID back to CSS font families
    const FONT_OVERRIDE_MAP = {
      sora:        { heading: "'Sora', sans-serif",             body: "'Inter', sans-serif" },
      playfair:    { heading: "'Playfair Display', serif",      body: "'Lato', sans-serif" },
      outfit:      { heading: "'Outfit', sans-serif",           body: "'DM Sans', sans-serif" },
      cormorant:   { heading: "'Cormorant Garamond', serif",    body: "'Jost', sans-serif" },
      spacegrotesk:{ heading: "'Space Grotesk', sans-serif",    body: "'Inter', sans-serif" },
      raleway:     { heading: "'Raleway', sans-serif",          body: "'Nunito Sans', sans-serif" },
      jakarta:     { heading: "'Plus Jakarta Sans', sans-serif",body: "'Figtree', sans-serif" },
      ibmplex:     { heading: "'IBM Plex Sans', sans-serif",    body: "'IBM Plex Sans', sans-serif" },
      bodoni:      { heading: "'Bodoni Moda', serif",           body: "'Mulish', sans-serif" },
      nunito:      { heading: "'Nunito', sans-serif",           body: "'Open Sans', sans-serif" },
      fraunces:    { heading: "'Fraunces', serif",              body: "'Manrope', sans-serif" },
      sourcecode:  { heading: "'Source Code Pro', monospace",   body: "'Source Sans 3', sans-serif" },
      tinos:       { heading: "'Tinos', 'Times New Roman', Times, serif", body: "'Tinos', 'Times New Roman', Times, serif" },
      lora:        { heading: "'Lora', Georgia, serif",          body: "'Lora', Georgia, serif" },
    };
    const override = FONT_OVERRIDE_MAP[resume.fontPairing];
    if (override) {
      fontVars = { ...fontVars, "--rp-font-heading": override.heading, "--rp-font-body": override.body };
    }
  }

  const scanMode = false;
  const commonProps = { showIcon: showIcons, dec, scanMode, templateId, fullName: resume.profileInfo?.fullName };

  // Parse Section Order
  const isFresher = (res) => {
    if (res?.decoratives?.fresherMode === "true") return true;
    if (res?.decoratives?.fresherMode === "false") return false;
    return (res?.workExperience || []).length === 0;
  };
  const fresher = isFresher(resume);

  let order = dec.sectionOrder ? dec.sectionOrder.split(",") : null;
  if (!order) {
    if (fresher) {
      order = ["summary", "education", "skills", "projects", "internships", "certifications"];
    } else {
      order = ["summary", "experience", "skills", "projects", "education", "certifications"];
    }
  }

  // Add optional/custom sections to the order if they are not already present
  const allPossibleOptionalIds = [
    "experience", "internships", "languages", "interests",
    "achievements", "publications", "volunteering", "leadership", "hackathons", 
    "openSource", "awards", "workshops", "coursework", 
    "technicalProfiles", "extracurriculars", "patents", "researchExperience"
  ];
  allPossibleOptionalIds.forEach(id => {
    if (!order.includes(id)) {
      order.push(id);
    }
  });

  // Parse Section Visibility
  const visibility = {
    summary: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true
  };
  if (dec.sectionVisibility) {
    try {
      Object.assign(visibility, JSON.parse(dec.sectionVisibility));
    } catch (e) {}
  }
  // Optional sections are visible only if explicitly enabled
  allPossibleOptionalIds.forEach(id => {
    if (visibility[id] === undefined) {
      if (id === "internships" && fresher) {
        visibility[id] = true;
      } else if (id === "experience" && !fresher) {
        visibility[id] = true;
      } else {
        visibility[id] = false; // default off for optional sections
      }
    }
  });

  // Helper inside ResumePreview to build content based on columns
  const getSections = (columnType) => {
    return renderSectionsForColumn(columnType, order, visibility, resume, commonProps, templateId === "premium1");
  };

  return (
    <article
      id="resume-preview"
      className={`resume-preview rp-${templateId} ${scanMode ? "rp-scan-mode-active" : ""} ${dec.highDensity === "true" ? "rp-high-density" : ""}`}
      style={{
        "--accent": accent,
        "--accent-readable": accentReadable,
        "--on-accent": accentText.primary,
        "--on-accent-muted": accentText.muted,
        "--on-accent-soft": accentText.soft,
        "--on-accent-line": accentText.line,
        "--header-link-color": (dec.headerStyle === "card" || dec.headerStyle === "minimal" || !dec.headerStyle) ? accentReadable : (accentText.primary === "#ffffff" ? "#ffffff" : accentReadable),
        "--header-link-hover": (dec.headerStyle === "card" || dec.headerStyle === "minimal" || !dec.headerStyle) ? accent : (accentText.primary === "#ffffff" ? accentText.muted : accent),
        "--page-border": pageBorder ? `1px solid ${accent}` : "none",
        ...fontVars,
      }}
      data-template={templateId}
      data-hstyle={dec.headerStyle || "minimal"}
      data-bullet={dec.bulletStyle || "disc"}
      data-lstyle={dec.linkStyle || "standard"}
    >
      {renderTemplate({
        templateId,
        profileInfo,
        contactInfo,
        photo,
        photoShape,
        getSections,
        dec,
        commonProps,
        resume,
        progressStyle
      })}

      {scanMode && (
        <>
          <svg className="rp-scan-mode-overlay-svg" viewBox="0 0 816 1056" preserveAspectRatio="none">
            <path
              d="M 50 120 L 750 120 M 50 120 L 50 450 L 550 450 M 50 450 L 50 900"
              fill="none"
              stroke={accentReadable}
              strokeWidth="2.5"
              strokeDasharray="6,6"
              opacity="0.45"
            />
          </svg>
          <div className="rp-scan-landmark" style={{ top: "113px", left: "43px" }} />
          <div className="rp-scan-landmark" style={{ top: "113px", left: "743px" }} />
          <div className="rp-scan-landmark" style={{ top: "443px", left: "43px" }} />
          <div className="rp-scan-landmark" style={{ top: "443px", left: "543px" }} />
          <div className="rp-scan-landmark" style={{ top: "893px", left: "43px" }} />
        </>
      )}

      {isFreePlan && (
        <div className="watermark-footer" aria-hidden="true">
          Made with VRESIQ
        </div>
      )}

    </article>
  );
};

// Helper to check if a section actually has renderable content
const hasSectionContent = (sectionId, resume) => {
  const hasText = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "object") {
      return String(v.value || "").trim().length > 0;
    }
    return String(v || "").trim().length > 0;
  };
  switch (sectionId) {
    case "summary":
      return hasText(resume.profileInfo?.summary);
    case "experience":
      return (resume.workExperience || []).length > 0;
    case "education":
      return (resume.education || []).length > 0;
    case "skills":
      return (resume.skills || []).length > 0;
    case "projects":
      return (resume.projects || []).length > 0;
    case "certifications":
      return (resume.certifications || []).length > 0;
    case "interests":
      return (resume.interests || []).filter(hasText).length > 0;
    case "languages":
      return (resume.languages || []).length > 0;
    default:
      // Custom or Optional section
      const customItems = resume.customSections?.[sectionId] || [];
      return customItems.filter(item => hasText(item.title) || hasText(item.description)).length > 0;
  }
};

// Helper to dynamically render sections based on layout and custom choices
const renderSectionsForColumn = (columnType, order, visibility, resume, commonProps, isTimeline) => {
  let bulletConfig = {};
  try {
    bulletConfig = JSON.parse(resume.decoratives?.sectionBullets || "{}");
  } catch (e) {
    console.error("Failed to parse sectionBullets:", e);
  }

  const activeSections = (order || []).filter(s => visibility[s] !== false && hasSectionContent(s, resume));
  const sidebarSectionIds = ['skills', 'languages', 'interests', 'technicalProfiles'];
  const isSidebarId = (id) => sidebarSectionIds.includes(id);

  const filteredOrder = activeSections.filter(id => {
    if (columnType === 'all') return true;
    if (columnType === 'sidebar') return isSidebarId(id);
    return !isSidebarId(id);
  });

  const getSectionLabel = (id) => {
    const labels = {
      summary: "Summary",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      projects: "Projects",
      certifications: "Certifications",
      languages: "Languages",
      interests: "Interests",
      achievements: "Achievements",
      publications: "Publications",
      volunteering: "Volunteering",
      leadership: "Leadership",
      hackathons: "Hackathons",
      openSource: "Open Source Contributions",
      awards: "Awards",
      internships: "Internships",
      workshops: "Workshops",
      coursework: "Coursework",
      extracurriculars: "Extracurricular Activities",
      technicalProfiles: "Technical Profiles",
      patents: "Patents",
      researchExperience: "Research Experience"
    };
    return labels[id] || id;
  };

  return filteredOrder.map(sectionId => {
    const sectionIndex = activeSections.indexOf(sectionId);
    const sectionNumber = sectionIndex !== -1 ? String(sectionIndex + 1).padStart(2, '0') : "";
    const propsWithNum = { ...commonProps, sectionNumber };

    switch (sectionId) {
      case "summary":
        return <SummarySection key="summary" profileInfo={resume.profileInfo || {}} {...propsWithNum} />;
      case "experience":
        return <ExperienceSection key="experience" items={resume.workExperience || []} {...propsWithNum} isTimeline={isTimeline} hasBullets={bulletConfig.experience !== false} />;
      case "education":
        return <EducationSection key="education" items={resume.education || []} {...propsWithNum} hasBullets={bulletConfig.education !== false} />;
      case "skills":
        return <ProgressSection key="skills" title="Skills" items={resume.skills || []} style={commonProps.dec.progressStyle} {...propsWithNum} hasBullets={bulletConfig.skills !== false} />;
      case "projects":
        return <ProjectsSection key="projects" items={resume.projects || []} {...propsWithNum} hasBullets={bulletConfig.projects !== false} />;
      case "certifications":
        return <CertsSection key="certifications" items={resume.certifications || []} {...propsWithNum} hasBullets={bulletConfig.certifications !== false} />;
      case "interests":
        return <InterestsSection key="interests" items={resume.interests || []} {...propsWithNum} hasBullets={bulletConfig.interests !== false} />;
      case "languages":
        return <ProgressSection key="languages" title="Languages" items={resume.languages || []} style={commonProps.dec.progressStyle} {...propsWithNum} hasBullets={bulletConfig.languages !== false} />;
      default:
        // Custom or Optional section
        const customItems = resume.customSections?.[sectionId] || [];
        const hasBullets = bulletConfig[sectionId] !== false;
        if (sectionId === "publications") {
          return <PublicationsSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
        }
        if (sectionId === "patents") {
          return <PatentsSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
        }
        if (sectionId === "awards" || sectionId === "achievements") {
          return <AwardsSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
        }
        if (sectionId === "technicalProfiles") {
          return <TechnicalProfilesSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
        }
        if (sectionId === "memberships" || sectionId === "coursework" || sectionId === "extracurriculars") {
          return <MembershipsSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
        }

        return <CustomSection key={sectionId} title={getSectionLabel(sectionId)} items={customItems} {...propsWithNum} hasBullets={hasBullets} />;
    }
  });
};

// ─── Template Renderers ───────────────────────────────────────────────────────
function renderTemplate({ templateId, profileInfo, contactInfo, photo, photoShape, getSections, dec, commonProps, resume, progressStyle }) {
  const name = profileInfo.fullName || "Your Name";
  const role = profileInfo.designation || "Role or Designation";

  switch (templateId) {

    // ── template1: Classic ─────────────────────────────────────────────────
    case "template1":
      return (
        <>
          <header className="rp-header rp-header-classic">
            <Photo src={photo} shape={photoShape} />
            <div className="rp-header-text">
              <h1>{name}</h1>
              <p className="rp-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <div className="rp-contact rp-contact-inline">
                <ContactRow c={contactInfo} />
              </div>
            </div>
          </header>
          <main className="rp-body">{getSections('all')}</main>
        </>
      );

    // ── template2: Sidebar ─────────────────────────────────────────────────
    case "template2":
      return (
        <div className="rp-layout-sidebar">
          <aside className="rp-sidebar rp-sidebar-light">
            <div className="rp-sidebar-header">
              <Photo src={photo} shape={photoShape} />
              <h1 className="rp-sidebar-name">{name}</h1>
              <p className="rp-sidebar-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <div className="rp-sidebar-contact"><ContactRow c={contactInfo} /></div>
            </div>
            {getSections('sidebar')}
          </aside>
          <main className="rp-main-col">{getSections('main')}</main>
        </div>
      );

    // ── template3: Header ──────────────────────────────────────────────────
    case "template3":
      return (
        <>
          <header className="rp-header rp-header-bleed">
            <Photo src={photo} shape={photoShape} />
            <div>
              <h1>{name}</h1>
              <p className="rp-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <ContactRow c={contactInfo} />
            </div>
          </header>
          <main className="rp-body">{getSections('all')}</main>
        </>
      );

    // ── premium1: Timeline ─────────────────────────────────────────────────
    case "premium1":
      return (
        <>
          <header className="rp-header rp-header-classic">
            <Photo src={photo} shape={photoShape} />
            <div>
              <h1>{name}</h1>
              <p className="rp-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <ContactRow c={contactInfo} />
            </div>
          </header>
          <main className="rp-body">
            {getSections('all')}
          </main>
        </>
      );

    // ── premium2: Executive ────────────────────────────────────────────────
    case "premium2":
      return (
        <>
          <header className="rp-header rp-header-executive">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-executive-name">{name}</h1>
            <p className="rp-executive-role">{role}</p>
            {profileInfo.targetRole && <div className="rp-target-role-badge">{profileInfo.targetRole}</div>}
            <hr className="rp-rule" />
            <ContactRow c={contactInfo} />
          </header>
          <main className="rp-body">{getSections('all')}</main>
        </>
      );

    // ── premium3: Compact ──────────────────────────────────────────────────
    case "premium3":
      return (
        <>
          <header className="rp-header rp-header-compact">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Photo src={photo} shape={photoShape} />
              <div>
                <h1>{name}</h1>
                <p className="rp-role">{role}</p>
                <TargetRoleBadge role={profileInfo.targetRole} />
              </div>
            </div>
            <ContactRow c={contactInfo} />
          </header>
          <div className="rp-layout-twocol rp-compact-grid">
            <main className="rp-main-col">
              {getSections('main')}
            </main>
            <aside className="rp-aside-col">
              {getSections('sidebar')}
            </aside>
          </div>
        </>
      );

    // ── premium4: Minimal ("Signature" redesign) ──────────────────────────
    case "premium4":
      return (
        <>
          <header className="rp-header rp-header-sig">
            <div className="rp-sig-left">
              <h1 className="rp-sig-name">{name}</h1>
              <p className="rp-sig-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <div className="rp-sig-rule" />
            </div>
            <div className="rp-sig-right">
              <Photo src={photo} shape={photoShape} />
              <div className="rp-sig-contact"><ContactRow c={contactInfo} /></div>
            </div>
          </header>
          <main className="rp-body rp-sig-body">{getSections('all')}</main>
        </>
      );

    // ── premium5: Accent Lines ─────────────────────────────────────────────
    case "premium5":
      return (
        <>
          <header className="rp-header rp-header-accentbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '8px' }}>
              <Photo src={photo} shape={photoShape} />
              <div className="rp-accentbar-name-block">
                <h1>{name}</h1>
                <p className="rp-role">{role}</p>
                <TargetRoleBadge role={profileInfo.targetRole} />
              </div>
            </div>
            <ContactRow c={contactInfo} />
          </header>
          <main className="rp-body rp-accentlines">{getSections('all')}</main>
        </>
      );

    // ── premium6: Split Dark ───────────────────────────────────────────────
    case "premium6":
      return (
        <div className="rp-layout-sidebar rp-sidebar-dark-layout">
          <aside className="rp-sidebar rp-sidebar-dark">
            <div className="rp-sidebar-header">
              <Photo src={photo} shape={photoShape} />
              <h1 className="rp-sidebar-name">{name}</h1>
              <p className="rp-sidebar-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <div className="rp-sidebar-contact"><ContactRow c={contactInfo} /></div>
            </div>
            {getSections('sidebar')}
          </aside>
          <main className="rp-main-col">{getSections('main')}</main>
        </div>
      );

    // ── premium7: Card Sections ────────────────────────────────────────────
    case "premium7":
      return (
        <>
          <header className="rp-header rp-header-classic">
            <Photo src={photo} shape={photoShape} />
            <div>
              <h1>{name}</h1>
              <p className="rp-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <ContactRow c={contactInfo} />
            </div>
          </header>
          <main className="rp-body rp-card-sections">{getSections('all')}</main>
        </>
      );

    // ── premium8: Infographic ──────────────────────────────────────────────
    case "premium8":
      return (
        <div className="rp-layout-sidebar">
          <aside className="rp-sidebar rp-sidebar-infographic">
            <div className="rp-sidebar-header">
              <Photo src={photo} shape={photoShape} />
              <h1 className="rp-sidebar-name">{name}</h1>
              <p className="rp-sidebar-role">{role}</p>
              <TargetRoleBadge role={profileInfo.targetRole} />
              <div className="rp-sidebar-contact"><ContactRow c={contactInfo} /></div>
            </div>
            {getSections('sidebar')}
          </aside>
          <main className="rp-main-col">
            {getSections('main')}
          </main>
        </div>
      );

    // ── premium9: Centered ─────────────────────────────────────────────────
    case "premium9":
      return (
        <>
          <header className="rp-header rp-header-centered">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-centered-name">{name}</h1>
            <p className="rp-centered-role">{role}</p>
            {profileInfo.targetRole && <div className="rp-target-role-badge">{profileInfo.targetRole}</div>}
            <ContactRow c={contactInfo} />
          </header>
          <main className="rp-body">{getSections('all')}</main>
        </>
      );

    // ── premium10: Tech ────────────────────────────────────────────────────
    case "premium10":
      return (
        <>
          <header className="rp-header rp-header-tech">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Photo src={photo} shape={photoShape} />
              <div className="rp-tech-name-block">
                <h1>{name}</h1>
                <p className="rp-role rp-mono">{role}</p>
                <TargetRoleBadge role={profileInfo.targetRole} />
              </div>
            </div>
            <div className="rp-tech-contact rp-mono"><ContactRow c={contactInfo} /></div>
          </header>
          <main className="rp-body rp-tech-body">{getSections('all')}</main>
        </>
      );

    // ── ats_classic ────────────────────────────────────────────────────────
    case "ats_classic":
      return (
        <div className="rp-ats-container rp-ats-classic">
          <header className="rp-ats-header">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── ats_entry ──────────────────────────────────────────────────────────
    case "ats_entry":
      return (
        <div className="rp-ats-container rp-ats-entry">
          <header className="rp-ats-header-left">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role-left">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge-left" />
            <AtsContactRow c={contactInfo} />
          </header>
          <div className="rp-layout-twocol rp-ats-twocol">
            <main className="rp-main-col rp-ats-body">{getSections('main')}</main>
            <aside className="rp-aside-col rp-ats-body">{getSections('sidebar')}</aside>
          </div>
        </div>
      );

    // ── ats_senior ─────────────────────────────────────────────────────────
    case "ats_senior":
      return (
        <div className="rp-ats-container rp-ats-senior">
          <header className="rp-ats-header">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name-serif">{name}</h1>
            {role && <p className="rp-ats-role-serif">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── ats_lead ───────────────────────────────────────────────────────────
    case "ats_lead":
      return (
        <div className="rp-ats-container rp-ats-lead">
          <header className="rp-ats-header-left">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role-left">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge-left" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">
            {getSections('all')}
          </main>
        </div>
      );

    // ── ats_intern ─────────────────────────────────────────────────────────
    case "ats_intern":
      return (
        <div className="rp-ats-container rp-ats-intern">
          <header className="rp-ats-header">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── ats_experienced ────────────────────────────────────────────────────
    case "ats_experienced":
      return (
        <div className="rp-ats-container rp-ats-experienced">
          <header className="rp-ats-header-left">
            <Photo src={photo} shape={photoShape} />
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role-left">{role}</p>}
            {profileInfo.targetRole && <div className="rp-ats-badge-left">{profileInfo.targetRole}</div>}
            <AtsContactRow c={contactInfo} />
          </header>
          <div className="rp-layout-twocol rp-ats-twocol-alt">
            <aside className="rp-aside-col rp-ats-body">{getSections('sidebar')}</aside>
            <main className="rp-main-col rp-ats-body">{getSections('main')}</main>
          </div>
        </div>
      );

    // ── academic_cv ────────────────────────────────────────────────────────
    case "academic_cv":
      return (
        <div className="rp-ats-container rp-academic_cv">
          <header className="rp-academic-header">
            <h1 className="rp-academic-name">{name}</h1>
            {role && <p className="rp-academic-role">{role}</p>}
            {profileInfo.targetRole && <div className="rp-academic-badge">{profileInfo.targetRole}</div>}
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-academic-body">{getSections('all')}</main>
        </div>
      );

    // ── consulting_bcg: McKinsey/Bain/BCG Consulting Style ─────────────────
    case "consulting_bcg":
      return (
        <div className="rp-ats-container rp-consulting-bcg">
          <header className="rp-ats-header">
            <h1 className="rp-ats-name-serif">{name}</h1>
            {role && <p className="rp-ats-role-serif">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── tech_faang: FAANG/Tech Professional ───────────────────────────────
    case "tech_faang":
      return (
        <div className="rp-ats-container rp-tech-faang">
          <header className="rp-ats-header-left">
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role-left">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge-left" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── harvard_ats: Harvard-Inspired ATS ──────────────────────────────────
    case "harvard_ats":
      return (
        <div className="rp-ats-container rp-harvard-ats">
          <header className="rp-ats-header">
            <h1 className="rp-ats-name-serif">{name}</h1>
            {role && <p className="rp-ats-role-serif">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge" />
            <AtsContactRow c={contactInfo} />
          </header>
          <hr className="rp-rule" />
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    // ── swiss_minimal: Minimal Swiss Professional ─────────────────────────
    case "swiss_minimal":
      return (
        <div className="rp-ats-container rp-swiss-minimal">
          <header className="rp-ats-header-left">
            <h1 className="rp-ats-name">{name}</h1>
            {role && <p className="rp-ats-role-left">{role}</p>}
            <TargetRoleBadge role={profileInfo.targetRole} badgeClass="rp-ats-badge-left" />
            <AtsContactRow c={contactInfo} />
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );

    case "engineer_ats": {
      const getDisplayVal = (obj) => {
        if (!obj) return "";
        if (typeof obj === "object") return obj.displayText || obj.value || "";
        return obj;
      };
      
      const emailText = getDisplayVal(contactInfo.email);
      const phoneText = getDisplayVal(contactInfo.phone);
      const linkedinText = getDisplayVal(contactInfo.linkedIn);
      const githubText = getDisplayVal(contactInfo.github);
      
      return (
        <div className="rp-ats-container rp-engineer-ats">
          <header className="rp-engineer-header">
            <h1 className="rp-engineer-name">{name}</h1>
            <div className="rp-engineer-contacts-grid">
              <div className="rp-engineer-contacts-left">
                {linkedinText && (
                  <div className="rp-engineer-contact-item">
                    <strong>LinkedIn:</strong> <a href={contactInfo.linkedIn?.value || contactInfo.linkedIn} target="_blank" rel="noopener noreferrer">{linkedinText.replace(/^(https?:\/\/)?(www\.)?/i, "")}</a>
                  </div>
                )}
                {githubText && (
                  <div className="rp-engineer-contact-item">
                    <strong>GitHub:</strong> <a href={contactInfo.github?.value || contactInfo.github} target="_blank" rel="noopener noreferrer">{githubText.replace(/^(https?:\/\/)?(www\.)?/i, "")}</a>
                  </div>
                )}
              </div>
              <div className="rp-engineer-contacts-right">
                {emailText && (
                  <div className="rp-engineer-contact-item">
                    <strong>Email:</strong> <a href={`mailto:${emailText}`}>{emailText}</a>
                  </div>
                )}
                {phoneText && (
                  <div className="rp-engineer-contact-item">
                    <strong>Mobile:</strong> <a href={`tel:${phoneText}`}>{phoneText}</a>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="rp-ats-body">{getSections('all')}</main>
        </div>
      );
    }

    default:
      return <p>Unknown template</p>;
  }
}

// ─── Default accent colors per template ──────────────────────────────────────
function getDefaultAccent(templateId) {
  const map = {
    template1: "#111410",
    template2: "#2d6a4f",
    template3: "#1d3557",
    premium1:  "#3a7d44",
    premium2:  "#5c4033",
    premium3:  "#0d3b66",
    premium4:  "#222222",
    premium5:  "#c1121f",
    premium6:  "#14213d",
    premium7:  "#7b2d8b",
    premium8:  "#e76f51",
    premium9:  "#2c6e49",
    premium10: "#1b4332",
    ats_classic: "#111111",
    ats_entry: "#111111",
    ats_senior: "#111111",
    ats_lead: "#111111",
    ats_intern: "#111111",
    ats_experienced: "#111111",
    consulting_bcg: "#000000",
    tech_faang: "#1a5fb4",
    harvard_ats: "#000000",
    swiss_minimal: "#2b2b2b",
    engineer_ats: "#111111",
  };
  return map[templateId] || "#111111";
}

function getAccentTextColors(hex) {
  const fallback = onAccentPalette("light");
  if (!hex || typeof hex !== "string") return fallback;

  const rgb = parseHex(hex);
  if (!rgb) return fallback;

  const whiteContrast = contrastRatio(rgb, [255, 255, 255]);
  const darkContrast = contrastRatio(rgb, [17, 20, 16]);
  return darkContrast >= whiteContrast
    ? onAccentPalette("dark")
    : onAccentPalette("light");
}

function getReadableAccent(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return "#111410";
  if (contrastRatio(rgb, [255, 255, 255]) >= 4.5) return hex;

  let mixed = rgb;
  for (let i = 1; i <= 8; i += 1) {
    mixed = mixRgb(rgb, [17, 20, 16], i / 10);
    if (contrastRatio(mixed, [255, 255, 255]) >= 4.5) {
      return rgbToHex(mixed);
    }
  }
  return "#111410";
}

function parseHex(hex) {
  let clean = String(hex || "").trim().replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((char) => char + char).join("");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb) {
  const linear = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixRgb(a, b, amount) {
  return a.map((value, index) => Math.round(value * (1 - amount) + b[index] * amount));
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function onAccentPalette(mode) {
  return mode === "dark"
    ? {
        primary: "#111410",
        muted: "rgba(17,20,16,0.78)",
        soft: "rgba(17,20,16,0.62)",
        line: "rgba(17,20,16,0.28)",
      }
    : {
        primary: "#ffffff",
        muted: "rgba(255,255,255,0.82)",
        soft: "rgba(255,255,255,0.68)",
        line: "rgba(255,255,255,0.38)",
      };
}

function normalizeDecoratives(raw = {}) {
  const next = { ...raw };
  next.dividerStyle = next.dividerStyle || "line";
  next.headerStyle = next.headerStyle || "minimal";
  next.photoShape = next.photoShape || "circle";
  next.progressStyle = next.progressStyle || "bar";
  if (!next.accentColor || typeof next.accentColor !== "string") delete next.accentColor;
  return next;
}

export default ResumePreview;

