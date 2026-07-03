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
  let str = asText(value).trim().toLowerCase();
  str = str.replace(/^expected\s+/, "");
  const parts = str.split(/\s+/);
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    const year = parseInt(parts[0], 10);
    if (year < 1950 || year > CURRENT_YEAR + 10) return null;
    return year * 12 + 1; // default to Jan
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

const formatRecruiterSuggestion = (type, section, original, points, suggestion, severity) => {
  if (type === "keyword_gap") {
    return `Reason: Key technical role keywords are missing.\nWhy it matters: ATS algorithms utilize keyword frequencies to rank candidates.\nActionable improvement: ${suggestion}\nRecruiter impact: Boosts search query match scores and technical indexing.\nExample: Include missing keywords in relevant project descriptions.`;
  }
  if (suggestion && suggestion.includes("Reason:")) return suggestion;
  
  const formatted = {
    missing_name: {
      reason: "Full name is missing from the resume header.",
      why: "ATS parsers require a clear name identifier to create and index a candidate profile.",
      action: "Add your full legal or professional name at the very top of the page in a large, readable font.",
      impact: "Allows recruiters to instantly find your candidate record and index your application.",
      example: "John Doe"
    },
    missing_designation: {
      reason: "Target role designation is missing.",
      why: "ATS systems and recruiters check this designation to map your profile to open roles.",
      action: "Add a target role title matching your career goal directly under your name.",
      impact: "Aligns your resume with automated filters and recruiter role categories.",
      example: "Software Engineer"
    },
    missing_summary: {
      reason: "Professional summary is missing.",
      why: "A summary provides a high-level overview of your career trajectory and key value before recruiters dig into detail.",
      action: "Add a 2-4 sentence summary summarizing your target role, top strengths, and highest measurable impact.",
      impact: "Reduces screening time and increases immediate engagement.",
      example: "Result-driven Software Engineer with 4 years of experience building high-scale Java APIs. Reduced latency by 20%."
    },
    summary_no_metric: {
      reason: "Your professional summary lacks quantifiable metrics or outcomes.",
      why: "Recruiters evaluate candidate strength using measurable achievements, not just static task lists.",
      action: "Add at least one numerical metric (e.g. team size, user count, optimization percentage, hackathon rank).",
      impact: "Boosts credibility and demonstrates results-oriented work habits.",
      example: "Optimized SQL database indexing, reducing query runtimes by 30%."
    },
    missing_email: {
      reason: "Email address is missing.",
      why: "Email is the primary index contact key for automated system communications and scheduler integrations.",
      action: "Add a clean, professional email address to your header contact block.",
      impact: "Enables instant automated interview invitations and follow-ups.",
      example: "alex.dev@gmail.com"
    },
    missing_phone: {
      reason: "Phone contact is missing.",
      why: "Recruiting teams use phone numbers for initial screeners and fast-track communications.",
      action: "Add your mobile phone number including country code to your header.",
      impact: "Accelerates screening and scheduling touchpoints.",
      example: "+1 555-0100"
    },
    missing_location: {
      reason: "Candidate location is missing.",
      why: "ATS systems filter applications by region, tax jurisdiction, or relocation flags.",
      action: "Add your city and state/country to the contact header.",
      impact: "Prevents automatic rejection by geographic routing rules.",
      example: "Boston, MA"
    },
    missing_experience: {
      reason: "No work experience or project experience is detected.",
      why: "ATS and recruiters look for proof of applied knowledge through jobs, projects, or internships.",
      action: "Add professional experience, custom internships, or capstone projects to show hands-on work.",
      impact: "Fulfills the core requirement for technical validation.",
      example: "Add a section listing your capstone software project or technical internship."
    },
    missing_skills: {
      reason: "Skills section is missing or empty.",
      why: "Recruiters use skills sections to filter candidates on target keyword combinations.",
      action: "Add 8-12 core hard skills matching your target career role.",
      impact: "Improves keyword relevance matching in search queries.",
      example: "Java, Spring Boot, React, SQL, Git, Docker"
    },
    duplicate_skill: {
      reason: "Duplicate or redundant skills detected.",
      why: "Listing the same skill multiple times (e.g. JS and JavaScript) looks disorganized and wastes space.",
      action: "Consolidate duplicate listings into one standard textual name.",
      impact: "Shows professional attention to detail and saves valuable layout space.",
      example: "Consolidate 'JS' and 'JavaScript' into one entry: 'JavaScript'."
    }
  };

  const item = formatted[type];
  if (item) {
    return `Reason: ${item.reason}\nWhy it matters: ${item.why}\nActionable improvement: ${item.action}\nRecruiter impact: ${item.impact}\nExample: ${item.example}`;
  }

  return `Reason: ${suggestion}\nWhy it matters: Helps maintain layout quality, ATS readability, and recruiter compliance.\nActionable improvement: Adjust this section to use clean text, valid URLs, or clear dates.\nRecruiter impact: Reduces manual screening friction.\nExample: Verify section completeness.`;
};

const issue = (issues, type, section, original, points, suggestion, severity, confidence = 90) => {
  if (confidence < 70) return 0;
  const formattedSuggestion = formatRecruiterSuggestion(type, section, original, points, suggestion, severity);
  issues.push({ type, section, original: asText(original), suggestion: formattedSuggestion, severity, points, confidence });
  return points;
};

const required = (issues, type, section, value, points, fix, confidence = 90) => {
  if (hasText(value)) return 0;
  return issue(issues, type, section, "", points, fix, points >= 5 ? "error" : "warning", confidence);
};

const optUrl = (url, section, fix, issues) => {
  const t = asText(url);
  if (!t) return 0;
  return URL_RE.test(t) ? 0 : issue(issues, "invalid_url", section, t, D.invalidUrl, fix, "tip", 90);
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
export const detectCategory = (designation, resume = {}) => {
  if (!designation || !designation.trim()) return "General Resume";
  
  const lowerDes = designation.toLowerCase();
  const summary = (resume.profileInfo?.summary || "").toLowerCase();
  const skills = (resume.skills || []).map(s => (s.name || "").toLowerCase());
  
  const roles = [
    { name: "Software Engineer", primary: ["software engineer", "software developer", "swe", "programmer"] },
    { name: "Java Developer", primary: ["java developer", "java engineer", "java backend"] },
    { name: "Backend Developer", primary: ["backend developer", "backend engineer", "api developer"] },
    { name: "Frontend Developer", primary: ["frontend developer", "frontend engineer", "react developer", "ui developer"] },
    { name: "Full Stack Developer", primary: ["full stack developer", "full stack engineer", "fullstack"] },
    { name: "Android Developer", primary: ["android developer", "android engineer", "mobile developer", "ios developer", "flutter"] },
    { name: "Data Analyst", primary: ["data analyst", "bi analyst", "analytics", "business intelligence"] },
    { name: "Data Scientist", primary: ["data scientist", "data science"] },
    { name: "Machine Learning Engineer", primary: ["machine learning engineer", "ml engineer", "nlp engineer", "deep learning"] },
    { name: "AI Engineer", primary: ["ai engineer", "artificial intelligence engineer", "ai developer"] },
    { name: "Cloud Engineer", primary: ["cloud engineer", "cloud architect", "aws engineer", "azure engineer"] },
    { name: "DevOps Engineer", primary: ["devops engineer", "site reliability engineer", "sre", "infrastructure engineer"] },
    { name: "QA Engineer", primary: ["qa engineer", "quality assurance", "software tester"] },
    { name: "Automation Tester", primary: ["automation tester", "test automation", "qa automation"] },
    { name: "Cyber Security", primary: ["cyber security", "information security", "penetration tester", "security analyst"] },
    { name: "Network Engineer", primary: ["network engineer", "network administrator"] },
    { name: "UI Designer", primary: ["ui designer", "user interface designer"] },
    { name: "UX Designer", primary: ["ux designer", "user experience designer"] },
    { name: "Product Designer", primary: ["product designer", "interaction designer"] },
    { name: "Product Manager", primary: ["product manager", "pm", "associate product manager"] },
    { name: "Business Analyst", primary: ["business analyst", "ba"] },
    { name: "Technical Writer", primary: ["technical writer", "documentation specialist"] },
    { name: "HR", primary: ["hr", "human resources", "recruiter", "talent acquisition"] },
    { name: "Marketing", primary: ["marketing", "digital marketing", "seo specialist"] },
    { name: "Finance", primary: ["finance", "financial analyst", "accountant"] },
    { name: "Sales", primary: ["sales", "account executive", "business development"] },
    { name: "Mechanical", primary: ["mechanical engineer", "mechanical design"] },
    { name: "Civil", primary: ["civil engineer", "structural engineer"] },
    { name: "Electrical", primary: ["electrical engineer"] },
    { name: "Embedded", primary: ["embedded systems", "embedded software", "firmware"] },
    { name: "IoT", primary: ["iot engineer", "internet of things"] },
    { name: "Research", primary: ["researcher", "research scientist", "research assistant"] },
    { name: "Academic", primary: ["professor", "teacher", "lecturer", "academic"] }
  ];

  let bestRole = "General Resume";
  let maxScore = 0;

  for (const role of roles) {
    let score = 0;
    for (const term of role.primary) {
      if (lowerDes.includes(term)) {
        score += 15;
      }
      for (const sk of skills) {
        if (sk.includes(term)) {
          score += 3;
        }
      }
      if (summary.includes(term)) {
        score += 2;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestRole = role.name;
    }
  }

  if (maxScore < 10) {
    return "General Resume";
  }

  return bestRole;
};

const detectCareerStage = (resume) => {
  const title = (resume.profileInfo?.designation || "").toLowerCase();
  const summary = (resume.profileInfo?.summary || "").toLowerCase();
  
  const isStudentTitle = title.includes("student") || title.includes("intern") || title.includes("undergrad") || title.includes("candidate");
  const hasFutureEducation = (resume.education || []).some(edu => {
    const end = (edu.endDate || "").toLowerCase();
    if (end.includes("present") || end.includes("expected")) return true;
    const parts = end.trim().split(/\s+/);
    if (parts.length === 2) {
      const year = parseInt(parts[1], 10);
      if (year >= new Date().getFullYear()) return true;
    } else if (/^\d{4}$/.test(end)) {
      if (parseInt(end, 10) >= new Date().getFullYear()) return true;
    }
    return false;
  });
  
  if (isStudentTitle || hasFutureEducation) return "Student";
  if (title.includes("fresher") || title.includes("graduate")) return "Fresher";
  if (title.includes("manager") || title.includes("director") || title.includes("vp") || title.includes("head") || title.includes("pm")) return "Manager";
  if (title.includes("lead") || title.includes("coordinator")) return "Lead";
  if (title.includes("senior") || title.includes("sr.") || title.includes("architect") || title.includes("principal")) return "Senior";
  if (title.includes("junior") || title.includes("jr.")) return "Junior";
  
  const expCount = (resume.workExperience || []).length;
  const internshipCount = (resume.customSections?.internships || []).length;
  if (expCount === 0 && internshipCount === 0) return "Fresher";
  
  return "Mid-Level";
};

const detectCareerPath = (resume, designation, fullText) => {
  const lowerDes = designation.toLowerCase();
  const lowerText = fullText.toLowerCase();
  const skills = (resume.skills || []).map(s => (s.name || "").toLowerCase());

  const paths = {
    "Backend Java": {
      terms: ["java", "spring", "hibernate", "junit", "maven", "gradle", "jpa", "spring boot"],
      skills: ["java", "spring boot", "spring", "hibernate", "jpa", "maven"]
    },
    "Frontend": {
      terms: ["react", "typescript", "redux", "next.js", "nextjs", "vue", "angular", "css", "html", "figma", "ui/ux", "responsive design", "tailwind"],
      skills: ["react", "typescript", "javascript", "vue", "angular", "css", "html", "tailwind", "next.js", "nextjs"]
    },
    "Machine Learning": {
      terms: ["tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "deep learning", "keras", "machine learning", "nlp", "computer vision", "data science"],
      skills: ["tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "machine learning"]
    },
    "DevOps": {
      terms: ["docker", "kubernetes", "ci/cd", "terraform", "github actions", "jenkins", "aws", "azure", "gcp", "prometheus", "grafana", "ansible", "devops"],
      skills: ["docker", "kubernetes", "terraform", "jenkins", "aws", "devops", "ci/cd"]
    },
    "QA": {
      terms: ["selenium", "junit", "testng", "postman", "api testing", "cypress", "qa", "testing", "automation testing"],
      skills: ["selenium", "junit", "testng", "postman", "cypress", "automation testing", "qa"]
    },
    "Data Analyst": {
      terms: ["sql", "power bi", "excel", "tableau", "statistics", "pandas", "bi analyst", "etl", "data analyst", "data analytics"],
      skills: ["sql", "power bi", "excel", "tableau", "data analyst", "pandas"]
    }
  };

  let bestPath = "General Software Engineer";
  let maxScore = 0;

  for (const [name, path] of Object.entries(paths)) {
    let score = 0;
    for (const term of path.terms) {
      if (lowerDes.includes(term)) {
        score += 12;
      }
    }
    for (const sk of skills) {
      if (path.skills.includes(sk)) {
        score += 4;
      }
    }
    for (const term of path.terms) {
      if (lowerText.includes(term)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestPath = name;
    }
  }

  if (maxScore < 8) {
    return "General Software Engineer";
  }

  return bestPath;
};

const filterMissingKeywords = (missing, fullText, category, stage, resume = {}) => {
  const lowerText = fullText.toLowerCase();
  const designation = resume.profileInfo?.designation || "";
  const careerPath = detectCareerPath(resume, designation, fullText);
  const isJuniorOrStudent = stage === "Student" || stage === "Fresher" || stage === "Junior";

  return missing.filter(kw => {
    const kwLower = kw.toLowerCase();

    // 1. General logical adjacency rules (apply to all paths)
    if (kwLower === "spring boot" && !lowerText.includes("java")) {
      return false;
    }
    if (kwLower === "typescript" && !lowerText.includes("react") && !lowerText.includes("javascript")) {
      return false;
    }
    if (["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch"].includes(kwLower) && !lowerText.includes("python") && !lowerText.includes("machine learning") && !lowerText.includes("ml")) {
      return false;
    }
    if (kwLower === "kubernetes" && !lowerText.includes("docker")) {
      return false;
    }
    if (kwLower === "microservices" && !lowerText.includes("rest api") && !lowerText.includes("backend") && !lowerText.includes("spring") && !lowerText.includes("node")) {
      return false;
    }

    // 2. Career Path filtering for "software engineer"
    if (category.toLowerCase() === "software engineer") {
      if (careerPath === "Backend Java") {
        const forbidden = ["react", "typescript", "vue", "angular", "figma", "sass", "less", "html", "css", "adobe xd"];
        if (forbidden.includes(kwLower) && !lowerText.includes("javascript") && !lowerText.includes("react")) {
          return false;
        }
      } else if (careerPath === "Frontend") {
        const forbidden = ["spring boot", "hibernate", "kubernetes", "docker", "microservices", "c++", "c#", "java"];
        if (forbidden.includes(kwLower) && !lowerText.includes("node") && !lowerText.includes("python") && !lowerText.includes("java")) {
          return false;
        }
      } else if (careerPath === "Machine Learning") {
        const forbidden = ["react", "typescript", "javascript", "docker", "kubernetes", "spring boot", "hibernate", "angular", "vue", "html", "css"];
        if (forbidden.includes(kwLower) && !lowerText.includes("mlops") && !lowerText.includes("docker")) {
          return false;
        }
      } else if (careerPath === "DevOps") {
        const forbidden = ["react", "typescript", "javascript", "spring boot", "hibernate", "angular", "vue", "html", "css"];
        if (forbidden.includes(kwLower)) {
          return false;
        }
      } else if (careerPath === "QA") {
        const forbidden = ["react", "typescript", "docker", "kubernetes", "spring boot", "hibernate", "microservices", "aws", "azure", "gcp"];
        if (forbidden.includes(kwLower)) {
          return false;
        }
      } else if (careerPath === "Data Analyst") {
        const forbidden = ["react", "typescript", "docker", "kubernetes", "spring boot", "hibernate", "microservices", "aws", "gcp", "azure"];
        if (forbidden.includes(kwLower)) {
          return false;
        }
      } else if (careerPath === "General Software Engineer") {
        const specialized = ["spring boot", "hibernate", "react", "typescript", "kubernetes", "tensorflow", "pytorch", "scikit-learn", "vue", "angular", "pandas", "numpy"];
        if (specialized.includes(kwLower)) {
          return false;
        }
      }
    }

    // 3. Junior/Student generic infrastructure filtering
    if (isJuniorOrStudent) {
      if (["kubernetes", "docker", "microservices", "ci/cd", "aws", "system design"].includes(kwLower)) {
        const infra = ["linux", "git", "rest api", "sql", "cloud", "backend"];
        return infra.some(term => lowerText.includes(term));
      }
    }

    return true;
  });
};

// ─── Section checkers ─────────────────────────────────────────────────────────

export const analyzeResumeIntelligence = (resume) => {
  const text = allText(resume).toLowerCase();
  const designation = asText(resume.profileInfo?.designation || "");
  const targetRole = asText(resume.profileInfo?.targetRole || resume.profileInfo?.designation || "General Resume");
  const summary = asText(resume.profileInfo?.summary || "");
  const skills = (resume.skills || []).map(s => asText(s.name).toLowerCase());
  
  const stage = detectCareerStage(resume);

  const hasInternship = (resume.customSections?.internships || []).length > 0 || 
    designation.toLowerCase().includes("intern") || 
    (resume.workExperience || []).some(w => asText(w.role).toLowerCase().includes("intern") || asText(w.company).toLowerCase().includes("intern"));

  const hasFreelancing = text.includes("freelance") || text.includes("contractor") || text.includes("consultant");

  const hasOpenSource = text.includes("open source") || text.includes("contribution") || (resume.projects || []).some(p => hasText(p.github));

  const hasResearch = text.includes("research assistant") || text.includes("publication") || text.includes("research paper") || text.includes("scientific");

  const hasHackathons = text.includes("hackathon") || text.includes("competition") || text.includes("codefest");

  const hasLeadership = text.includes("lead ") || text.includes("manage") || text.includes("direct") || text.includes("mentor") || text.includes("orchestrated") || text.includes("supervised");

  const hasCertifications = (resume.certifications || []).length > 0;

  const specialization = detectCareerPath(resume, designation, text);

  let totalMonths = 0;
  (resume.workExperience || []).forEach(w => {
    const startVal = parseMonthYear(w.startDate);
    const endVal = w.endDate && w.endDate.toLowerCase().includes("present") ? CURRENT_YEAR * 12 + new Date().getMonth() + 1 : parseMonthYear(w.endDate);
    if (startVal && endVal && endVal >= startVal) {
      totalMonths += (endVal - startVal + 1);
    }
  });
  const yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;

  let primaryLanguage = "General";
  if (text.includes("python")) primaryLanguage = "Python";
  else if (text.includes("java")) primaryLanguage = "Java";
  else if (text.includes("javascript") || text.includes("typescript") || text.includes("node.js")) primaryLanguage = "JavaScript";
  else if (text.includes("c++")) primaryLanguage = "C++";
  else if (text.includes("c#")) primaryLanguage = "C#";

  let frameworkEcosystem = "General";
  if (text.includes("spring")) frameworkEcosystem = "Spring";
  else if (text.includes("react")) frameworkEcosystem = "React";
  else if (text.includes("angular")) frameworkEcosystem = "Angular";
  else if (text.includes("django") || text.includes("flask")) frameworkEcosystem = "Django/Flask";

  let domain = "General";
  if (specialization === "Machine Learning" || text.includes("ai ") || text.includes("deep learning")) domain = "Data/AI";
  else if (specialization === "DevOps" || text.includes("aws") || text.includes("cloud")) domain = "Cloud/DevOps";
  else if (specialization === "Frontend" || text.includes("web development")) domain = "Web";
  else if (text.includes("clinical") || text.includes("healthcare") || text.includes("nurse")) domain = "Healthcare";
  else if (text.includes("finance") || text.includes("bank") || text.includes("valuation")) domain = "Finance";

  let industry = "Tech";
  if (text.includes("healthcare") || text.includes("medical")) industry = "Healthcare";
  else if (text.includes("bank") || text.includes("finance") || text.includes("investment")) industry = "Finance";
  else if (text.includes("government") || text.includes("policy")) industry = "Government";
  else if (text.includes("mechanical") || text.includes("automotive")) industry = "Automotive";

  let projComplexity = "Low";
  let complexKeywords = 0;
  ["architecture", "performance", "database", "scale", "concurrency", "deployment", "docker", "kubernetes", "cloud", "security"].forEach(k => {
    if (text.includes(k)) complexKeywords++;
  });
  if (complexKeywords > 5) projComplexity = "High";
  else if (complexKeywords > 2) projComplexity = "Medium";

  let metricsCount = 0;
  const matchMetrics = text.match(new RegExp(HAS_METRIC_RE.source, "gi"));
  if (matchMetrics) metricsCount = matchMetrics.length;

  let achievementQuality = Math.min(100, Math.max(40, 40 + metricsCount * 15));
  let writingQuality = 100;
  const fillerMatches = text.match(new RegExp(FILLER_WORDS_RE.source, "gi"));
  if (fillerMatches) writingQuality = Math.max(40, 100 - fillerMatches.length * 8);

  let technicalDepth = Math.min(100, Math.max(30, 30 + skills.length * 5 + complexKeywords * 6));
  
  let atsCompatibility = 100;
  const dec = resume.decoratives || {};
  if (asText(dec.dividerStyle) === "dots" || asText(dec.dividerStyle) === "gradient") atsCompatibility -= 10;
  if (asText(dec.progressStyle) === "bar" || asText(dec.progressStyle) === "dots") atsCompatibility -= 15;
  if (hasText(resume.fontPairing) && resume.fontPairing !== "inter") atsCompatibility -= 10;

  let formattingQuality = atsCompatibility;
  let parserSafety = 100;
  if (!hasText(resume.profileInfo?.fullName)) parserSafety -= 30;
  if (!hasText(resume.contactInfo?.email)) parserSafety -= 30;

  let resumeConfidenceScore = Math.round((technicalDepth + writingQuality + achievementQuality) / 3);

  return {
    stage,
    yearsOfExperience,
    targetRole,
    specialization,
    hasInternship,
    hasFreelancing,
    hasOpenSource,
    hasResearch,
    hasHackathons,
    hasLeadership,
    hasCertifications,
    primaryLanguage,
    frameworkEcosystem,
    domain,
    industry,
    projComplexity,
    achievementQuality,
    writingQuality,
    technicalDepth,
    atsCompatibility,
    formattingQuality,
    parserSafety,
    resumeConfidenceScore
  };
};

const checkProfile = (profile, issues, stage) => {
  let pts = 0;
  pts += required(issues, "missing_name", "Profile > Full name", profile.fullName, D.missingName,
    "Add your professional or legal name at the top of your resume. ATS systems use this identifier to create your candidate profile.", 100);
  pts += required(issues, "missing_designation", "Profile > Designation", profile.designation, D.missingDesignation,
    "Add a target designation title. This anchors your resume in the database and enables role-based keywords matching.", 95);

  const summary = asText(profile.summary);
  if (!hasText(summary)) {
    let missingDesc = "Add a 2-4 sentence summary with target role, strengths, and measurable impact.";
    if (stage === "Student") {
      missingDesc = "To stand out as a student, add academic projects, certifications, internships, hackathons, or measurable project outcomes to your summary.";
    } else if (stage === "Fresher") {
      missingDesc = "As a fresher, showcase your internships, core technical strengths, and final-year project impact in your summary.";
    } else {
      missingDesc = "For experienced roles, add quantified business impact, leadership scope, users supported, or performance metrics.";
    }
    pts += issue(issues, "missing_summary", "Profile > Summary", "", D.missingSummary, missingDesc, "error", 90);
  } else {
    if (summary.length < T.minSummaryLen) {
      pts += issue(issues, "short_summary", "Profile > Summary", summary, D.shortSummary,
        "Expand your summary to at least 80 characters. Describe your primary strengths, target role, and highest value achievement.", "warning", 80);
    }
    if (!HAS_METRIC_RE.test(summary)) {
      let suggestion = "Add one concrete metric, such as users supported, team size, budget managed, or project outcomes.";
      if (stage === "Student") {
        suggestion = "To stand out as a student, add academic project outcomes, certifications, hackathon rankings, or GPA to your summary.";
      } else if (stage === "Fresher") {
        suggestion = "As a fresher, showcase your internships, core technical strengths, or final-year project outcomes in your summary.";
      } else {
        suggestion = "For experienced roles, add quantified business impact, users supported, revenue, or system performance metrics to your summary.";
      }
      const conf = (stage === "Student" || stage === "Fresher") ? 75 : 95;
      pts += issue(issues, "summary_no_metric", "Profile > Summary", short(summary), D.summaryNoMetric, suggestion, "tip", conf);
    }
    if (FILLER_WORDS_RE.test(summary)) {
      pts += issue(issues, "summary_filler", "Profile > Summary", first(FILLER_WORDS_RE, summary), D.summaryFiller,
        "Replace vague buzzwords (like 'hard-working' or 'passionate') with concrete achievements or technical skills.", "warning", 85);
    }
  }
  return pts;
};

const checkContact = (contact, issues) => {
  let pts = 0;
  const email = asText(contact.email);
  if (!hasText(email)) {
    pts += issue(issues, "missing_email", "Contact > Email", "", D.missingEmail,
      "Add a professional email address. ATS and recruiters need a direct contact field.", "error", 100);
  } else if (!EMAIL_RE.test(email)) {
    pts += issue(issues, "invalid_email", "Contact > Email", email, D.invalidEmail,
      "Use a valid email format such as name@example.com.", "error", 100);
  }
  const phone = asText(contact.phone);
  if (!hasText(phone)) {
    pts += issue(issues, "missing_phone", "Contact > Phone", "", D.missingPhone,
      "Add a phone number with country code.", "warning", 95);
  } else if (phone.replace(/\D/g, "").length < 8) {
    pts += issue(issues, "invalid_phone", "Contact > Phone", phone, D.invalidPhone,
      "Use a complete phone number. Include country code and enough digits.", "warning", 95);
  }
  pts += required(issues, "missing_location", "Contact > Location", contact.location, D.missingLocation,
    "Add city and country or region. Many ATS filters use location.", 85);
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
  if (!hasText(start)) pts += issue(issues, "missing_start_date", `${section} > Start date`, "", D.missingStartDate, "Add a start month and year.", "warning", 90);
  if (!hasText(end))   pts += issue(issues, "missing_end_date",   `${section} > End date`,   "", D.missingEndDate,   allowPresent ? "Add an end month/year or mark it as Present." : "Add an end month and year.", "warning", 90);
  if (!hasText(start) || !hasText(end)) return pts;
  if (asText(end).toLowerCase() === "present") {
    if (!allowPresent) pts += issue(issues, "invalid_end_date", `${section} > End date`, end, D.invalidEndDate, "Use a real end month and year for this section.", "warning", 90);
    return pts;
  }
  const sv = parseMonthYear(start), ev = parseMonthYear(end);
  if (sv === null) pts += issue(issues, "invalid_start_date", `${section} > Start date`, start, D.invalidStartDate, "Use the editor date format: month plus four-digit year.", "warning", 85);
  if (ev === null) pts += issue(issues, "invalid_end_date",   `${section} > End date`,   end,   D.invalidEndDate,   "Use the editor date format: month plus four-digit year.", "warning", 85);
  if (sv !== null && ev !== null && sv > ev) pts += issue(issues, "date_order", `${section} > Dates`, `${asText(start)} to ${asText(end)}`, D.dateOrder, "Start date is after end date. Correct the timeline before applying.", "error", 95);
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

const checkExperience = (experience, issues, resume = {}, stage) => {
  const intel = analyzeResumeIntelligence(resume);
  const bypass = intel.hasInternship || intel.hasFreelancing || intel.hasOpenSource || intel.hasResearch || intel.hasHackathons;
  
  if (experience.length === 0) {
    if (bypass) {
      return 0; // Suppress missing experience penalty entirely
    }
    return issue(issues, "missing_experience", "Experience", "", D.missingExperience, "Add at least one professional role, internship, or technical project to demonstrate hands-on application of your skills.", "error", 95);
  }
  let pts = 0;
  experience.forEach((job, idx) => {
    const lbl = `Experience ${idx + 1}`;
    pts += required(issues, "missing_company", `${lbl} > Company`, job.company, D.missingCompany, "Add the company or organization name.", 90);
    pts += required(issues, "missing_role",    `${lbl} > Role`,    job.role,    D.missingRole,    "Add the role title exactly as you want recruiters and ATS to read it.", 90);
    pts += checkDateRange(job.startDate, job.endDate, lbl, issues, true);
    const desc = asText(job.description);
    if (!hasText(desc)) {
      pts += issue(issues, "missing_experience_description", `${lbl} > Description`, "", D.missingExperienceDescription, "Add 2-4 bullets or sentences covering action, tools, and measurable impact.", "error", 95);
    } else {
      pts += checkQuality(desc, `${lbl} > Description`, T.minExperienceDescLen, true, issues, stage);
    }
  });
  return pts;
};

const checkEducation = (education, issues) => {
  if (education.length === 0) return issue(issues, "missing_education", "Education", "", D.missingEducation, "Add education, training, bootcamp, or equivalent credential. If not applicable, add your strongest formal training.", "warning", 90);
  let pts = 0;
  education.forEach((item, idx) => {
    const lbl = `Education ${idx + 1}`;
    pts += required(issues, "missing_degree",      `${lbl} > Degree`,      item.degree,      D.missingDegree,      "Add the degree, certificate, or course name.", 90);
    pts += required(issues, "missing_institution", `${lbl} > Institution`, item.institution, D.missingInstitution, "Add the school, university, or training provider.", 90);
    pts += checkDateRange(item.startDate, item.endDate, lbl, issues, false);
  });
  return pts;
};

const checkProgress = (progress, section, issues) => {
  if (progress === null || progress === undefined) return issue(issues, "missing_progress", section, "", D.missingProgress, "Set a proficiency value or remove the visual proficiency control for ATS-first resumes.", "tip", 80);
  if (progress < 0 || progress > 100)              return issue(issues, "invalid_progress", section, String(progress), D.invalidProgress, "Keep proficiency between 0 and 100.", "tip", 80);
  return 0;
};

const normalizeSkillName = (name) => {
  const lower = name.trim().toLowerCase();
  if (lower === "js" || lower === "javascript") return "javascript";
  if (lower === "ts" || lower === "typescript") return "typescript";
  if (lower === "spring" || lower === "spring boot" || lower === "springboot") return "spring boot";
  return lower;
};

const checkSkills = (skills, issues) => {
  if (skills.length === 0) return issue(issues, "missing_skills", "Skills", "", D.missingSkills, "Add 8-12 concrete skills. ATS keyword matching depends heavily on this section.", "error", 100);
  let pts = 0;
  if (skills.length < T.tooFewSkillsCount) {
    pts += issue(issues, "too_few_skills", "Skills", String(skills.length), D.tooFewSkills, `Only ${skills.length} skills are listed. Add enough hard skills to match the target role.`, "warning", 85);
  }
  const seen = new Set();
  skills.forEach((sk, idx) => {
    const name = asText(sk.name), lbl = `Skills ${idx + 1}`;
    if (!hasText(name)) { pts += issue(issues, "blank_skill", `${lbl} > Name`, "", D.blankSkill, "Remove the blank skill row or enter a specific skill name.", "error", 95); return; }
    const norm = normalizeSkillName(name);
    if (seen.has(norm)) {
      pts += issue(issues, "duplicate_skill", `${lbl} > Name`, name, D.duplicateSkill, `Remove duplicate skill listing: "${name}". Keep one clear normalized entry per skill to maintain a clean layout.`, "tip", 95);
    }
    seen.add(norm);
    pts += checkProgress(sk.progress, `${lbl} > Proficiency`, issues);
  });
  return pts;
};

const checkProjects = (projects, experience, issues, stage) => {
  const isSeniorOrLeadOrManager = ["Senior", "Lead", "Manager"].includes(stage);
  if (isSeniorOrLeadOrManager && experience.length >= 2) {
    return 0; // Never ask for projects if strong experience exists for seniors
  }
  if (projects.length === 0 && experience.length <= 1) {
    return issue(issues, "missing_projects", "Projects", "", D.missingProjects, "Add one or two strong projects to showcase hands-on work if your experience is light.", "warning", 90);
  }
  let pts = 0;
  projects.forEach((proj, idx) => {
    const lbl = `Projects ${idx + 1}`;
    pts += required(issues, "missing_project_title", `${lbl} > Title`, proj.title, D.missingProjectTitle, "Add a concise project title.", 90);
    const desc = asText(proj.description);
    if (!hasText(desc)) {
      pts += issue(issues, "missing_project_description", `${lbl} > Description`, "", D.missingProjectDescription, "Add what the project does, what you used, and what improved.", "warning", 90);
    } else {
      pts += checkQuality(desc, `${lbl} > Description`, T.minProjectDescLen, false, issues, stage);
      
      // Portfolio portfolio-style checks (problem statement, technologies, deployment, testing, complexity)
      const lowerDesc = desc.toLowerCase();
      if (!lowerDesc.includes("architecture") && !lowerDesc.includes("design") && !lowerDesc.includes("built") && !lowerDesc.includes("implement")) {
        pts += issue(issues, "project_architecture_weak", `${lbl} > Description`, short(desc), 0,
          "Reason: Project details lack architectural or implementation depth.\nWhy it matters: Recruiters evaluate engineering scope through structural choices.\nActionable improvement: Clarify the problem statement and design choices in your project description.\nRecruiter impact: Demonstrates software engineering maturity and logical planning.\nExample: 'Designed a multi-tier microservices architecture using Spring Cloud.'", "tip", 80);
      }
      if (!lowerDesc.includes("deploy") && !lowerDesc.includes("aws") && !lowerDesc.includes("docker") && !lowerDesc.includes("kubernetes") && !lowerDesc.includes("cloud") && !lowerDesc.includes("vercel") && !lowerDesc.includes("github actions")) {
        pts += issue(issues, "project_deployment_missing", `${lbl} > Description`, short(desc), 0,
          "Reason: Missing details about deployment or cloud environment.\nWhy it matters: Showing your application runs in production validates end-to-end delivery skills.\nActionable improvement: Document how the application is built, deployed, or hosted.\nRecruiter impact: Proves you can manage software beyond local execution.\nExample: 'Deployed on AWS ECS using Docker containers and GitHub Actions.'", "tip", 80);
      }
    }
    pts += optUrl(proj.github,  `${lbl} > GitHub URL`,   "Use a valid repository URL or leave the field empty.", issues);
    pts += optUrl(proj.liveDemo,`${lbl} > Live demo URL`, "Use a valid live demo URL or leave the field empty.", issues);
  });
  return pts;
};

const checkYear = (year, section, issues) => {
  if (!hasText(year)) return issue(issues, "missing_cert_year", section, "", D.missingCertYear, "Add the completion year or remove the year field if unknown.", "tip", 80);
  if (!/^\d{4}$/.test(asText(year))) return issue(issues, "invalid_year", section, asText(year), D.invalidYear, "Use a four-digit year.", "warning", 85);
  const n = parseInt(asText(year), 10);
  if (n < 1950 || n > CURRENT_YEAR + 10) return issue(issues, "year_out_of_range", section, asText(year), D.yearOutOfRange, "Use a realistic year.", "warning", 85);
  return 0;
};

const checkCertifications = (certs, issues) => {
  let pts = 0;
  certs.forEach((c, idx) => {
    const lbl = `Certifications ${idx + 1}`;
    pts += required(issues, "missing_cert_title",  `${lbl} > Title`,  c.title,  D.missingCertTitle,  "Add the certification name or remove the blank certification row.", 90);
    pts += required(issues, "missing_cert_issuer", `${lbl} > Issuer`, c.issuer, D.missingCertIssuer, "Add the issuer so ATS and recruiters can verify the credential.", 90);
    pts += checkYear(c.year, `${lbl} > Year`, issues);
  });
  return pts;
};

const checkLanguages = (languages, issues) => {
  let pts = 0;
  const seen = new Set();
  languages.forEach((lang, idx) => {
    const name = asText(lang.name), lbl = `Languages ${idx + 1}`;
    if (!hasText(name)) { pts += issue(issues, "blank_language", `${lbl} > Name`, "", D.blankLanguage, "Remove the blank language row or enter a language name.", "tip", 80); return; }
    if (seen.has(name.toLowerCase())) pts += issue(issues, "duplicate_language", `${lbl} > Name`, name, D.duplicateLanguage, "Remove duplicate language entries.", "tip", 80);
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
    if (!hasText(val)) { pts += issue(issues, "blank_interest", lbl, "", D.blankInterest, "Remove blank interest rows.", "tip", 80); return; }
    if (seen.has(val.toLowerCase())) pts += issue(issues, "duplicate_interest", lbl, val, D.duplicateInterest, "Remove duplicate interests.", "tip", 80);
    seen.add(val.toLowerCase());
  });
  if (interests.length > T.tooManyInterestsCount) {
    pts += issue(issues, "too_many_interests", "Interests", String(interests.length), D.tooManyInterests,
      "Keep interests short or remove them for ATS-first resumes. Use the space for experience, skills, or projects.", "tip", 80);
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
      risk >= 6 ? "warning" : "tip", 80);
  }
  const photoUrl   = asText(profile.profilePreviewUrl || profile.profileImageUrl);
  const dec        = resume.decoratives || {};
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
  if (hasText(resume.fontPairing) && resume.fontPairing !== "inter") {
    pts += issue(issues, "custom_font", "Customization > Font", resume.fontPairing, D.customFont,
      "Use a common system-like font for ATS uploads. Keep custom fonts for human-facing versions.", "tip", 80);
  }
  return pts;
};

const checkKeywords = (resume, category, issues, stage) => {
  const keywords = RULES.categories[category] || [];
  if (keywords.length === 0) return 0;
  const fullText = allText(resume).toLowerCase();
  let missing  = keywords.filter(kw => !fullText.includes(kw.toLowerCase()));
  if (missing.length === 0) return 0;

  missing = filterMissingKeywords(missing, fullText, category, stage, resume);
  if (missing.length === 0) return 0;

  const ratio = missing.length / keywords.length;
  const pts   = Math.max(D.keywordGapMin, Math.round(D.keywordGapMax * ratio));
  const top   = missing.slice(0, T.maxKeywordDisplay);
  
  const suggestion = `Including key technical terms for a ${category} role helps parser matching. If you have experience with these adjacent concepts, consider adding them to your skills or project descriptions: ${top.join(", ")}. Otherwise, focus on clarifying your core strengths.`;

  return issue(issues, "keyword_gap", "Role keywords", "Missing: " + top.join(", "), pts, suggestion, pts >= 10 ? "warning" : "tip", 90);
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

  const stage = detectCareerStage(resume);

  let deductions = 0;
  deductions += checkProfile(profile, issues, stage);
  deductions += checkContact(contact, issues);
  deductions += checkExperience(experience, issues, resume, stage);
  deductions += checkEducation(education, issues);
  deductions += checkSkills(skills, issues);
  deductions += checkProjects(projects, experience, issues, stage);
  deductions += checkCertifications(certs, issues);
  deductions += checkLanguages(languages, issues);
  deductions += checkInterests(interests, issues);
  deductions += checkPresentation(resume, profile, issues);

  const category = detectCategory(asText(profile.designation), resume);
  const isMatchedRole = category && category !== "General Resume";
  if (isMatchedRole) {
    deductions += checkKeywords(resume, category.toLowerCase(), issues, stage);
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));

  const rank = (s) => (s === "error" ? 0 : s === "warning" ? 1 : 2);
  issues.sort((a, b) => rank(a.severity) - rank(b.severity) || (b.points || 0) - (a.points || 0));

  const roleStr  = category ? ` for a ${category} role` : "";
  let overallFeedback;
  if      (score >= 95) overallFeedback = `Exceptional recruiter-grade resume structure${roleStr}. Excellent focus, technical depth, and metrics.`;
  else if (score >= 90) overallFeedback = `Highly Competitive candidate profile${roleStr}. Formatted well with strong impact alignment.`;
  else if (score >= 80) overallFeedback = `Good ATS foundation${roleStr}. Address the remaining warning(s) and tip(s) to optimize.`;
  else if (score >= 70) overallFeedback = `Average performance${roleStr}. Enhance your project details and experience bullets to stand out.`;
  else if (score >= 60) overallFeedback = `Needs Improvement${roleStr}. Resolve critical issues and warnings to lower ATS risk.`;
  else                  overallFeedback = `Major Resume Issues detected${roleStr}. High formatting and missing fields risk; overhaul structure before applying.`;

  // Strengths detection
  const strengths = [];
  const intel = analyzeResumeIntelligence(resume);
  if (experience.length >= 3 && intel.yearsOfExperience >= 5) {
    strengths.push("Good technical progression & career stability");
  }
  if (intel.achievementQuality > 75) {
    strengths.push("Strong measurable achievements with business metrics");
  }
  if (intel.technicalDepth > 75) {
    strengths.push("Excellent project complexity & technical depth");
  }
  if (intel.specialization !== "General Software Engineer" && intel.specialization !== "General Resume") {
    strengths.push(`Clear specialization alignment: ${intel.specialization}`);
  }
  if (intel.atsCompatibility === 100) {
    strengths.push("Well-structured layout with optimal parser safety");
  }
  if (strengths.length === 0) {
    strengths.push("Well-structured ATS-ready formatting foundations");
  }

  // atsScore alias ensures compatibility with the backend RefineResponse field name
  return { score, atsScore: score, issues, overallFeedback, category, strengths };
};

// Re-export category keywords and rules for any component that needs to
// display or cross-reference them without re-importing the JSON directly.
export const CATEGORY_KEYWORDS = RULES.categories;
export const ATS_RULES         = RULES;
