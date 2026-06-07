/*
Purpose: Calculates resume completeness, contact info validity, keyword gaps, and parser formatting risks.
Used By: ResumeEditor.jsx, Dashboard.jsx
Request Flow: Frontend editor state changes -> computeAtsReport() evaluation
Data Flow: Resume state object -> atsScorer validation rules -> Evaluation score JSON output
Learn: Regular expressions matching, rule score aggregation, keyword matching matrices
*/
export const CATEGORY_KEYWORDS = {
  "software engineer": [
    "Java", "Python", "JavaScript", "TypeScript", "React", "Spring Boot",
    "REST API", "Microservices", "Docker", "Kubernetes", "CI/CD",
    "Git", "SQL", "MongoDB", "AWS", "unit testing", "Agile", "Scrum",
    "design patterns", "code review", "system design"
  ],
  "frontend developer": [
    "React", "Vue", "Angular", "JavaScript", "TypeScript", "CSS", "HTML",
    "responsive design", "Webpack", "Vite", "performance optimization",
    "accessibility", "cross-browser", "Git", "REST API", "Figma"
  ],
  "backend developer": [
    "Java", "Node.js", "Python", "REST API", "GraphQL", "SQL", "PostgreSQL",
    "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "authentication",
    "authorization", "JWT", "microservices", "Spring Boot", "Express.js"
  ],
  "data analyst": [
    "SQL", "Python", "Excel", "Tableau", "Power BI", "data visualization",
    "statistical analysis", "ETL", "pandas", "NumPy", "data cleaning",
    "A/B testing", "dashboards", "KPIs", "business intelligence"
  ],
  "data scientist": [
    "Python", "R", "machine learning", "deep learning", "TensorFlow",
    "PyTorch", "scikit-learn", "SQL", "statistics", "data preprocessing",
    "feature engineering", "model deployment", "Jupyter", "NLP", "pandas"
  ],
  "product manager": [
    "product roadmap", "user stories", "Agile", "Scrum", "stakeholder",
    "KPIs", "OKRs", "market research", "user research", "A/B testing",
    "Jira", "Confluence", "prioritization", "go-to-market", "PRD",
    "cross-functional", "data-driven"
  ],
  "designer": [
    "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "UI", "UX",
    "wireframes", "prototypes", "usability testing", "design systems",
    "user research", "accessibility", "responsive design", "typography",
    "color theory", "Zeplin"
  ],
  "devops engineer": [
    "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "AWS",
    "Azure", "GCP", "Terraform", "Ansible", "monitoring", "Prometheus",
    "Grafana", "Linux", "bash scripting", "infrastructure as code",
    "reliability", "SRE", "load balancing"
  ],
  "marketing": [
    "SEO", "SEM", "Google Analytics", "content marketing", "social media",
    "email marketing", "campaign", "conversion rate", "ROI", "CRM",
    "Salesforce", "HubSpot", "A/B testing", "brand strategy", "lead generation",
    "digital marketing", "copywriting"
  ],
  "finance": [
    "financial modeling", "Excel", "PowerPoint", "valuation", "DCF",
    "financial analysis", "budgeting", "forecasting", "P&L", "balance sheet",
    "ROI", "KPIs", "Bloomberg", "CFA", "compliance", "audit", "risk management"
  ],
  "project manager": [
    "project planning", "stakeholder management", "risk management",
    "Agile", "Scrum", "waterfall", "MS Project", "Jira", "PMP",
    "budget management", "resource allocation", "milestone", "deliverables",
    "cross-functional", "status reporting"
  ],
  "healthcare": [
    "patient care", "clinical", "EMR", "EHR", "HIPAA", "diagnosis",
    "treatment", "medication", "healthcare", "medical", "nursing",
    "patient assessment", "documentation", "compliance", "telehealth"
  ]
};

export const detectCategory = (designation) => {
  if (!designation || !designation.trim()) return null;
  const lower = designation.toLowerCase();
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    const parts = category.split(" ");
    if (parts.every((p) => lower.includes(p))) return category;
  }
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    const parts = category.split(" ");
    if (parts.some((p) => lower.includes(p))) return category;
  }
  return null;
};

const MIN_SUMMARY_LEN = 80;
const MIN_EXPERIENCE_DESC_LEN = 45;
const MIN_PROJECT_DESC_LEN = 35;
const CURRENT_YEAR = new Date().getFullYear();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}.*$/i;
const HAS_METRIC = /(\d+%|\$\s?\d+|\d+x|\d{4,}|\d+\s*(users|clients|customers|requests|orders|revenue|sales|million|thousand|percent|hours|ms|seconds|repos|features|bugs|projects|team members|people))/i;
const PASSIVE_VOICE_REGEX = /\b(was|were|been|is|are)\s+(responsible for|managed by|handled by|tasked with|assigned to|involved in|utilized|leveraged)\b/i;
const FILLER_WORDS = /\b(responsible for|helped with|assisted with|worked on|involved in|participated in|good at|team player|hard worker|fast learner|passionate about|results-driven|detail-oriented|dynamic|synergy|various|several|etc\.)\b/i;
const ACTION_VERB = /\b(achieved|automated|built|created|delivered|designed|developed|drove|implemented|improved|increased|launched|led|managed|migrated|optimized|owned|reduced|shipped|streamlined|trained|transformed)\b/i;

const TEMPLATE_RISK = {
  template2: 6,
  template3: 3,
  premium1: 3,
  premium2: 2,
  premium3: 6,
  premium5: 3,
  premium6: 8,
  premium7: 6,
  premium8: 8,
  premium9: 2,
  premium10: 4
};

const TEMPLATE_NAMES = {
  template1: "Classic",
  template2: "Side",
  template3: "Banner",
  premium1: "Timeline",
  premium2: "Executive",
  premium3: "Compact",
  premium4: "Minimal",
  premium5: "Accent",
  premium6: "Split",
  premium7: "Cards",
  premium8: "Graph",
  premium9: "Centered",
  premium10: "Tech",
  ats_classic: "Basic",
  ats_entry: "Edge",
  ats_senior: "Serif",
  ats_lead: "Lead",
  ats_intern: "Campus",
  ats_experienced: "Prime"
};

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

const asText = (v) => String(v || "").trim();
const hasText = (v) => asText(v).length > 0;
const short = (v, max = 120) => {
  const t = asText(v);
  return t.length <= max ? t : t.substring(0, max) + "...";
};

const parseMonthYear = (value) => {
  const parts = asText(value).trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const monthStr = parts[0].slice(0, 3).toLowerCase();
  const month = MONTHS[monthStr];
  if (!month || !/^\d{4}$/.test(parts[1])) return null;
  const year = parseInt(parts[1], 10);
  const maxYear = CURRENT_YEAR + 10;
  if (year < 1950 || year > maxYear) return null;
  return year * 12 + month;
};

const add = (issues, type, section, original, points, suggestion, severity = "warning") => {
  issues.push({ type, section, original, suggestion, severity, points });
  return points;
};

const requireText = (issues, type, section, value, points, fix) => {
  if (hasText(value)) return 0;
  return add(issues, type, section, "", points, fix, points >= 5 ? "error" : "warning");
};

const checkOptionalUrl = (url, section, fix, issues) => {
  if (!hasText(url)) return 0;
  if (!URL.test(asText(url))) {
    return add(issues, "invalid_url", section, url, 2, fix, "tip");
  }
  return 0;
};

const firstMatch = (regex, text) => {
  const match = regex.exec(asText(text));
  return match ? match[0] : "";
};

const allText = (resume) => {
  const text = [];
  const profile = resume.profileInfo || {};
  const contact = resume.contactInfo || {};
  const experience = resume.workExperience || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];
  const certifications = resume.certifications || [];
  const languages = resume.languages || [];
  const interests = resume.interests || [];

  text.push(profile.fullName, profile.designation, profile.summary);
  text.push(contact.location, contact.linkedIn, contact.github, contact.website);
  experience.forEach((j) => text.push(j.company, j.role, j.description));
  education.forEach((e) => text.push(e.degree, e.institution));
  skills.forEach((s) => text.push(s.name));
  projects.forEach((p) => text.push(p.title, p.description, p.github, p.liveDemo));
  certifications.forEach((c) => text.push(c.title, c.issuer, c.year));
  languages.forEach((l) => text.push(l.name));
  text.push(...interests);

  return text.filter(Boolean).join(" ");
};

const checkProfile = (profile, issues) => {
  let points = 0;
  points += requireText(issues, "missing_name", "Profile > Full name", profile.fullName, 6,
    "Add your full legal or professional name. ATS records need a clear candidate name.");
  points += requireText(issues, "missing_designation", "Profile > Designation", profile.designation, 6,
    "Add a target role title. This anchors the resume and enables role-specific keyword checks.");
  const summary = asText(profile.summary);
  if (!hasText(summary)) {
    points += add(issues, "missing_summary", "Profile > Summary", "", 12,
      "Add a 2-4 sentence summary with target role, years or scope, strongest skills, and measurable impact.", "error");
  } else {
    if (summary.length < MIN_SUMMARY_LEN) {
      points += add(issues, "short_summary", "Profile > Summary", summary, 6,
        "Expand the summary to at least 80 characters with role, strengths, and impact.", "warning");
    }
    if (!HAS_METRIC.test(summary)) {
      points += add(issues, "summary_no_metric", "Profile > Summary", short(summary), 3,
        "Add one concrete signal, such as years of experience, users supported, revenue, performance, or team size.", "tip");
    }
    if (FILLER_WORDS.test(summary)) {
      const flagged = firstMatch(FILLER_WORDS, summary);
      points += add(issues, "summary_filler", "Profile > Summary", flagged, 3,
        "Replace vague wording with a specific strength or outcome.", "warning");
    }
  }
  return points;
};

const checkContact = (contact, issues) => {
  let points = 0;
  const email = asText(contact.email);
  if (!hasText(email)) {
    points += add(issues, "missing_email", "Contact > Email", "", 8,
      "Add a professional email address. ATS and recruiters need a direct contact field.", "error");
  } else if (!EMAIL.test(email)) {
    points += add(issues, "invalid_email", "Contact > Email", email, 6,
      "Use a valid email format such as name@example.com.", "error");
  }
  const phone = asText(contact.phone);
  if (!hasText(phone)) {
    points += add(issues, "missing_phone", "Contact > Phone", "", 5,
      "Add a phone number with country code.", "warning");
  } else if (phone.replace(/\D/g, "").length < 8) {
    points += add(issues, "invalid_phone", "Contact > Phone", phone, 4,
      "Use a complete phone number. Include country code and enough digits.", "warning");
  }
  points += requireText(issues, "missing_location", "Contact > Location", contact.location, 3,
    "Add city and country or region. Many ATS filters use location.");
  points += checkOptionalUrl(contact.linkedIn, "Contact > LinkedIn", "Use a full LinkedIn URL such as https://linkedin.com/in/username.", issues);
  points += checkOptionalUrl(contact.github, "Contact > GitHub", "Use a full GitHub URL such as https://github.com/username.", issues);
  points += checkOptionalUrl(contact.website, "Contact > Website", "Use a complete portfolio URL, including a valid domain.", issues);
  return points;
};

const checkDateRange = (start, end, section, issues, allowPresent) => {
  let points = 0;
  if (!hasText(start)) {
    points += add(issues, "missing_start_date", `${section} > Start date`, "", 3,
      "Add a start month and year.", "warning");
  }
  if (!hasText(end)) {
    points += add(issues, "missing_end_date", `${section} > End date`, "", 3,
      allowPresent ? "Add an end month/year or mark it as Present." : "Add an end month and year.", "warning");
  }
  if (!hasText(start) || !hasText(end)) return points;
  if (asText(end).toLowerCase() === "present") {
    if (!allowPresent) {
      points += add(issues, "invalid_end_date", `${section} > End date`, end, 2,
        "Use a real end month and year for this section.", "warning");
    }
    return points;
  }
  const startValue = parseMonthYear(start);
  const endValue = parseMonthYear(end);
  if (startValue === null) {
    points += add(issues, "invalid_start_date", `${section} > Start date`, start, 2,
      "Use the editor date format: month plus four-digit year.", "warning");
  }
  if (endValue === null) {
    points += add(issues, "invalid_end_date", `${section} > End date`, end, 2,
      "Use the editor date format: month plus four-digit year.", "warning");
  }
  if (startValue !== null && endValue !== null && startValue > endValue) {
    points += add(issues, "date_order", `${section} > Dates`, `${start} to ${end}`, 5,
      "Start date is after end date. Correct the timeline before applying.", "error");
  }
  return points;
};

const checkContentQuality = (text, section, minLength, requireMetric, issues) => {
  let points = 0;
  const value = asText(text);
  if (value.length < minLength) {
    points += add(issues, "short_description", section, value, 5,
      "Add more detail: action, tools, scope, and result.", "warning");
  }
  if (!ACTION_VERB.test(value)) {
    points += add(issues, "missing_action_verb", section, short(value), 3,
      "Start at least one sentence or bullet with a strong action verb such as Built, Led, Improved, Reduced, or Automated.", "tip");
  }
  if (requireMetric && !HAS_METRIC.test(value)) {
    points += add(issues, "missing_metric", section, short(value), 5,
      "Add a number or measurable result, for example: Reduced latency by 40% or Supported 10K users.", "warning");
  }
  if (PASSIVE_VOICE_REGEX.test(value)) {
    const flagged = firstMatch(PASSIVE_VOICE_REGEX, value);
    points += add(issues, "passive_voice", section, flagged, 4,
      "Rewrite this in active voice. Use a direct action verb and state your impact.", "warning");
  }
  if (FILLER_WORDS.test(value)) {
    const flagged = firstMatch(FILLER_WORDS, value);
    points += add(issues, "filler_word", section, flagged, 3,
      "Remove vague wording and replace it with a concrete action or result.", "warning");
  }
  return points;
};

const checkExperience = (experience, issues) => {
  let points = 0;
  if (experience.length === 0) {
    return add(issues, "missing_experience", "Experience", "", 18,
      "Add at least one role, internship, freelance job, or substantial project-style experience.", "error");
  }
  experience.forEach((job, idx) => {
    const label = `Experience ${idx + 1}`;
    points += requireText(issues, "missing_company", `${label} > Company`, job.company, 4,
      "Add the company or organization name.");
    points += requireText(issues, "missing_role", `${label} > Role`, job.role, 4,
      "Add the role title exactly as you want recruiters and ATS to read it.");
    points += checkDateRange(job.startDate, job.endDate, label, issues, true);
    const description = asText(job.description);
    if (!hasText(description)) {
      points += add(issues, "missing_experience_description", `${label} > Description`, "", 8,
        "Add 2-4 bullets or sentences covering action, tools, and measurable impact.", "error");
    } else {
      points += checkContentQuality(description, `${label} > Description`, MIN_EXPERIENCE_DESC_LEN, true, issues);
    }
  });
  return points;
};

const checkEducation = (education, issues) => {
  let points = 0;
  if (education.length === 0) {
    return add(issues, "missing_education", "Education", "", 6,
      "Add education, training, bootcamp, or equivalent credential. If not applicable, add your strongest formal training.", "warning");
  }
  education.forEach((item, idx) => {
    const label = `Education ${idx + 1}`;
    points += requireText(issues, "missing_degree", `${label} > Degree`, item.degree, 4,
      "Add the degree, certificate, or course name.");
    points += requireText(issues, "missing_institution", `${label} > Institution`, item.institution, 4,
      "Add the school, university, or training provider.");
    points += checkDateRange(item.startDate, item.endDate, label, issues, false);
  });
  return points;
};

const checkProgress = (progress, section, issues) => {
  if (progress === null || progress === undefined) {
    return add(issues, "missing_progress", section, "", 1,
      "Set a proficiency value or remove the visual proficiency control for ATS-first resumes.", "tip");
  }
  if (progress < 0 || progress > 100) {
    return add(issues, "invalid_progress", section, String(progress), 1,
      "Keep proficiency between 0 and 100.", "tip");
  }
  return 0;
};

const checkSkills = (skills, issues) => {
  let points = 0;
  if (skills.length === 0) {
    return add(issues, "missing_skills", "Skills", "", 12,
      "Add 8-12 concrete skills. ATS keyword matching depends heavily on this section.", "error");
  }
  if (skills.length < 5) {
    points += add(issues, "too_few_skills", "Skills", String(skills.length), 5,
      `Only ${skills.length} skills are listed. Add enough hard skills to match the target role.`, "warning");
  }
  const seen = new Set();
  skills.forEach((skill, idx) => {
    const label = `Skills ${idx + 1}`;
    const name = asText(skill.name);
    if (!hasText(name)) {
      points += add(issues, "blank_skill", `${label} > Name`, "", 4,
        "Remove the blank skill row or enter a specific skill name.", "error");
      return;
    }
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) {
      points += add(issues, "duplicate_skill", `${label} > Name`, name, 2,
        "Remove duplicate skills. Keep one clear entry per skill.", "tip");
    }
    seen.add(normalized);
    points += checkProgress(skill.progress, `${label} > Proficiency`, issues);
  });
  return points;
};

const checkProjects = (projects, experience, issues) => {
  let points = 0;
  if (projects.length === 0 && experience.length <= 1) {
    return add(issues, "missing_projects", "Projects", "", 5,
      "Add one or two strong projects if your experience section is light. Include title, tools, and outcome.", "warning");
  }
  projects.forEach((project, idx) => {
    const label = `Projects ${idx + 1}`;
    points += requireText(issues, "missing_project_title", `${label} > Title`, project.title, 4,
      "Add a concise project title.");
    const description = asText(project.description);
    if (!hasText(description)) {
      points += add(issues, "missing_project_description", `${label} > Description`, "", 5,
        "Add what the project does, what you used, and what improved.", "warning");
    } else {
      points += checkContentQuality(description, `${label} > Description`, MIN_PROJECT_DESC_LEN, false, issues);
    }
    points += checkOptionalUrl(project.github, `${label} > GitHub URL`, "Use a valid repository URL or leave the field empty.", issues);
    points += checkOptionalUrl(project.liveDemo, `${label} > Live demo URL`, "Use a valid live demo URL or leave the field empty.", issues);
  });
  return points;
};

const checkYear = (year, section, issues) => {
  if (!hasText(year)) {
    return add(issues, "missing_cert_year", section, "", 1,
      "Add the completion year or remove the year field if unknown.", "tip");
  }
  if (!/^\d{4}$/.test(year)) {
    return add(issues, "invalid_year", section, year, 2,
      "Use a four-digit year.", "warning");
  }
  const numericYear = parseInt(year, 10);
  const maxYear = CURRENT_YEAR + 10;
  if (numericYear < 1950 || numericYear > maxYear) {
    return add(issues, "year_out_of_range", section, year, 2,
      "Use a realistic year.", "warning");
  }
  return 0;
};

const checkCertifications = (certifications, issues) => {
  let points = 0;
  certifications.forEach((cert, idx) => {
    const label = `Certifications ${idx + 1}`;
    points += requireText(issues, "missing_cert_title", `${label} > Title`, cert.title, 3,
      "Add the certification name or remove the blank certification row.");
    points += requireText(issues, "missing_cert_issuer", `${label} > Issuer`, cert.issuer, 2,
      "Add the issuer so ATS and recruiters can verify the credential.");
    points += checkYear(cert.year, `${label} > Year`, issues);
  });
  return points;
};

const checkLanguages = (languages, issues) => {
  let points = 0;
  const seen = new Set();
  languages.forEach((language, idx) => {
    const label = `Languages ${idx + 1}`;
    const name = asText(language.name);
    if (!hasText(name)) {
      points += add(issues, "blank_language", `${label} > Name`, "", 2,
        "Remove the blank language row or enter a language name.", "tip");
      return;
    }
    if (seen.has(name.toLowerCase())) {
      points += add(issues, "duplicate_language", `${label} > Name`, name, 1,
        "Remove duplicate language entries.", "tip");
    }
    seen.add(name.toLowerCase());
    points += checkProgress(language.progress, `${label} > Proficiency`, issues);
  });
  return points;
};

const checkInterests = (interests, issues) => {
  let points = 0;
  const seen = new Set();
  interests.forEach((interest, idx) => {
    const label = `Interests ${idx + 1}`;
    const val = asText(interest);
    if (!hasText(val)) {
      points += add(issues, "blank_interest", label, "", 1,
        "Remove blank interest rows.", "tip");
      return;
    }
    if (seen.has(val.toLowerCase())) {
      points += add(issues, "duplicate_interest", label, val, 1,
        "Remove duplicate interests.", "tip");
    }
    seen.add(val.toLowerCase());
  });
  if (interests.length > 6) {
    points += add(issues, "too_many_interests", "Interests", String(interests.length), 1,
      "Keep interests short or remove them for ATS-first resumes. Use the space for experience, skills, or projects.", "tip");
  }
  return points;
};

const templateName = (template) => TEMPLATE_NAMES[template] || template;

const checkPresentation = (resume, profile, issues) => {
  let points = 0;
  const template = resume.template || "template1";
  const templateRisk = TEMPLATE_RISK[template];
  if (templateRisk !== undefined) {
    points += add(issues, "template_parse_risk", "Customization > Template", templateName(template), templateRisk,
      "For ATS uploads, use Classic or Minimal. Keep visual templates for human-facing PDFs.", templateRisk >= 6 ? "warning" : "tip");
  }
  const photoUrl = asText(profile.profilePreviewUrl || profile.profileImageUrl);
  const decoratives = resume.decoratives || {};
  const photoShape = asText(decoratives.photoShape);
  if (hasText(photoUrl) && photoShape !== "none") {
    points += add(issues, "profile_photo_parse_risk", "Profile > Photo", "Photo attached", 4,
      "Remove the photo for ATS-first resumes. Photos are often ignored and can reduce parser consistency.", "warning");
  }
  const headerStyle = asText(decoratives.headerStyle);
  if (headerStyle === "full-bleed" || headerStyle === "card") {
    points += add(issues, "decorative_header", "Customization > Header style", headerStyle, 3,
      "Use Minimal header style for ATS uploads. Decorative headers can change read order in some parsers.", "tip");
  }
  if (decoratives.sectionIcons === "true") {
    points += add(issues, "section_icons", "Customization > Section icons", "Enabled", 3,
      "Disable section icons for ATS uploads. Icons can be parsed as stray characters.", "warning");
  }
  if (decoratives.sectionNumbers === "true") {
    points += add(issues, "section_numbers", "Customization > Section numbers", "Enabled", 1,
      "Disable section numbers if the resume is being uploaded to an ATS. Plain section headings parse cleaner.", "tip");
  }
  const dividerStyle = asText(decoratives.dividerStyle);
  if (dividerStyle === "dots" || dividerStyle === "gradient") {
    points += add(issues, "decorative_divider", "Customization > Divider style", dividerStyle, 1,
      "Use a simple line divider or no divider for ATS uploads.", "tip");
  }
  const progressStyle = asText(decoratives.progressStyle);
  if (progressStyle === "bar" || progressStyle === "dots") {
    points += add(issues, "visual_progress", "Customization > Skill progress style", progressStyle, 1,
      "ATS reads skill names, not bars or dots. Keep the skill names textual and do not rely on visual proficiency.", "tip");
  }
  if (hasText(resume.fontPairing) && resume.fontPairing !== "inter") {
    points += add(issues, "custom_font", "Customization > Font", resume.fontPairing, 1,
      "Use a common system-like font for ATS uploads. Keep custom fonts for human-facing versions.", "tip");
  }
  return points;
};

const checkKeywords = (resume, category, issues) => {
  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.length === 0) return 0;
  const fullText = allText(resume).toLowerCase();
  const missing = [];
  keywords.forEach((keyword) => {
    if (!fullText.includes(keyword.toLowerCase())) {
      missing.push(keyword);
    }
  });
  if (missing.length === 0) return 0;
  const missRatio = missing.length / keywords.length;
  const points = Math.max(4, Math.round(18 * missRatio));
  const topMissing = missing.slice(0, Math.min(8, missing.length));
  issues.push({
    type: "keyword_gap",
    section: "Role keywords",
    original: "Missing: " + topMissing.join(", "),
    suggestion: `For a ${category} role, add only the missing keywords you genuinely have experience with: ${topMissing.join(", ")}.`,
    severity: points >= 10 ? "warning" : "tip",
    points: points
  });
  return points;
};

export const computeAtsReport = (resume = {}) => {
  const issues = [];
  let deductions = 0;

  const profile = resume.profileInfo || {};
  const contact = resume.contactInfo || {};
  const experience = resume.workExperience || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];
  const certifications = resume.certifications || [];
  const languages = resume.languages || [];
  const interests = resume.interests || [];

  deductions += checkProfile(profile, issues);
  deductions += checkContact(contact, issues);
  deductions += checkExperience(experience, issues);
  deductions += checkEducation(education, issues);
  deductions += checkSkills(skills, issues);
  deductions += checkProjects(projects, experience, issues);
  deductions += checkCertifications(certifications, issues);
  deductions += checkLanguages(languages, issues);
  deductions += checkInterests(interests, issues);
  deductions += checkPresentation(resume, profile, issues);

  const designation = asText(profile.designation);
  const category = detectCategory(designation);
  if (category) {
    deductions += checkKeywords(resume, category, issues);
  } else {
    const points = hasText(designation) ? 2 : 0;
    if (points > 0) {
      issues.push({
        type: "role_category_unclear",
        section: "Profile > Designation",
        original: designation,
        suggestion: "Use a standard target title such as Software Engineer, Product Manager, Designer, Data Analyst, or DevOps Engineer so keyword checks can be role-aware.",
        severity: "tip",
        points: points
      });
      deductions += points;
    }
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));

  const severityRank = (s) => (s === "error" ? 0 : s === "warning" ? 1 : 2);
  issues.sort((a, b) => {
    const r = severityRank(a.severity) - severityRank(b.severity);
    if (r !== 0) return r;
    return (b.points || 0) - (a.points || 0);
  });

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const overallFeedback = score >= 85
    ? "Strong ATS-ready profile with minor improvements needed."
    : score >= 70
      ? `Good profile with ${errors} critical and ${warnings} warning-level gaps to fix.`
      : score >= 50
        ? "Moderate ATS risk. Strengthen impact, keywords, and section quality."
        : "High ATS risk. Resume likely filtered out in early screening.";

  return {
    score,
    atsScore: score,
    issues,
    overallFeedback,
    category
  };
};
