/**
 * atsScorer.js — Frontend ATS scoring engine (live preview adapter)
 * Redesigned using a 12-phase recruiter evaluation pipeline.
 */
import RULES from "../assets/atsRules.json" with { type: "json" };
const D  = RULES.deductions;
const T  = RULES.thresholds;
const SB = RULES.scoreBands;

// ─── Regex Patterns ──────────────────────────────────────────────────────────
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE          = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
const HAS_METRIC_RE   = /(\d+%|\$\s?\d+|\d+x|\d{4,}|\d+\s*(users|clients|customers|requests|orders|revenue|sales|million|thousand|percent|hours|ms|seconds|repos|features|bugs|projects|team members|people))/i;
const PASSIVE_VOICE_RE= /\b(was|were|been|is|are)\s+(responsible for|managed by|handled by|tasked with|assigned to|involved in|utilized|leveraged)\b/i;
const FILLER_WORDS_RE = /\b(responsible for|helped with|assisted with|worked on|involved in|participated in|good at|team player|hard worker|fast learner|passionate about|results-driven|detail-oriented|dynamic|synergy|various|several|etc\.)\b/i;
const ACTION_VERB_RE  = /\b(achieved|automated|built|created|delivered|designed|developed|drove|implemented|improved|increased|launched|led|managed|migrated|optimized|owned|reduced|shipped|streamlined|trained|transformed)\b/i;

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};
const CURRENT_YEAR = new Date().getFullYear();

// ─── Safely convert value to string ──────────────────────────────────────────
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
  let str = asText(value).trim().toLowerCase();
  str = str.replace(/^expected\s+/, "");
  const parts = str.split(/\s+/);
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    const year = parseInt(parts[0], 10);
    if (year < 1950 || year > CURRENT_YEAR + 10) return null;
    return year * 12 + 1;
  }
  if (parts.length === 2) {
    const month = MONTHS[parts[0].substring(0, 3)];
    if (!month || !/^\d{4}$/.test(parts[1])) return null;
    const year = parseInt(parts[1], 10);
    if (year < 1950 || year > CURRENT_YEAR + 10) return null;
    return year * 12 + month;
  }
  return null;
};

// ─── Recruiter suggestion formatter ─────────────────────────────────────────
const formatRecruiterSuggestion = (type, section, original, points, suggestion, severity, evidence = "", impact = { ats: 1, recruiter: 3, interview: 3 }, affected = [], example = "") => {
  let res = "Reason: " + suggestion + "\n";
  if (evidence) {
    res += "Evidence: " + evidence + "\n";
  }
  res += "Impact: ATS +" + impact.ats + ", Recruiter +" + impact.recruiter + ", Interview +" + impact.interview + "\n";
  res += "Actionable improvement: Adjust this section to improve layout quality and recruiter readability.\n";
  if (affected.length > 0) {
    res += "Affected items: " + affected.join(", ") + "\n";
  }
  if (example) {
    res += "Example: " + example + "\n";
  }
  return res;
};

// ─── Phase 1: Resume Intelligence object parsing ─────────────────────────────
export const analyzeResumeIntelligence = (resume = {}) => {
  const text = allText(resume).toLowerCase();
  const profile = resume.profileInfo || {};
  const contact = resume.contactInfo || {};
  const designation = asText(profile.designation);
  const summary = asText(profile.summary);
  
  const stage = detectCareerStage(resume);
  const specialization = detectCareerPath(resume, designation, text);

  // Indicators
  const hasInternship = (resume.customSections?.internships || []).length > 0 || 
    designation.toLowerCase().includes("intern") || 
    (resume.workExperience || []).some(w => asText(w.role).toLowerCase().includes("intern") || asText(w.company).toLowerCase().includes("intern"));

  const hasFreelancing = text.includes("freelance") || text.includes("contractor") || text.includes("consultant");
  const hasOpenSource = text.includes("open source") || text.includes("contribution") || (resume.projects || []).some(p => hasText(p.github));
  const hasResearch = text.includes("research assistant") || text.includes("publication") || text.includes("research paper") || text.includes("scientific");
  const hasHackathons = text.includes("hackathon") || text.includes("competition") || text.includes("codefest");
  const hasLeadership = text.includes("lead ") || text.includes("manage") || text.includes("direct") || text.includes("mentor") || text.includes("orchestrated") || text.includes("supervised");
  const hasCertifications = (resume.certifications || []).length > 0;

  // Years of experience
  let totalMonths = 0;
  (resume.workExperience || []).forEach(w => {
    const startVal = parseMonthYear(w.startDate);
    const endVal = w.endDate && w.endDate.toLowerCase().includes("present") ? CURRENT_YEAR * 12 + new Date().getMonth() + 1 : parseMonthYear(w.endDate);
    if (startVal && endVal && endVal >= startVal) {
      totalMonths += (endVal - startVal + 1);
    }
  });
  const yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;

  // Project and deployment maturity
  let projectMaturity = "Low";
  let deploymentMaturity = "None";
  if ((resume.projects || []).length >= 2) projectMaturity = "Medium";
  if (text.includes("architecture") || text.includes("system design") || text.includes("microservices")) projectMaturity = "High";
  if (text.includes("aws") || text.includes("docker") || text.includes("kubernetes") || text.includes("deploy")) deploymentMaturity = "Cloud";

  // Score attributes
  let metricsCount = 0;
  const matchMetrics = text.match(new RegExp(HAS_METRIC_RE.source, "gi"));
  if (matchMetrics) metricsCount = matchMetrics.length;

  let achievementQuality = Math.min(100, Math.max(40, 40 + metricsCount * 15));
  let writingQuality = 100;
  const fillerMatches = text.match(new RegExp(FILLER_WORDS_RE.source, "gi"));
  if (fillerMatches) writingQuality = Math.max(40, 100 - fillerMatches.length * 8);

  let technicalDepth = Math.min(100, Math.max(30, 30 + (resume.skills || []).length * 5));
  let atsCompatibility = 100;

  return {
    stage,
    yearsOfExperience,
    targetRole: designation || "General Resume",
    specialization,
    hasInternship,
    hasFreelancing,
    hasOpenSource,
    hasResearch,
    hasHackathons,
    hasLeadership,
    hasCertifications,
    projectMaturity,
    deploymentMaturity,
    achievementQuality,
    writingQuality,
    technicalDepth,
    atsCompatibility,
    
    // Structured properties for checkers to consume
    fullName: asText(profile.fullName),
    designation,
    summaryText: summary,
    email: asText(contact.email),
    phone: asText(contact.phone),
    location: asText(contact.location),
    linkedIn: asText(contact.linkedIn),
    github: asText(contact.github),
    website: asText(contact.website),
    
    jobs: (resume.workExperience || []).map((w, idx) => ({
      index: idx + 1,
      company: asText(w.company),
      role: asText(w.role),
      startDate: asText(w.startDate),
      endDate: asText(w.endDate),
      description: asText(w.description)
    })),
    educationList: (resume.education || []).map((e, idx) => ({
      index: idx + 1,
      degree: asText(e.degree),
      institution: asText(e.institution),
      startDate: asText(e.startDate),
      endDate: asText(e.endDate)
    })),
    skillsList: (resume.skills || []).map(s => ({
      name: asText(s.name),
      progress: s.progress
    })),
    projectsList: (resume.projects || []).map((p, idx) => ({
      index: idx + 1,
      title: asText(p.title),
      description: asText(p.description),
      github: asText(p.github),
      liveDemo: asText(p.liveDemo)
    })),
    certificationsList: (resume.certifications || []).map((c, idx) => ({
      index: idx + 1,
      title: asText(c.title),
      issuer: asText(c.issuer),
      year: asText(c.year)
    })),
    languages: (resume.languages || []).map(l => ({
      name: asText(l.name),
      progress: l.progress
    })),
    interests: (resume.interests || []).map(i => asText(i)),
    template: resume.template || "template1",
    photoUrl: asText(profile.profilePreviewUrl || profile.profileImageUrl),
    decoratives: resume.decoratives || {},
    fontPairing: resume.fontPairing,
    rawResume: resume
  };
};

// ─── Phase 2 & 3: Checkers Consuming Intelligence Object ─────────────────────

const checkProfile = (intel, issues) => {
  let pts = 0;
  if (!hasText(intel.fullName)) {
    pts += issue(issues, "missing_name", "Profile > Full name", "", D.missingName, "Add your professional or legal name at the top of your resume. ATS systems use this identifier to create your candidate profile.", "error", 100);
  }
  if (!hasText(intel.designation)) {
    pts += issue(issues, "missing_designation", "Profile > Designation", "", D.missingDesignation, "Add a target designation title. This anchors your resume in the database and enables role-based keywords matching.", "error", 95);
  }

  const summary = intel.summaryText;
  if (!hasText(summary)) {
    let missingDesc = "Add a 2-4 sentence summary with target role, strengths, and measurable impact.";
    if (intel.stage === "Student") {
      missingDesc = "To stand out as a student, add academic projects, certifications, internships, hackathons, or measurable project outcomes to your summary.";
    } else if (intel.stage === "Fresher") {
      missingDesc = "As a fresher, showcase your internships, core technical strengths, and final-year project impact in your summary.";
    }
    pts += issue(issues, "missing_summary", "Profile > Summary", "", D.missingSummary, missingDesc, "error", 90);
  } else {
    if (summary.length < T.minSummaryLen) {
      pts += issue(issues, "short_summary", "Profile > Summary", summary, D.shortSummary, "Expand your summary to at least 80 characters. Describe your primary strengths, target role, and highest value achievement.", "warning", 80);
    }
    if (!HAS_METRIC_RE.test(summary)) {
      let suggestion = "Add one concrete metric, such as users supported, team size, budget managed, or project outcomes.";
      if (intel.stage === "Student") {
        suggestion = "To stand out as a student, add academic project outcomes, certifications, hackathon rankings, or GPA to your summary.";
      } else if (intel.stage === "Fresher") {
        suggestion = "As a fresher, showcase your internships, core technical strengths, or final-year project outcomes in your summary.";
      }
      const conf = (intel.stage === "Student" || intel.stage === "Fresher") ? 75 : 95;
      pts += issue(issues, "summary_no_metric", "Profile > Summary", short(summary), D.summaryNoMetric, suggestion, "tip", conf);
    }
    if (FILLER_WORDS_RE.test(summary)) {
      pts += issue(issues, "summary_filler", "Profile > Summary", first(FILLER_WORDS_RE, summary), D.summaryFiller, "Replace vague buzzwords (like 'hard-working' or 'passionate') with concrete achievements or technical skills.", "warning", 85);
    }
  }
  return pts;
};

const checkContact = (intel, issues) => {
  let pts = 0;
  if (!hasText(intel.email)) {
    pts += issue(issues, "missing_email", "Contact > Email", "", D.missingEmail, "Add a professional email address. ATS and recruiters need a direct contact field.", "error", 100);
  } else if (!EMAIL_RE.test(intel.email)) {
    pts += issue(issues, "invalid_email", "Contact > Email", intel.email, D.invalidEmail, "Use a valid email format such as name@example.com.", "error", 100);
  }
  if (!hasText(intel.phone)) {
    pts += issue(issues, "missing_phone", "Contact > Phone", "", D.missingPhone, "Add a phone number with country code.", "warning", 95);
  } else if (intel.phone.replace(/\D/g, "").length < 8) {
    pts += issue(issues, "invalid_phone", "Contact > Phone", intel.phone, D.invalidPhone, "Use a complete phone number. Include country code and enough digits.", "warning", 95);
  }
  if (!hasText(intel.location)) {
    pts += issue(issues, "missing_location", "Contact > Location", "", D.missingLocation, "Add city and country or region. Many ATS filters use location.", "warning", 85);
  }
  pts += optUrl(intel.linkedIn, "Contact > LinkedIn", "Use a full LinkedIn URL such as https://linkedin.com/in/username.", issues);
  pts += optUrl(intel.github, "Contact > GitHub", "Use a full GitHub URL such as https://github.com/username.", issues);
  pts += optUrl(intel.website, "Contact > Website", "Use a complete portfolio URL, including a valid domain.", issues);
  return pts;
};

const checkExperience = (intel, issues) => {
  const bypass = intel.hasInternship || intel.hasFreelancing || intel.hasOpenSource || intel.hasResearch || intel.hasHackathons;
  if (intel.jobs.length === 0) {
    if (bypass) return 0;
    return issue(issues, "missing_experience", "Experience", "", D.missingExperience, "Add at least one professional role, internship, or technical project to demonstrate hands-on application of your skills.", "error", 95);
  }
  let pts = 0;
  intel.jobs.forEach(job => {
    const lbl = "Experience " + job.index;
    if (!hasText(job.company)) pts += issue(issues, "missing_company", lbl + " > Company", "", D.missingCompany, "Add the company or organization name.", "error", 90);
    if (!hasText(job.role)) pts += issue(issues, "missing_role", lbl + " > Role", "", D.missingRole, "Add the role title exactly as you want recruiters and ATS to read it.", "error", 90);
    pts += checkDateRange(job.startDate, job.endDate, lbl, issues, true);
    if (!hasText(job.description)) {
      pts += issue(issues, "missing_experience_description", lbl + " > Description", "", D.missingExperienceDescription, "Add 2-4 bullets or sentences covering action, tools, and measurable impact.", "error", 95);
    } else {
      pts += checkQuality(job.description, lbl + " > Description", T.minExperienceDescLen, true, issues, intel.stage);
    }
  });
  return pts;
};

const checkEducation = (intel, issues) => {
  if (intel.educationList.length === 0) {
    return issue(issues, "missing_education", "Education", "", D.missingEducation, "Add education, training, bootcamp, or equivalent credential. If not applicable, add your strongest formal training.", "warning", 90);
  }
  let pts = 0;
  intel.educationList.forEach(edu => {
    const lbl = "Education " + edu.index;
    if (!hasText(edu.degree)) pts += issue(issues, "missing_degree", lbl + " > Degree", "", D.missingDegree, "Add the degree, certificate, or course name.", "error", 90);
    if (!hasText(edu.institution)) pts += issue(issues, "missing_institution", lbl + " > Institution", "", D.missingInstitution, "Add the school, university, or training provider.", "error", 90);
    pts += checkDateRange(edu.startDate, edu.endDate, lbl, issues, false);
  });
  return pts;
};

const checkSkills = (intel, issues) => {
  if (intel.skillsList.length === 0) return issue(issues, "missing_skills", "Skills", "", D.missingSkills, "Add 8-12 concrete skills. ATS keyword matching depends heavily on this section.", "error", 100);
  let pts = 0;
  if (intel.skillsList.length < T.tooFewSkillsCount) {
    pts += issue(issues, "too_few_skills", "Skills", String(intel.skillsList.length), D.tooFewSkills, "Only " + intel.skillsList.length + " skills are listed. Add enough hard skills to match the target role.", "warning", 85);
  }
  const seen = new Set();
  intel.skillsList.forEach((sk, idx) => {
    const lbl = "Skills " + (idx + 1);
    if (!hasText(sk.name)) { pts += issue(issues, "blank_skill", lbl + " > Name", "", D.blankSkill, "Remove the blank skill row or enter a specific skill name.", "error", 95); return; }
    const norm = normalizeSkillName(sk.name);
    if (seen.has(norm)) {
      pts += issue(issues, "duplicate_skill", lbl + " > Name", sk.name, D.duplicateSkill, "Remove duplicate skill listing: \"" + sk.name + "\". Keep one clear normalized entry per skill to maintain a clean layout.", "tip", 95);
    }
    seen.add(norm);
    pts += checkProgress(sk.progress, lbl + " > Proficiency", issues);
  });
  return pts;
};

const checkProjects = (intel, issues) => {
  const isSeniorOrLeadOrManager = ["Senior", "Lead", "Manager"].includes(intel.stage);
  if (isSeniorOrLeadOrManager && intel.jobs.length >= 2) {
    return 0;
  }
  if (intel.projectsList.length === 0 && intel.jobs.length <= 1) {
    return issue(issues, "missing_projects", "Projects", "", D.missingProjects, "Add one or two strong projects to showcase hands-on work if your experience is light.", "warning", 90);
  }
  let pts = 0;
  intel.projectsList.forEach(proj => {
    const lbl = "Projects " + proj.index;
    if (!hasText(proj.title)) pts += issue(issues, "missing_project_title", lbl + " > Title", "", D.missingProjectTitle, "Add a concise project title.", "error", 90);
    if (!hasText(proj.description)) {
      pts += issue(issues, "missing_project_description", lbl + " > Description", "", D.missingProjectDescription, "Add what the project does, what you used, and what improved.", "warning", 90);
    } else {
      pts += checkQuality(proj.description, lbl + " > Description", T.minProjectDescLen, false, issues, intel.stage);
      
      // Technical depth & deployment portfolio warnings
      const lowerDesc = proj.description.toLowerCase();
      if (!lowerDesc.includes("architecture") && !lowerDesc.includes("design") && !lowerDesc.includes("built") && !lowerDesc.includes("implement")) {
        pts += issue(issues, "project_architecture_weak", lbl + " > Description", short(proj.description), 0,
          "Project details lack architectural or implementation depth. Clarify the problem statement and design choices.", "tip", 80);
      }
      if (!lowerDesc.includes("deploy") && !lowerDesc.includes("aws") && !lowerDesc.includes("docker") && !lowerDesc.includes("kubernetes") && !lowerDesc.includes("cloud") && !lowerDesc.includes("vercel") && !lowerDesc.includes("github actions")) {
        pts += issue(issues, "project_deployment_missing", lbl + " > Description", short(proj.description), 0,
          "Missing details about deployment or cloud environment. Document how the application is built, deployed, or hosted.", "tip", 80);
      }
    }
    pts += optUrl(proj.github,  lbl + " > GitHub URL",   "Use a valid repository URL or leave the field empty.", issues);
    pts += optUrl(proj.liveDemo,lbl + " > Live demo URL", "Use a valid live demo URL or leave the field empty.", issues);
  });
  return pts;
};

const checkCertifications = (intel, issues) => {
  let pts = 0;
  intel.certificationsList.forEach(c => {
    const lbl = "Certifications " + c.index;
    if (!hasText(c.title)) pts += issue(issues, "missing_cert_title",  lbl + " > Title",  "",  D.missingCertTitle,  "Add the certification name or remove the blank certification row.", "error", 90);
    if (!hasText(c.issuer)) pts += issue(issues, "missing_cert_issuer", lbl + " > Issuer", "", D.missingCertIssuer, "Add the issuer so ATS and recruiters can verify the credential.", "error", 90);
    pts += checkYear(c.year, lbl + " > Year", issues);
  });
  return pts;
};

const checkLanguages = (intel, issues) => {
  let pts = 0;
  const seen = new Set();
  intel.languages.forEach((lang, idx) => {
    const lbl = "Languages " + (idx + 1);
    if (!hasText(lang.name)) { pts += issue(issues, "blank_language", lbl + " > Name", "", D.blankLanguage, "Remove the blank language row or enter a language name.", "tip", 80); return; }
    if (seen.has(lang.name.toLowerCase())) pts += issue(issues, "duplicate_language", lbl + " > Name", lang.name, D.duplicateLanguage, "Remove duplicate language entries.", "tip", 80);
    seen.add(lang.name.toLowerCase());
    pts += checkProgress(lang.progress, lbl + " > Proficiency", issues);
  });
  return pts;
};

const checkInterests = (intel, issues) => {
  let pts = 0;
  const seen = new Set();
  intel.interests.forEach((interest, idx) => {
    const lbl = "Interests " + (idx + 1);
    if (!hasText(interest)) { pts += issue(issues, "blank_interest", lbl, "", D.blankInterest, "Remove blank interest rows.", "tip", 80); return; }
    if (seen.has(interest.toLowerCase())) pts += issue(issues, "duplicate_interest", lbl, interest, D.duplicateInterest, "Remove duplicate interests.", "tip", 80);
    seen.add(interest.toLowerCase());
  });
  if (intel.interests.length > T.tooManyInterestsCount) {
    pts += issue(issues, "too_many_interests", "Interests", String(intel.interests.length), D.tooManyInterests,
      "Keep interests short or remove them for ATS-first resumes. Use the space for experience, skills, or projects.", "tip", 80);
  }
  return pts;
};

const checkPresentation = (intel, issues) => {
  let pts = 0;
  const template    = intel.template || "template1";
  const risk        = RULES.templateRisk[template];
  if (risk !== undefined) {
    const name = RULES.templateNames[template] || template;
    pts += issue(issues, "template_parse_risk", "Customization > Template", name, risk,
      "For ATS uploads, use Classic or Minimal. Keep visual templates for human-facing PDFs.", risk >= 6 ? "warning" : "tip", 80);
  }
  const photoUrl   = intel.photoUrl;
  const dec        = intel.decoratives || {};
  const photoShape = asText(dec.photoShape);
  if (hasText(photoUrl) && photoShape !== "none") {
    pts += issue(issues, "profile_photo_parse_risk", "Profile > Photo", "Photo attached", D.profilePhotoParseRisk,
      "Remove the photo for ATS-first resumes. Photos are often ignored and can reduce parser consistency.", "warning", 90);
  }
  const headerStyle = asText(dec.headerStyle);
  if (headerStyle === "full-bleed" || headerStyle === "card") {
    pts += issue(issues, "decorative_header", "Customization > Header style", headerStyle, D.decorativeHeader,
      "Use Minimal header style for ATS uploads. Decorative headers can change read order in some parsers.", "tip", 80);
  }
  if (String(dec.sectionIcons) === "true") {
    pts += issue(issues, "section_icons", "Customization > Section icons", "Enabled", D.sectionIcons,
      "Disable section icons for ATS uploads. Icons can be parsed as stray characters.", "warning", 80);
  }
  if (String(dec.sectionNumbers) === "true") {
    pts += issue(issues, "section_numbers", "Customization > Section numbers", "Enabled", D.sectionNumbers,
      "Disable section numbers if the resume is being uploaded to an ATS. Plain section headings parse cleaner.", "tip", 80);
  }
  const divStyle = asText(dec.dividerStyle);
  if (divStyle === "dots" || divStyle === "gradient") {
    pts += issue(issues, "decorative_divider", "Customization > Divider style", divStyle, D.decorativeDivider,
      "Use a simple line divider or no divider for ATS uploads.", "tip", 80);
  }
  const progStyle = asText(dec.progressStyle);
  if (progStyle === "bar" || progStyle === "dots") {
    pts += issue(issues, "visual_progress", "Customization > Skill progress style", progStyle, D.visualProgress,
      "ATS reads skill names, not bars or dots. Keep the skill names textual and do not rely on visual proficiency.", "tip", 80);
  }
  if (hasText(intel.fontPairing) && intel.fontPairing !== "inter") {
    pts += issue(issues, "custom_font", "Customization > Font", intel.fontPairing, D.customFont,
      "Use a common system-like font for ATS uploads. Keep custom fonts for human-facing versions.", "tip", 80);
  }
  return pts;
};

const checkKeywords = (intel, category, issues) => {
  const keywords = RULES.categories[category] || [];
  if (keywords.length === 0) return 0;
  const fullText = allText(intel.rawResume).toLowerCase();
  let missing  = keywords.filter(kw => !fullText.includes(kw.toLowerCase()));
  if (missing.length === 0) return 0;

  missing = filterMissingKeywords(missing, fullText, category, intel.stage, intel.rawResume);
  if (missing.length === 0) return 0;

  const ratio = missing.length / keywords.length;
  const pts   = Math.max(D.keywordGapMin, Math.round(D.keywordGapMax * ratio));
  const top   = missing.slice(0, T.maxKeywordDisplay);
  
  const suggestion = "Including key technical terms for a " + category + " role helps parser matching. If you have experience with these adjacent concepts, consider adding them to your skills or project descriptions: " + top.join(", ") + ". Otherwise, focus on clarifying your core strengths.";

  return issue(issues, "keyword_gap", "Role keywords", "Missing: " + top.join(", "), pts, suggestion, pts >= 10 ? "warning" : "tip", 90);
};

// ─── Helpers & Date Utilities ────────────────────────────────────────────────

const checkDateRange = (start, end, section, issues, allowPresent) => {
  let pts = 0;
  if (!hasText(start)) pts += issue(issues, "missing_start_date", section + " > Start date", "", D.missingStartDate, "Add a start month and year.", "warning", 90);
  if (!hasText(end))   pts += issue(issues, "missing_end_date",   section + " > End date",   "", D.missingEndDate,   allowPresent ? "Add an end month/year or mark it as Present." : "Add an end month and year.", "warning", 90);
  if (!hasText(start) || !hasText(end)) return pts;
  if (asText(end).toLowerCase() === "present") {
    if (!allowPresent) pts += issue(issues, "invalid_end_date", section + " > End date", end, D.invalidEndDate, "Use a real end month and year for this section.", "warning", 90);
    return pts;
  }
  const sv = parseMonthYear(start), ev = parseMonthYear(end);
  if (sv === null) pts += issue(issues, "invalid_start_date", section + " > Start date", start, D.invalidStartDate, "Use the editor date format: month plus four-digit year.", "warning", 85);
  if (ev === null) pts += issue(issues, "invalid_end_date",   section + " > End date",   end,   D.invalidEndDate,   "Use the editor date format: month plus four-digit year.", "warning", 85);
  if (sv !== null && ev !== null && sv > ev) pts += issue(issues, "date_order", section + " > Dates", asText(start) + " to " + asText(end), D.dateOrder, "Start date is after end date. Correct the timeline before applying.", "error", 95);
  return pts;
};

const checkQuality = (text, section, minLen, requireMetric, issues, stage) => {
  let pts = 0;
  const v = asText(text);
  if (v.length < minLen)              pts += issue(issues, "short_description",   section, v,                          D.shortDescription,  "Add more detail: action, tools, scope, and result.", "warning", 80);
  if (!ACTION_VERB_RE.test(v))        pts += issue(issues, "missing_action_verb", section, short(v),                   D.missingActionVerb, "Start at least one sentence or bullet with a strong action verb such as Built, Led, Improved, Reduced, or Automated.", "tip", 85);
  
  if (requireMetric && !HAS_METRIC_RE.test(v)) {
    const conf = (stage === "Student" || stage === "Fresher") ? 75 : 95;
    pts += issue(issues, "missing_metric", section, short(v),             D.missingMetric,     "Add a number or measurable result, for example: Reduced latency by 40% or Supported 10K users.", "warning", conf);
  }
  
  if (PASSIVE_VOICE_RE.test(v))       pts += issue(issues, "passive_voice",        section, first(PASSIVE_VOICE_RE,v), D.passiveVoice,      "Rewrite this in active voice. Use a direct action verb and state your impact.", "warning", 90);
  if (FILLER_WORDS_RE.test(v))        pts += issue(issues, "filler_word",          section, first(FILLER_WORDS_RE,v), D.fillerWord,        "Remove vague wording and replace it with a concrete action or result.", "warning", 85);
  return pts;
};

const checkProgress = (progress, section, issues) => {
  if (progress === null || progress === undefined) return issue(issues, "missing_progress", section, "", D.missingProgress, "Set a proficiency value or remove the visual proficiency control for ATS-first resumes.", "tip", 80);
  if (progress < 0 || progress > 100)              return issue(issues, "invalid_progress", section, String(progress), D.invalidProgress, "Keep proficiency between 0 and 100.", "tip", 80);
  return 0;
};

const checkYear = (year, section, issues) => {
  if (!hasText(year)) return issue(issues, "missing_cert_year", section, "", D.missingCertYear, "Add the completion year or remove the year field if unknown.", "tip", 80);
  if (!/^\d{4}$/.test(asText(year))) return issue(issues, "invalid_year", section, asText(year), D.invalidYear, "Use a four-digit year.", "warning", 85);
  const n = parseInt(asText(year), 10);
  if (n < 1950 || n > CURRENT_YEAR + 10) return issue(issues, "year_out_of_range", section, asText(year), D.yearOutOfRange, "Use a realistic year.", "warning", 85);
  return 0;
};

const required = (issues, type, section, value, points, fix, confidence = 90) => {
  if (hasText(value)) return 0;
  return issue(issues, type, section, "", points, fix, points >= 5 ? "error" : "warning", confidence);
};

const optUrl = (value, section, fix, issues) => {
  const url = asText(value);
  if (!hasText(url)) return 0;
  if (!URL_RE.test(url)) return issue(issues, "invalid_url", section, url, D.invalidUrl, fix, "tip", 90);
  return 0;
};

const issue = (issues, type, section, original, points, suggestion, severity, confidence = 90) => {
  if (confidence < 70) return 0;
  issues.push({ type, section, original: asText(original), suggestion, severity, points, confidence });
  return points;
};

const normalizeSkillName = (s) => {
  return asText(s).toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
};

// ─── Phase 4, 5, 6, 7 & 9: Engine Optimization Pipeline ──────────────────────

const optimizeRecommendations = (rawIssues, intel) => {
  const hasAny = (items, terms) => items.some(item => terms.some(term => item.toLowerCase().includes(term)));
  const isDeployedProject = (proj) => {
    const text = asText(proj.title + " " + proj.description + " " + proj.github + " " + proj.liveDemo).toLowerCase();
    return ["deploy", "deployed", "render", "vercel", "netlify", "aws", "gcp", "azure", "docker", "kubernetes", "railway", "heroku"].some(term => text.includes(term));
  };
  // Step 1: Duplicate Elimination & Merging (Phase 4)
  const grouped = {};
  const singleTypes = ["missing_name", "missing_designation", "missing_email", "missing_phone", "missing_location", "missing_summary", "missing_education", "missing_skills", "missing_projects", "missing_experience", "template_parse_risk", "profile_photo_parse_risk", "keyword_gap"];
  
  const mergedIssues = [];

  rawIssues.forEach(iss => {
    if (singleTypes.includes(iss.type)) {
      mergedIssues.push(iss);
    } else {
      if (!grouped[iss.type]) {
        grouped[iss.type] = [];
      }
      grouped[iss.type].push(iss);
    }
  });

  Object.keys(grouped).forEach(type => {
    const list = grouped[type];
    if (list.length === 1) {
      mergedIssues.push(list[0]);
    } else {
      // Group multiple identical advice issues into a single summary block
      const firstIss = list[0];
      const sections = list.map(i => i.section);
      const sumPoints = Math.min(15, list.reduce((sum, i) => sum + (i.points || 0), 0));
      const avgConfidence = Math.round(list.reduce((sum, i) => sum + i.confidence, 0) / list.length);
      
      let groupedSuggestion = firstIss.suggestion;
      if (type === "missing_metric") {
        groupedSuggestion = "Quantifiable metrics are missing across multiple experience/project bullet points. Add measurable numbers (revenue, users, percentages) to prove your impact.";
      } else if (type === "missing_action_verb") {
        groupedSuggestion = "Multiple descriptive sentences do not start with action verbs. Replace passive statements with direct action verbs like Built, Led, or Optimized.";
      } else if (type === "passive_voice") {
        groupedSuggestion = "Passive voice phrasing detected across multiple lines. Rewrite using active verbs.";
      } else if (type === "filler_word") {
        groupedSuggestion = "Redundant filler buzzwords are listed multiple times. Simplify statements to maintain professional tone.";
      }
      
      mergedIssues.push({
        type: firstIss.type,
        section: firstIss.section.split(" ")[0],
        original: "",
        suggestion: groupedSuggestion,
        severity: firstIss.severity,
        points: sumPoints,
        confidence: avgConfidence,
        affected: sections
      });
    }
  });

  // Step 2: Prioritization Sorting (Phase 6 - stable lexicographical)
  const rank = (s) => (s === "error" ? 0 : s === "warning" ? 1 : 2);
  mergedIssues.sort((a, b) => {
    const r = rank(a.severity) - rank(b.severity);
    if (r !== 0) return r;
    const p = (b.points || 0) - (a.points || 0);
    if (p !== 0) return p;
    const t = a.type.localeCompare(b.type);
    if (t !== 0) return t;
    return a.section.localeCompare(b.section);
  });

  // Step 3: Anti-Spam Gate constraints (Phase 9)
  const errors = mergedIssues.filter(i => i.severity === "error" && i.confidence >= 70).slice(0, 2);
  const warnings = mergedIssues.filter(i => i.severity === "warning" && i.confidence >= 80).slice(0, 3);
  const tips = mergedIssues.filter(i => i.severity === "tip" && i.confidence >= 85).slice(0, 3);

  const capped = [...errors, ...warnings, ...tips].slice(0, 8);
  const seenAdvice = new Set();

  // Step 4: Late formatting of suggestion strings (Phase 5, 2, 7)
  const finalSuggestions = capped.map(iss => {
    let evidence = "";
    let impact = { ats: 1, recruiter: 3, interview: 3 };
    let exampleText = "";

    const isGrouped = (iss.affected && iss.affected.length > 0);
    const key = iss.type + "|" + iss.section + "|" + asText(iss.suggestion).toLowerCase();
    if (seenAdvice.has(key)) return null;
    seenAdvice.add(key);

    if (iss.type === "keyword_gap") {
      evidence = "Resume matches " + intel.targetRole + " profile but lacks adjacent stack terms";
      impact = { ats: 5, recruiter: 4, interview: 3 };
      exampleText = intel.projectsList[0]?.title ? intel.projectsList[0].title + " - Included only adjacent stack terms already reflected in the project context." : "Include only stack terms that reflect real project work.";
    } else if (iss.type === "missing_metric") {
      if (isGrouped) {
        evidence = "Multiple occurrences of missing_metric layout error";
        impact = { ats: 2, recruiter: 5, interview: 5 };
      } else {
        evidence = "Bullets contain descriptive text but lack numerical symbols (%)";
        impact = { ats: 2, recruiter: 5, interview: 5 };
        const job = intel.jobs[0] || {};
        exampleText = job.company ? job.company + " - Reduced API latency by 30%." : "Improved inference runtime by 25%.";
      }
    } else if (iss.type === "project_deployment_missing") {
      if (intel.projectsList.some(isDeployedProject)) {
        return null;
      }
      evidence = "Project descriptions do not include deployment or hosting details";
      impact = { ats: 1, recruiter: 4, interview: 5 };
      const proj = intel.projectsList[0] || {};
      exampleText = proj.title ? proj.title + " - Deployed on Render with a production build pipeline." : "Deployed application on AWS using GitHub Actions.";
    } else if (iss.type === "project_architecture_weak") {
      evidence = "Project description does not describe engineering pattern details";
      impact = { ats: 1, recruiter: 3, interview: 4 };
      const proj = intel.projectsList[0] || {};
      exampleText = proj.title ? proj.title + " - Designed a multi-tier microservices architecture." : "Designed system using Event-Driven pattern.";
    } else if (iss.type.startsWith("missing_")) {
      evidence = "Required section field [" + iss.section + "] is blank";
      impact = { ats: 5, recruiter: 5, interview: 2 };
    } else {
      if (isGrouped) {
        evidence = "Multiple occurrences of " + iss.type + " layout error";
        impact = { ats: 2, recruiter: 5, interview: 5 };
      } else {
        evidence = "Parser warning flag triggered on layout check";
        impact = { ats: 3, recruiter: 2, interview: 1 };
      }
    }

    const formatted = formatRecruiterSuggestion(
      iss.type,
      iss.section,
      iss.original,
      iss.points,
      iss.suggestion,
      iss.severity,
      evidence,
      impact,
      iss.affected || [],
      exampleText
    );

    return {
      type: iss.type,
      section: iss.section,
      original: iss.original,
      suggestion: formatted,
      severity: iss.severity,
      points: iss.points,
      confidence: iss.confidence
    };
  }).filter(Boolean);

  return finalSuggestions;
};

// ─── Core Export Implementation ──────────────────────────────────────────────

export const computeAtsReport = (resume = {}) => {
  const intel = analyzeResumeIntelligence(resume);
  const rawIssues = [];

  // Run all check validations against intel
  checkProfile(intel, rawIssues);
  checkContact(intel, rawIssues);
  checkExperience(intel, rawIssues);
  checkEducation(intel, rawIssues);
  checkSkills(intel, rawIssues);
  checkProjects(intel, rawIssues);
  checkCertifications(intel, rawIssues);
  checkLanguages(intel, rawIssues);
  checkInterests(intel, rawIssues);
  checkPresentation(intel, rawIssues);

  const isMatchedRole = intel.specialization && intel.specialization !== "General Resume";
  if (isMatchedRole) {
    checkKeywords(intel, intel.specialization.toLowerCase(), rawIssues);
  }

  // Optimize & Merge & CAP Suggestions
  const issues = optimizeRecommendations(rawIssues, intel);

  // Recalculate score from surviving filtered suggestions
  const deductions = issues.reduce((sum, i) => sum + (i.points || 0), 0);
  const score = Math.max(0, Math.min(100, 100 - deductions));

  let overallFeedback;
  const roleStr  = intel.specialization ? " for a " + intel.specialization + " role" : "";
  if      (score >= 95) overallFeedback = "Exceptional recruiter-grade resume structure" + roleStr + ". Excellent focus, technical depth, and metrics.";
  else if (score >= 90) overallFeedback = "Highly Competitive candidate profile" + roleStr + ". Formatted well with strong impact alignment.";
  else if (score >= 80) overallFeedback = "Good ATS foundation" + roleStr + ". Address the remaining warning(s) and tip(s) to optimize.";
  else if (score >= 70) overallFeedback = "Average performance" + roleStr + ". Enhance your project details and experience bullets to stand out.";
  else if (score >= 60) overallFeedback = "Needs Improvement" + roleStr + ". Resolve critical issues and warnings to lower ATS risk.";
  else                  overallFeedback = "Major Resume Issues detected" + roleStr + ". High formatting and missing fields risk; overhaul structure before applying.";

  // Strengths list
  const strengths = [];
  if (intel.yearsOfExperience >= 5) {
    strengths.push("Good technical progression & career stability");
  }
  if (intel.achievementQuality > 75) {
    strengths.push("Strong measurable achievements with business metrics");
  }
  if (intel.technicalDepth > 75) {
    strengths.push("Excellent project complexity & technical depth");
  }
  if (intel.specialization !== "General Software Engineer" && intel.specialization !== "General Resume") {
    strengths.push("Clear specialization alignment: " + intel.specialization);
  }
  if (intel.atsCompatibility === 100) {
    strengths.push("Well-structured layout with optimal parser safety");
  }
  if (intel.projectMaturity === "High") {
    strengths.push("Excellent project complexity & technical depth");
  } else if (intel.projectMaturity === "Medium") {
    strengths.push("Solid project evidence across multiple builds");
  }
  if (intel.hasLeadership) {
    strengths.push("Leadership or coordination evidence is present");
  }
  if (intel.hasOpenSource) {
    strengths.push("Open-source or GitHub evidence is present");
  }
  if (strengths.length < 3) {
    strengths.push("Well-structured ATS-ready formatting foundations");
    strengths.push("Clear visual categorization sections");
    strengths.push("Contact details are complete and readable");
  }

  return { score, atsScore: score, issues, overallFeedback, category: intel.specialization, strengths };
};

// ─── Extra Helpers ───────────────────────────────────────────────────────────

const detectCareerStage = (resume) => {
  const designation = asText(resume.profileInfo?.designation || "").toLowerCase();
  const summary = asText(resume.profileInfo?.summary || "").toLowerCase();
  const isStudentTitle = designation.includes("student") || designation.includes("intern") || designation.includes("undergrad") || designation.includes("candidate");
  
  let hasFutureEducation = false;
  (resume.education || []).forEach(edu => {
    const end = asText(edu.endDate).toLowerCase();
    if (end.includes("present") || end.includes("expected")) {
      hasFutureEducation = true;
    }
  });

  if (isStudentTitle || hasFutureEducation) return "Student";
  if (designation.includes("fresher") || designation.includes("graduate")) return "Fresher";
  if (designation.includes("manager") || designation.includes("director") || designation.includes("vp")) return "Manager";
  if (designation.includes("lead")) return "Lead";
  if (designation.includes("senior") || designation.includes("sr.")) return "Senior";
  if (designation.includes("junior") || designation.includes("jr.")) return "Junior";
  return "Mid-Level";
};

const detectCareerPath = (resume, designation, text) => {
  const lowerDes = designation.toLowerCase();
  
  // Scoring specialization matrices
  const matrix = {
    "Backend Java": {
      terms: ["java", "spring", "spring boot", "maven", "hibernate", "jpa", "junit"],
      skills: ["java", "spring boot"]
    },
    "Frontend": {
      terms: ["javascript", "typescript", "react", "html", "css", "vue", "angular", "next.js"],
      skills: ["react", "typescript", "javascript", "html", "css"]
    },
    "Machine Learning": {
      terms: ["python", "pytorch", "tensorflow", "ml", "machine learning", "nlp", "scikit-learn"],
      skills: ["python", "pytorch", "tensorflow"]
    },
    "DevOps": {
      terms: ["docker", "kubernetes", "jenkins", "ci/cd", "terraform", "ansible", "aws", "gcp"],
      skills: ["docker", "kubernetes", "aws", "terraform"]
    },
    "QA": {
      terms: ["selenium", "cypress", "testng", "cucumber", "testing", "manual testing"],
      skills: ["selenium", "testing"]
    },
    "Data Analyst": {
      terms: ["sql", "power bi", "tableau", "excel", "data analysis", "pandas"],
      skills: ["sql", "power bi", "excel", "tableau"]
    }
  };

  let bestPath = "General Software Engineer";
  let maxScore = 0;

  for (const pathName in matrix) {
    let score = 0;
    const item = matrix[pathName];
    
    // Weight: Designation matches
    item.terms.forEach(term => {
      if (lowerDes.includes(term)) score += 12;
    });

    // Weight: Skills matches
    (resume.skills || []).forEach(sk => {
      const name = asText(sk.name).toLowerCase();
      item.skills.forEach(term => {
        if (name.includes(term)) score += 4;
      });
    });

    // Weight: Text mentions
    item.terms.forEach(term => {
      if (text.includes(term)) score += 1;
    });

    if (score > maxScore) {
      maxScore = score;
      bestPath = pathName;
    }
  }

  if (maxScore < 8) {
    return "General Software Engineer";
  }
  return bestPath;
};

const filterMissingKeywords = (missing, lowerText, category, stage, resume) => {
  const designation = asText(resume.profileInfo?.designation || "");
  const careerPath = detectCareerPath(resume, designation, lowerText);
  const isJuniorOrStudent = ["Student", "Fresher", "Junior"].includes(stage);

  return missing.filter(kw => {
    const kwLower = kw.toLowerCase();

    // Logical keyword adjacency rules (Phase 2)
    if (kwLower === "spring boot" && !lowerText.includes("java")) return false;
    if (kwLower === "typescript" && !lowerText.includes("react") && !lowerText.includes("javascript")) return false;
    if (["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch"].includes(kwLower) && !lowerText.includes("python")) return false;
    if (kwLower === "kubernetes" && !lowerText.includes("docker")) return false;
    if (kwLower === "microservices" && !lowerText.includes("rest api") && !lowerText.includes("backend") && !lowerText.includes("spring") && !lowerText.includes("node")) return false;

    // Career Path specialization filter rules
    if (category.toLowerCase() === "software engineer") {
      if (careerPath === "Backend Java") {
        const forbidden = ["react", "typescript", "javascript", "vue", "angular", "html", "css", "pandas", "pytorch", "tensorflow"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "Frontend") {
        const forbidden = ["java", "spring boot", "hibernate", "maven", "python", "pytorch", "tensorflow", "docker", "kubernetes", "c++"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "Machine Learning") {
        const forbidden = ["react", "typescript", "javascript", "spring boot", "hibernate", "angular", "vue", "html", "css"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "DevOps") {
        const forbidden = ["react", "typescript", "javascript", "spring boot", "hibernate", "angular", "vue", "html", "css"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "QA") {
        const forbidden = ["react", "typescript", "docker", "kubernetes", "spring boot", "hibernate", "microservices", "aws", "azure", "gcp"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "Data Analyst") {
        const forbidden = ["react", "typescript", "docker", "kubernetes", "spring boot", "hibernate", "microservices", "aws", "gcp", "azure"];
        if (forbidden.includes(kwLower)) return false;
      } else if (careerPath === "General Software Engineer") {
        const specialized = ["spring boot", "hibernate", "react", "typescript", "kubernetes", "tensorflow", "pytorch", "scikit-learn", "vue", "angular", "pandas", "numpy"];
        if (specialized.includes(kwLower)) return false;
      }
    }

    if (isJuniorOrStudent) {
      if (["kubernetes", "docker", "microservices", "ci/cd", "aws", "system design"].includes(kwLower)) {
        const infra = ["linux", "git", "rest api", "sql", "cloud", "backend"];
        return infra.some(term => lowerText.includes(term));
      }
    }

    return true;
  });
};

const allText = (resume) => {
  const p = [];
  const pr = resume.profileInfo || {};
  const co = resume.contactInfo || {};
  p.push(asText(pr.fullName), asText(pr.designation), asText(pr.summary));
  p.push(asText(co.location), asText(co.linkedIn), asText(co.github), asText(co.website));
  (resume.workExperience || []).forEach(j => p.push(asText(j.company), asText(j.role), asText(j.description)));
  (resume.education      || []).forEach(e => p.push(asText(e.degree), asText(e.institution)));
  (resume.skills         || []).forEach(s => p.push(asText(s.name)));
  (resume.projects       || []).forEach(q => p.push(asText(q.title), asText(q.description), asText(q.github), asText(q.liveDemo)));
  (resume.certifications || []).forEach(c => p.push(asText(c.title), asText(c.issuer), asText(c.year)));
  (resume.languages      || []).forEach(l => p.push(asText(l.name)));
  (resume.interests      || []).forEach(i => p.push(asText(i)));
  return p.join(" ");
};

// Re-exports
export const CATEGORY_KEYWORDS = RULES.categories;
export const ATS_RULES         = RULES;
