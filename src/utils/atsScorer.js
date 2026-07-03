/**
 * atsScorer.js — Frontend ATS scoring engine (live preview adapter)
 *
 * ─── ARCHITECTURE ──────────────────────────────────────────────────────────
 * This file is ONE of TWO language-specific adapters for the single ATS
 * scoring algorithm. The other adapter is RefineService.java (backend).
 *
 *   atsRules.json        ← single source of truth (weights, keywords, risks)
 *       │
 *       ├── atsScorer.js  (this file — frontend JS adapter)
 *       └── RefineService.java (backend Java adapter, reads same JSON)
 *
 * Any change to scoring constants MUST be made in atsRules.json only.
 * Neither this file nor RefineService.java should contain any hardcoded
 * point values, keyword lists, or threshold numbers.
 *
 * ─── ROLE ──────────────────────────────────────────────────────────────────
 * Provides a LIVE PREVIEW score while the user is editing. Because it runs
 * entirely in the browser with no network call, it updates on every keystroke.
 * The badge shows "Preview" while there are unsaved changes, and switches to
 * "Saved ✓" (the backend-confirmed authoritative score) after each save.
 *
 * ─── ALGORITHM ─────────────────────────────────────────────────────────────
 * score = max(0, min(100, 100 − total_deductions))
 * Identical to RefineService.java. Same checks, same weights, same sort order.
 * Regex patterns are language-specific syntax, not stored in JSON, but they
 * implement the same semantic rules documented in atsRules.json comments.
 *
 * Used by: ResumeEditor.jsx (localReport useMemo — preview only)
 */
import RULES from "../assets/atsRules.json" with { type: "json" };
// ─── Destructure all config from the single source of truth ──────────────────
const D  = RULES.deductions;   // point deductions
const T  = RULES.thresholds;   // length/count thresholds
const SB = RULES.scoreBands;   // score classification thresholds

// ─── Regex — language-specific syntax; semantic rules defined in atsRules.json
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE          = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}.*$/i;
const HAS_METRIC_RE   = /(\d+%|\$\s?\d+|\d+x|\d{4,}|\d+\s*(users|clients|customers|requests|orders|revenue|sales|million|thousand|percent|hours|ms|seconds|repos|features|bugs|projects|team members|people))/i;
const PASSIVE_VOICE_RE= /\b(was|were|been|is|are)\s+(responsible for|managed by|handled by|tasked with|assigned to|involved in|utilized|leveraged)\b/i;
const FILLER_WORDS_RE = /\b(responsible for|helped with|assisted with|worked on|involved in|participated in|good at|team player|hard worker|fast learner|passionate about|results-driven|detail-oriented|dynamic|synergy|various|several|etc\.)\b/i;
const ACTION_VERB_RE  = /\b(achieved|automated|built|created|delivered|designed|developed|drove|implemented|improved|increased|launched|led|managed|migrated|optimized|owned|reduced|shipped|streamlined|trained|transformed)\b/i;

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};
const CURRENT_YEAR = new Date().getFullYear();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely convert any value (plain string, {value:…} wrapper, null) to text */
const asText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v.value !== undefined) return String(v.value || "").trim();
  if (typeof v === "object") return "";
  return String(v).trim();
};

const hasText  = (v) => asText(v).length > 0;
const short    = (v, max = 120) => { const t = asText(v); return t.length <= max ? t : t.substring(0, max) + "..."; };
const first    = (re, text) => { const m = re.exec(asText(text)); return m ? m[0] : ""; };

const parseMonthYear = (value) => {
  const parts = asText(value).trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const month = MONTHS[parts[0].substring(0, 3).toLowerCase()];
  if (!month || !/^\d{4}$/.test(parts[1])) return null;
  const year = parseInt(parts[1], 10);
  if (year < 1950 || year > CURRENT_YEAR + 10) return null;
  return year * 12 + month;
};

const issue = (issues, type, section, original, points, suggestion, severity) => {
  issues.push({ type, section, original: asText(original), suggestion, severity, points });
  return points;
};

const required = (issues, type, section, value, points, fix) => {
  if (hasText(value)) return 0;
  return issue(issues, type, section, "", points, fix, points >= 5 ? "error" : "warning");
};

const optUrl = (url, section, fix, issues) => {
  const t = asText(url);
  if (!t) return 0;
  return URL_RE.test(t) ? 0 : issue(issues, "invalid_url", section, t, D.invalidUrl, fix, "tip");
};

// ─── Full-text builder for keyword matching ───────────────────────────────────
const allText = (resume) => {
  const p = [];
  const pr = resume.profileInfo  || {};
  const co = resume.contactInfo  || {};
  p.push(asText(pr.fullName), asText(pr.designation), asText(pr.summary));
  p.push(asText(co.location), asText(co.linkedIn), asText(co.github), asText(co.website));
  (resume.workExperience  || []).forEach(j => p.push(asText(j.company), asText(j.role), asText(j.description)));
  (resume.education       || []).forEach(e => p.push(asText(e.degree), asText(e.institution)));
  (resume.skills          || []).forEach(s => p.push(asText(s.name)));
  (resume.projects        || []).forEach(q => p.push(asText(q.title), asText(q.description), asText(q.github), asText(q.liveDemo)));
  (resume.certifications  || []).forEach(c => p.push(asText(c.title), asText(c.issuer), asText(c.year)));
  (resume.languages       || []).forEach(l => p.push(asText(l.name)));
  (resume.interests       || []).forEach(i => p.push(asText(i)));
  return p.filter(Boolean).join(" ");
};

// ─── Category detection — mirrors AtsKeywords.java detectCategory() ──────────
export const detectCategory = (designation) => {
  if (!designation || !designation.trim()) return null;
  const lower = designation.toLowerCase();
  const cats  = Object.keys(RULES.categories);
  // Full phrase match first (e.g. "software engineer")
  for (const cat of cats) {
    if (cat.split(" ").every(w => lower.includes(w))) return cat;
  }
  // Single-word fallback (e.g. "designer" in "UI/UX Designer")
  for (const cat of cats) {
    if (cat.split(" ").some(w => lower.includes(w))) return cat;
  }
  return null;
};

// ─── Section checkers ─────────────────────────────────────────────────────────

const checkProfile = (profile, issues) => {
  let pts = 0;
  pts += required(issues, "missing_name", "Profile > Full name", profile.fullName, D.missingName,
    "Add your full legal or professional name. ATS records need a clear candidate name.");
  pts += required(issues, "missing_designation", "Profile > Designation", profile.designation, D.missingDesignation,
    "Add a target role title. This anchors the resume and enables role-specific keyword checks.");

  const summary = asText(profile.summary);
  if (!hasText(summary)) {
    pts += issue(issues, "missing_summary", "Profile > Summary", "", D.missingSummary,
      "Add a 2-4 sentence summary with target role, years or scope, strongest skills, and measurable impact.", "error");
  } else {
    if (summary.length < T.minSummaryLen) {
      pts += issue(issues, "short_summary", "Profile > Summary", summary, D.shortSummary,
        "Expand the summary to at least 80 characters with role, strengths, and impact.", "warning");
    }
    if (!HAS_METRIC_RE.test(summary)) {
      pts += issue(issues, "summary_no_metric", "Profile > Summary", short(summary), D.summaryNoMetric,
        "Add one concrete signal, such as years of experience, users supported, revenue, performance, or team size.", "tip");
    }
    if (FILLER_WORDS_RE.test(summary)) {
      pts += issue(issues, "summary_filler", "Profile > Summary", first(FILLER_WORDS_RE, summary), D.summaryFiller,
        "Replace vague wording with a specific strength or outcome.", "warning");
    }
  }
  return pts;
};

const checkContact = (contact, issues) => {
  let pts = 0;
  const email = asText(contact.email);
  if (!hasText(email)) {
    pts += issue(issues, "missing_email", "Contact > Email", "", D.missingEmail,
      "Add a professional email address. ATS and recruiters need a direct contact field.", "error");
  } else if (!EMAIL_RE.test(email)) {
    pts += issue(issues, "invalid_email", "Contact > Email", email, D.invalidEmail,
      "Use a valid email format such as name@example.com.", "error");
  }
  const phone = asText(contact.phone);
  if (!hasText(phone)) {
    pts += issue(issues, "missing_phone", "Contact > Phone", "", D.missingPhone,
      "Add a phone number with country code.", "warning");
  } else if (phone.replace(/\D/g, "").length < 8) {
    pts += issue(issues, "invalid_phone", "Contact > Phone", phone, D.invalidPhone,
      "Use a complete phone number. Include country code and enough digits.", "warning");
  }
  pts += required(issues, "missing_location", "Contact > Location", contact.location, D.missingLocation,
    "Add city and country or region. Many ATS filters use location.");
  pts += optUrl(contact.linkedIn, "Contact > LinkedIn",
    "Use a full LinkedIn URL such as https://linkedin.com/in/username.", issues);
  pts += optUrl(contact.github, "Contact > GitHub",
    "Use a full GitHub URL such as https://github.com/username.", issues);
  pts += optUrl(contact.website, "Contact > Website",
    "Use a complete portfolio URL, including a valid domain.", issues);
  return pts;
};

const checkDateRange = (start, end, section, issues, allowPresent) => {
  let pts = 0;
  if (!hasText(start)) pts += issue(issues, "missing_start_date", `${section} > Start date`, "", D.missingStartDate, "Add a start month and year.", "warning");
  if (!hasText(end))   pts += issue(issues, "missing_end_date",   `${section} > End date`,   "", D.missingEndDate,   allowPresent ? "Add an end month/year or mark it as Present." : "Add an end month and year.", "warning");
  if (!hasText(start) || !hasText(end)) return pts;
  if (asText(end).toLowerCase() === "present") {
    if (!allowPresent) pts += issue(issues, "invalid_end_date", `${section} > End date`, end, D.invalidEndDate, "Use a real end month and year for this section.", "warning");
    return pts;
  }
  const sv = parseMonthYear(start), ev = parseMonthYear(end);
  if (sv === null) pts += issue(issues, "invalid_start_date", `${section} > Start date`, start, D.invalidStartDate, "Use the editor date format: month plus four-digit year.", "warning");
  if (ev === null) pts += issue(issues, "invalid_end_date",   `${section} > End date`,   end,   D.invalidEndDate,   "Use the editor date format: month plus four-digit year.", "warning");
  if (sv !== null && ev !== null && sv > ev) pts += issue(issues, "date_order", `${section} > Dates`, `${asText(start)} to ${asText(end)}`, D.dateOrder, "Start date is after end date. Correct the timeline before applying.", "error");
  return pts;
};

const checkQuality = (text, section, minLen, requireMetric, issues) => {
  let pts = 0;
  const v = asText(text);
  if (v.length < minLen)              pts += issue(issues, "short_description",   section, v,                          D.shortDescription,  "Add more detail: action, tools, scope, and result.", "warning");
  if (!ACTION_VERB_RE.test(v))        pts += issue(issues, "missing_action_verb", section, short(v),                   D.missingActionVerb, "Start at least one sentence or bullet with a strong action verb such as Built, Led, Improved, Reduced, or Automated.", "tip");
  if (requireMetric && !HAS_METRIC_RE.test(v)) pts += issue(issues, "missing_metric", section, short(v),             D.missingMetric,     "Add a number or measurable result, for example: Reduced latency by 40% or Supported 10K users.", "warning");
  if (PASSIVE_VOICE_RE.test(v))       pts += issue(issues, "passive_voice",        section, first(PASSIVE_VOICE_RE,v), D.passiveVoice,      "Rewrite this in active voice. Use a direct action verb and state your impact.", "warning");
  if (FILLER_WORDS_RE.test(v))        pts += issue(issues, "filler_word",          section, first(FILLER_WORDS_RE,v), D.fillerWord,        "Remove vague wording and replace it with a concrete action or result.", "warning");
  return pts;
};

const checkExperience = (experience, issues) => {
  if (experience.length === 0) return issue(issues, "missing_experience", "Experience", "", D.missingExperience, "Add at least one role, internship, freelance job, or substantial project-style experience.", "error");
  let pts = 0;
  experience.forEach((job, idx) => {
    const lbl = `Experience ${idx + 1}`;
    pts += required(issues, "missing_company", `${lbl} > Company`, job.company, D.missingCompany, "Add the company or organization name.");
    pts += required(issues, "missing_role",    `${lbl} > Role`,    job.role,    D.missingRole,    "Add the role title exactly as you want recruiters and ATS to read it.");
    pts += checkDateRange(job.startDate, job.endDate, lbl, issues, true);
    const desc = asText(job.description);
    if (!hasText(desc)) {
      pts += issue(issues, "missing_experience_description", `${lbl} > Description`, "", D.missingExperienceDescription, "Add 2-4 bullets or sentences covering action, tools, and measurable impact.", "error");
    } else {
      pts += checkQuality(desc, `${lbl} > Description`, T.minExperienceDescLen, true, issues);
    }
  });
  return pts;
};

const checkEducation = (education, issues) => {
  if (education.length === 0) return issue(issues, "missing_education", "Education", "", D.missingEducation, "Add education, training, bootcamp, or equivalent credential. If not applicable, add your strongest formal training.", "warning");
  let pts = 0;
  education.forEach((item, idx) => {
    const lbl = `Education ${idx + 1}`;
    pts += required(issues, "missing_degree",      `${lbl} > Degree`,      item.degree,      D.missingDegree,      "Add the degree, certificate, or course name.");
    pts += required(issues, "missing_institution", `${lbl} > Institution`, item.institution, D.missingInstitution, "Add the school, university, or training provider.");
    pts += checkDateRange(item.startDate, item.endDate, lbl, issues, false);
  });
  return pts;
};

const checkProgress = (progress, section, issues) => {
  if (progress === null || progress === undefined) return issue(issues, "missing_progress", section, "", D.missingProgress, "Set a proficiency value or remove the visual proficiency control for ATS-first resumes.", "tip");
  if (progress < 0 || progress > 100)              return issue(issues, "invalid_progress", section, String(progress), D.invalidProgress, "Keep proficiency between 0 and 100.", "tip");
  return 0;
};

const checkSkills = (skills, issues) => {
  if (skills.length === 0) return issue(issues, "missing_skills", "Skills", "", D.missingSkills, "Add 8-12 concrete skills. ATS keyword matching depends heavily on this section.", "error");
  let pts = 0;
  if (skills.length < T.tooFewSkillsCount) {
    pts += issue(issues, "too_few_skills", "Skills", String(skills.length), D.tooFewSkills, `Only ${skills.length} skills are listed. Add enough hard skills to match the target role.`, "warning");
  }
  const seen = new Set();
  skills.forEach((sk, idx) => {
    const name = asText(sk.name), lbl = `Skills ${idx + 1}`;
    if (!hasText(name)) { pts += issue(issues, "blank_skill", `${lbl} > Name`, "", D.blankSkill, "Remove the blank skill row or enter a specific skill name.", "error"); return; }
    if (seen.has(name.toLowerCase())) pts += issue(issues, "duplicate_skill", `${lbl} > Name`, name, D.duplicateSkill, "Remove duplicate skills. Keep one clear entry per skill.", "tip");
    seen.add(name.toLowerCase());
    pts += checkProgress(sk.progress, `${lbl} > Proficiency`, issues);
  });
  return pts;
};

const checkProjects = (projects, experience, issues) => {
  if (projects.length === 0 && experience.length <= 1) return issue(issues, "missing_projects", "Projects", "", D.missingProjects, "Add one or two strong projects if your experience section is light. Include title, tools, and outcome.", "warning");
  let pts = 0;
  projects.forEach((proj, idx) => {
    const lbl = `Projects ${idx + 1}`;
    pts += required(issues, "missing_project_title", `${lbl} > Title`, proj.title, D.missingProjectTitle, "Add a concise project title.");
    const desc = asText(proj.description);
    if (!hasText(desc)) {
      pts += issue(issues, "missing_project_description", `${lbl} > Description`, "", D.missingProjectDescription, "Add what the project does, what you used, and what improved.", "warning");
    } else {
      pts += checkQuality(desc, `${lbl} > Description`, T.minProjectDescLen, false, issues);
    }
    pts += optUrl(proj.github,  `${lbl} > GitHub URL`,   "Use a valid repository URL or leave the field empty.", issues);
    pts += optUrl(proj.liveDemo,`${lbl} > Live demo URL`, "Use a valid live demo URL or leave the field empty.", issues);
  });
  return pts;
};

const checkYear = (year, section, issues) => {
  if (!hasText(year)) return issue(issues, "missing_cert_year", section, "", D.missingCertYear, "Add the completion year or remove the year field if unknown.", "tip");
  if (!/^\d{4}$/.test(asText(year))) return issue(issues, "invalid_year", section, asText(year), D.invalidYear, "Use a four-digit year.", "warning");
  const n = parseInt(asText(year), 10);
  if (n < 1950 || n > CURRENT_YEAR + 10) return issue(issues, "year_out_of_range", section, asText(year), D.yearOutOfRange, "Use a realistic year.", "warning");
  return 0;
};

const checkCertifications = (certs, issues) => {
  let pts = 0;
  certs.forEach((c, idx) => {
    const lbl = `Certifications ${idx + 1}`;
    pts += required(issues, "missing_cert_title",  `${lbl} > Title`,  c.title,  D.missingCertTitle,  "Add the certification name or remove the blank certification row.");
    pts += required(issues, "missing_cert_issuer", `${lbl} > Issuer`, c.issuer, D.missingCertIssuer, "Add the issuer so ATS and recruiters can verify the credential.");
    pts += checkYear(c.year, `${lbl} > Year`, issues);
  });
  return pts;
};

const checkLanguages = (languages, issues) => {
  let pts = 0;
  const seen = new Set();
  languages.forEach((lang, idx) => {
    const name = asText(lang.name), lbl = `Languages ${idx + 1}`;
    if (!hasText(name)) { pts += issue(issues, "blank_language", `${lbl} > Name`, "", D.blankLanguage, "Remove the blank language row or enter a language name.", "tip"); return; }
    if (seen.has(name.toLowerCase())) pts += issue(issues, "duplicate_language", `${lbl} > Name`, name, D.duplicateLanguage, "Remove duplicate language entries.", "tip");
    seen.add(name.toLowerCase());
    pts += checkProgress(lang.progress, `${lbl} > Proficiency`, issues);
  });
  return pts;
};

const checkInterests = (interests, issues) => {
  let pts = 0;
  const seen = new Set();
  interests.forEach((interest, idx) => {
    const val = asText(interest), lbl = `Interests ${idx + 1}`;
    if (!hasText(val)) { pts += issue(issues, "blank_interest", lbl, "", D.blankInterest, "Remove blank interest rows.", "tip"); return; }
    if (seen.has(val.toLowerCase())) pts += issue(issues, "duplicate_interest", lbl, val, D.duplicateInterest, "Remove duplicate interests.", "tip");
    seen.add(val.toLowerCase());
  });
  if (interests.length > T.tooManyInterestsCount) {
    pts += issue(issues, "too_many_interests", "Interests", String(interests.length), D.tooManyInterests,
      "Keep interests short or remove them for ATS-first resumes. Use the space for experience, skills, or projects.", "tip");
  }
  return pts;
};

const checkPresentation = (resume, profile, issues) => {
  let pts = 0;
  const template    = resume.template || "template1";
  const risk        = RULES.templateRisk[template];
  if (risk !== undefined) {
    const name = RULES.templateNames[template] || template;
    pts += issue(issues, "template_parse_risk", "Customization > Template", name, risk,
      "For ATS uploads, use Classic or Minimal. Keep visual templates for human-facing PDFs.",
      risk >= 6 ? "warning" : "tip");
  }
  const photoUrl   = asText(profile.profilePreviewUrl || profile.profileImageUrl);
  const dec        = resume.decoratives || {};
  const photoShape = asText(dec.photoShape);
  if (hasText(photoUrl) && photoShape !== "none") {
    pts += issue(issues, "profile_photo_parse_risk", "Profile > Photo", "Photo attached", D.profilePhotoParseRisk,
      "Remove the photo for ATS-first resumes. Photos are often ignored and can reduce parser consistency.", "warning");
  }
  const headerStyle = asText(dec.headerStyle);
  if (headerStyle === "full-bleed" || headerStyle === "card") {
    pts += issue(issues, "decorative_header", "Customization > Header style", headerStyle, D.decorativeHeader,
      "Use Minimal header style for ATS uploads. Decorative headers can change read order in some parsers.", "tip");
  }
  if (String(dec.sectionIcons) === "true") {
    pts += issue(issues, "section_icons", "Customization > Section icons", "Enabled", D.sectionIcons,
      "Disable section icons for ATS uploads. Icons can be parsed as stray characters.", "warning");
  }
  if (String(dec.sectionNumbers) === "true") {
    pts += issue(issues, "section_numbers", "Customization > Section numbers", "Enabled", D.sectionNumbers,
      "Disable section numbers if the resume is being uploaded to an ATS. Plain section headings parse cleaner.", "tip");
  }
  const divStyle = asText(dec.dividerStyle);
  if (divStyle === "dots" || divStyle === "gradient") {
    pts += issue(issues, "decorative_divider", "Customization > Divider style", divStyle, D.decorativeDivider,
      "Use a simple line divider or no divider for ATS uploads.", "tip");
  }
  const progStyle = asText(dec.progressStyle);
  if (progStyle === "bar" || progStyle === "dots") {
    pts += issue(issues, "visual_progress", "Customization > Skill progress style", progStyle, D.visualProgress,
      "ATS reads skill names, not bars or dots. Keep the skill names textual and do not rely on visual proficiency.", "tip");
  }
  if (hasText(resume.fontPairing) && resume.fontPairing !== "inter") {
    pts += issue(issues, "custom_font", "Customization > Font", resume.fontPairing, D.customFont,
      "Use a common system-like font for ATS uploads. Keep custom fonts for human-facing versions.", "tip");
  }
  return pts;
};

const checkKeywords = (resume, category, issues) => {
  const keywords = RULES.categories[category] || [];
  if (keywords.length === 0) return 0;
  const fullText = allText(resume).toLowerCase();
  const missing  = keywords.filter(kw => !fullText.includes(kw.toLowerCase()));
  if (missing.length === 0) return 0;
  const ratio = missing.length / keywords.length;
  const pts   = Math.max(D.keywordGapMin, Math.round(D.keywordGapMax * ratio));
  const top   = missing.slice(0, T.maxKeywordDisplay);
  issues.push({
    type: "keyword_gap", section: "Role keywords",
    original: "Missing: " + top.join(", "),
    suggestion: `For a ${category} role, add only the missing keywords you genuinely have experience with: ${top.join(", ")}.`,
    severity: pts >= 10 ? "warning" : "tip",
    points: pts
  });
  return pts;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const computeAtsReport = (resume = {}) => {
  const issues      = [];
  const profile     = resume.profileInfo  || {};
  const contact     = resume.contactInfo  || {};
  const experience  = resume.workExperience  || [];
  const education   = resume.education       || [];
  const skills      = resume.skills          || [];
  const projects    = resume.projects        || [];
  const certs       = resume.certifications  || [];
  const languages   = resume.languages       || [];
  const interests   = resume.interests       || [];

  let deductions = 0;
  deductions += checkProfile(profile, issues);
  deductions += checkContact(contact, issues);
  deductions += checkExperience(experience, issues);
  deductions += checkEducation(education, issues);
  deductions += checkSkills(skills, issues);
  deductions += checkProjects(projects, experience, issues);
  deductions += checkCertifications(certs, issues);
  deductions += checkLanguages(languages, issues);
  deductions += checkInterests(interests, issues);
  deductions += checkPresentation(resume, profile, issues);

  const category = detectCategory(asText(profile.designation));
  if (category) {
    deductions += checkKeywords(resume, category, issues);
  } else {
    const hasDes = hasText(profile.designation);
    if (hasDes) {
      issues.push({
        type: "role_category_unclear", section: "Profile > Designation",
        original: asText(profile.designation),
        suggestion: "Use a standard target title such as Software Engineer, Product Manager, Designer, Data Analyst, or DevOps Engineer so keyword checks can be role-aware.",
        severity: "tip", points: D.roleCategoryUnclear
      });
      deductions += D.roleCategoryUnclear;
    }
  }

  // Identical formula to RefineService.java line 139
  const score = Math.max(0, Math.min(100, 100 - deductions));

  // Identical sort to RefineService.java (errors first, then by descending points)
  const rank = (s) => (s === "error" ? 0 : s === "warning" ? 1 : 2);
  issues.sort((a, b) => rank(a.severity) - rank(b.severity) || (b.points || 0) - (a.points || 0));

  const errors   = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  const roleStr  = category ? ` for a ${category} role` : "";
  let overallFeedback;
  if      (score >= SB.strong)   overallFeedback = `Strong ATS-ready structure${roleStr}. Fix the remaining small parser risks before uploading.`;
  else if (score >= SB.good)     overallFeedback = `Good foundation${roleStr}. Address ${errors} critical issue(s) and ${warnings} warning(s) to reduce ATS risk.`;
  else if (score >= SB.moderate) overallFeedback = `Moderate ATS risk${roleStr}. Focus first on missing required fields, measurable experience, and parser-friendly layout.`;
  else                           overallFeedback = `High ATS risk${roleStr}. Fill missing sections, simplify formatting, and rewrite weak bullets before applying.`;

  // atsScore alias ensures compatibility with the backend RefineResponse field name
  return { score, atsScore: score, issues, overallFeedback, category };
};

// Re-export category keywords and rules for any component that needs to
// display or cross-reference them without re-importing the JSON directly.
export const CATEGORY_KEYWORDS = RULES.categories;
export const ATS_RULES         = RULES;
