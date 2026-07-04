import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getResumeById, updateResume, uploadProfileImage, sendResumeByEmail, exportResumePdf, refineResume } from "../api";
import ResumePreview from "../components/ResumePreview";

import DecorativesPanel from "../components/DecorativesPanel";
import AiRefinePanel from "../components/AiRefinePanel";
import PhoneInput from "../components/common/PhoneInput";
import DateRangePicker from "../components/common/DateRangePicker";
import ContactField from "../components/common/ContactField";
import { useAuth } from "../context/AuthContext";
import { sanitizeStrictText, sanitizeYear, sanitizeName, sanitizeRole, sanitizeURL, sanitizeDigits, sanitizeFlexibleDate, isNumericPattern, sanitizeTextOnly, sanitizeDecimal, smartNormalizeUrl, sanitizeRawText, sanitizeLocation } from "../utils/inputSanitizers";
import { computeAtsReport } from "../utils/atsScorer";
import { toastService } from "../utils/toastService";
import "./ResumeEditor.css";

const CustomizableContactField = ({ platform, label, value, onChange, placeholder, hint, isPhone = false }) => {
  const data = typeof value === "object" && value !== null ? value : { value: value || "", displayText: "" };
  
  const handleValueChange = (newVal) => {
    onChange({ ...data, value: newVal });
  };
  
  const handleDisplayChange = (e) => {
    onChange({ ...data, displayText: e.target.value });
  };

  return (
    <div className="customizable-contact-field">
      <div className="customizable-contact-field-container">
        {isPhone ? (
          <div className="field-phone-label-wrap">
            <label className="phone-label-custom">{label}</label>
            <PhoneInput
              value={data.value}
              onChange={handleValueChange}
              placeholder={placeholder || "+91 9876543210"}
              hint={hint}
            />
          </div>
        ) : (
          <ContactField
            platform={platform}
            label={label}
            value={data.value}
            onChange={handleValueChange}
            placeholder={placeholder}
            hint={hint}
          />
        )}
        
        <div className="display-as-field">
          <label className="display-as-label">
            Display As
          </label>
          <input
            type="text"
            className="contact-display-as-input"
            value={data.displayText || ""}
            onChange={handleDisplayChange}
            placeholder={`e.g. ${label || platform}`}
          />
          <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block" }}>Custom text to display instead of the link URL.</small>
        </div>
      </div>
    </div>
  );
};

const SECTIONS = [
  "Profile", "Contact", "Experience", "Education",
  "Skills", "Projects", "Certifications", "Languages", "Interests", "Customization", "ATS Refine"
];

import { FREE_TEMPLATES, PREMIUM_TEMPLATES } from "../constants/templates";

// Font options for Pro users — shown as a picker in the Templates section
const FONT_OPTIONS = [
  { id: "inter",       label: "Corporate Sans",       heading: "'Inter', sans-serif",           body: "'Inter', sans-serif",          url: null, desc: "Modern, high-contrast, optimal for ATS scanners" },
  { id: "sora",        label: "Modern Sans",            heading: "'Sora', sans-serif",            body: "'Inter', sans-serif",          url: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap", desc: "Contemporary, aesthetic, geometric headings" },
  { id: "playfair",    label: "Signature Serif",    heading: "'Playfair Display', serif",     body: "'Lato', sans-serif",           url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Lato:wght@300;400;700&display=swap", desc: "Bold, elegant, high-impact branding" },
  { id: "outfit",      label: "Minimal Sans",          heading: "'Outfit', sans-serif",          body: "'DM Sans', sans-serif",        url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap", desc: "Clean, geometric, contemporary minimalist feel" },
  { id: "cormorant",   label: "Editorial Serif",   heading: "'Cormorant Garamond', serif",   body: "'Jost', sans-serif",           url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap", desc: "Refined, sophisticated, elegant headings" },
  { id: "spacegrotesk",label: "Grotesk Sans",     heading: "'Space Grotesk', sans-serif",   body: "'Inter', sans-serif",          url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap", desc: "Sharp, technical, modern developer aesthetic" },
  { id: "raleway",     label: "Neo Sans",             heading: "'Raleway', sans-serif",         body: "'Nunito Sans', sans-serif",    url: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&family=Nunito+Sans:wght@300;400;600&display=swap", desc: "Refined, high-legibility geometric styling" },
  { id: "jakarta",     label: "Jakarta Sans",         heading: "'Plus Jakarta Sans', sans-serif",body: "'Figtree', sans-serif",        url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Figtree:wght@300;400;500&display=swap", desc: "Elegant, clean contemporary geometric" },
  { id: "ibmplex",     label: "Plex Sans",            heading: "'IBM Plex Sans', sans-serif",   body: "'IBM Plex Sans', sans-serif", url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap", desc: "Balanced, highly readable technical sans" },
  { id: "bodoni",      label: "Prestige Serif",       heading: "'Bodoni Moda', serif",          body: "'Mulish', sans-serif",         url: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=Mulish:wght@300;400;500;600&display=swap", desc: "Luxury, high-contrast serif for senior advisors" },
  { id: "nunito",      label: "Rounded Sans",          heading: "'Nunito', sans-serif",          body: "'Open Sans', sans-serif",      url: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Open+Sans:wght@300;400;500&display=swap", desc: "Friendly, approachable rounded sans" },
  { id: "fraunces",    label: "Vintage Serif",       heading: "'Fraunces', serif",             body: "'Manrope', sans-serif",        url: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;1,400&family=Manrope:wght@300;400;500;600&display=swap", desc: "Editorial, expressive vintage layout" },
  { id: "sourcecode",  label: "Developer Mono",        heading: "'Source Code Pro', monospace",  body: "'Source Sans 3', sans-serif",  url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&family=Source+Sans+3:wght@300;400;600&display=swap", desc: "Clean monospace font for tech details" },
  { id: "tinos",       label: "Executive Serif",       heading: "'Tinos', 'Times New Roman', Times, serif", body: "'Tinos', 'Times New Roman', Times, serif", url: "https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap", desc: "Professional, classic Times style for traditional roles" },
  { id: "lora",        label: "Scholar Serif",         heading: "'Lora', Georgia, serif",          body: "'Lora', Georgia, serif",       url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap", desc: "Traditional, academic, highly legible in print" },
];

const emptyResume = {
  title: "",
  template: "template1",
  fontPairing: null,
  decoratives: {},
  profileInfo: { fullName: "", designation: "", summary: "", ProfilePreviewUrl: "" },
  contactInfo: { email: "", phone: "", location: "", linkedIn: "", github: "", website: "", leetCode: "", hackerRank: "" },
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

const cleanURL = (url) => {
  if (!url) return "";
  try {
    let parsedUrl = url;
    const hasProtocol = /^https?:\/\//i.test(url);
    if (!hasProtocol) {
      parsedUrl = "https://" + url;
    }
    const urlObj = new URL(parsedUrl);
    urlObj.search = "";
    urlObj.hash = "";
    let clean = urlObj.toString();
    if (!hasProtocol) {
      clean = clean.replace(/^https?:\/\//i, "");
    }
    if (!url.endsWith("/") && clean.endsWith("/")) {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch (e) {
    return url;
  }
};

const normalizeUrl = smartNormalizeUrl;

const isFresher = (resume) => {
  if (resume?.decoratives?.fresherMode === "true") return true;
  if (resume?.decoratives?.fresherMode === "false") return false;
  return (resume?.workExperience || []).length === 0;
};

const allPossibleOptionalIds = [
  "experience", "internships", "languages", "interests",
  "achievements", "publications", "volunteering", "leadership", "hackathons", 
  "openSource", "awards", "workshops", "coursework", 
  "technicalProfiles", "extracurriculars", "patents", "researchExperience"
];

const SECTION_FIELDS_CONFIG = {
  achievements: {
    title: { label: "Achievement Title", placeholder: "Won 1st place in coding contest.", hint: "Mention measurable achievements.", sanitizeType: "textOnly" },
    subtitle: { label: "Awarding Authority / Organization", placeholder: "e.g. Major League Hacking (MLH)", hint: "Organization or authority granting the achievement.", sanitizeType: "textOnly" },
    date: { label: "Date Achieved", placeholder: "e.g. October 2025", hint: "Enter format as Month Year (e.g. October 2025) or Year only.", sanitizeType: "date" },
    description: { label: "Details & Metrics", placeholder: "e.g. Beat out 150+ teams by building a serverless analytics tool.", hint: "Quantify metrics (e.g. percentages, budgets, participant size) to prove business value.", sanitizeType: "strict" }
  },
  publications: {
    title: { label: "Publication Title", placeholder: "Research Paper on NLP", hint: "Name of the published research paper.", sanitizeType: "strict" },
    subtitle: { label: "Journal / Conference / Publisher", placeholder: "e.g. IEEE Journal of AI Research", hint: "Journal, conference, or publishing body.", sanitizeType: "strict" },
    date: { label: "Publication Date", placeholder: "e.g. January 2026", hint: "Date when the paper was published (e.g. January 2026 or 2026).", sanitizeType: "date" },
    authors: { label: "Authors", placeholder: "e.g. Jane Doe, John Smith", hint: "All contributing authors.", sanitizeType: "strict" },
    abstract: { label: "Abstract", placeholder: "e.g. We propose a novel architecture that improves accuracy by 15%...", hint: "Summarize the key contributions and methodology of your research.", sanitizeType: "strict" },
    paperUrl: { label: "Paper URL", placeholder: "e.g. https://arxiv.org/abs/1234.5678", hint: "Provide a link to the online publication or PDF.", sanitizeType: "url" }
  },
  volunteering: {
    title: { label: "Volunteer Role", placeholder: "e.g. Volunteer Coding Instructor", hint: "Your title or role during this volunteer work.", sanitizeType: "role" },
    subtitle: { label: "Organization Name", placeholder: "e.g. Girls Who Code", hint: "Organization you volunteered for.", sanitizeType: "strict" },
    date: { label: "Dates Active", placeholder: "e.g. September 2024 - Present", hint: "Enter active timeframe (e.g. Sept 2024 - Present or 2024 - 2025).", sanitizeType: "date" },
    description: { label: "Activities & Impact", placeholder: "e.g. Mentored and taught Python basics to 30 high school students.", hint: "Demonstrates community leadership and team collaboration.", sanitizeType: "strict" }
  },
  leadership: {
    title: { label: "Leadership Position", placeholder: "e.g. Chapter Tech Lead / Founder", hint: "Your title or role in this leadership position.", sanitizeType: "role" },
    subtitle: { label: "Organization / Initiative", placeholder: "e.g. Open Source Developer Group", hint: "Organization or initiative you led.", sanitizeType: "strict" },
    date: { label: "Dates Active", placeholder: "e.g. January 2025 - Present", hint: "Enter leadership timeframe (e.g. Jan 2025 - Present or 2025).", sanitizeType: "date" },
    description: { label: "Key Contributions & Initiatives", placeholder: "e.g. Led a team of 12 volunteers to build a community learning hub.", hint: "Focus on initiatives you owned and the growth of the team/membership.", sanitizeType: "strict" }
  },
  hackathons: {
    title: { label: "Hackathon Name", placeholder: "e.g. ETHDenver Hackathon", hint: "Name of the hackathon event.", sanitizeType: "strict" },
    subtitle: { label: "Project / Contribution Role", placeholder: "e.g. Built 'DappFlow' (Lead Smart Contract Developer)", hint: "Your project name or contribution role.", sanitizeType: "strict" },
    date: { label: "Hackathon Date", placeholder: "e.g. February 2026", hint: "Date of the hackathon event (e.g. February 2026 or 2026).", sanitizeType: "date" },
    description: { label: "Achievement & Technologies Used", placeholder: "e.g. Placed Top 10 out of 500 projects. Used Solidity, React, and Ethers.js.", hint: "Detail the problem solved, tech stack, and any prizes won.", sanitizeType: "strict" }
  },
  openSource: {
    title: { label: "Repository Name", placeholder: "e.g. facebook/react", hint: "GitHub repository path or project name.", sanitizeType: "url" },
    subtitle: { label: "Contribution / Role", placeholder: "e.g. Pull Request Author / Core Contributor", hint: "Your role or nature of contribution.", sanitizeType: "strict" },
    date: { label: "Contribution Dates", placeholder: "e.g. June 2024 - Present", hint: "Enter contribution timeframe (e.g. June 2024 - Present or 2024 - 2025).", sanitizeType: "date" },
    description: { label: "Contribution Details", placeholder: "e.g. Optimized reconciliation logic, reducing memory allocations by 8%.", hint: "Showcase merged PRs, features developed, or issues fixed.", sanitizeType: "strict" }
  },
  awards: {
    title: { label: "Award / Honor Name", placeholder: "e.g. Outstanding Engineering Employee", hint: "Name of the award or honor.", sanitizeType: "strict" },
    subtitle: { label: "Issuing Organization", placeholder: "e.g. Acme Corporation", hint: "Issuing organization or authority.", sanitizeType: "strict" },
    date: { label: "Award Date", placeholder: "e.g. December 2025", hint: "Date when you received the award (e.g. December 2025 or 2025).", sanitizeType: "date" },
    description: { label: "Award Criteria & Details", placeholder: "e.g. Awarded to top 1% of developers for migration of payment gateway.", hint: "Briefly explain the criteria and the competitive pool size.", sanitizeType: "strict" }
  },
  internships: {
    title: { label: "Internship Role", placeholder: "e.g. Software Engineering Intern", hint: "Your title or role during this internship.", sanitizeType: "role" },
    subtitle: { label: "Company / Team", placeholder: "e.g. Google Cloud Platform", hint: "Company or team where you interned.", sanitizeType: "strict" },
    date: { label: "Internship Dates", placeholder: "e.g. June 2025 - August 2025", hint: "Enter internship timeframe (e.g. June 2025 - August 2025).", sanitizeType: "date" },
    description: { label: "Key Projects & Learnings", placeholder: "e.g. Developed serverless log streaming pipelines in Go, processing 5TB daily.", hint: "Focus on specific features built, languages used, and mentorship received.", sanitizeType: "strict" }
  },
  workshops: {
    title: { label: "Workshop / Course Title", placeholder: "e.g. Advanced Distributed Systems", hint: "Title of the workshop or course.", sanitizeType: "strict" },
    subtitle: { label: "Provider / Instructor", placeholder: "e.g. ByteByteGo Academy", hint: "Provider or instructor of the workshop.", sanitizeType: "strict" },
    date: { label: "Date Attended", placeholder: "e.g. November 2025", hint: "Date when you attended (e.g. November 2025 or 2025).", sanitizeType: "date" },
    description: { label: "Topics & Hands-On Experience", placeholder: "e.g. Completed labs on database partitioning, consensus models, and load balancing.", hint: "Highlight specialized tools or concepts learned.", sanitizeType: "strict" }
  },
  coursework: {
    title: { label: "Course Name", placeholder: "e.g. Algorithms & Computational Complexity", hint: "Title of the course.", sanitizeType: "strict" },
    subtitle: { label: "Department / Institution", placeholder: "e.g. Computer Science (Stanford University)", hint: "Department or institution.", sanitizeType: "strict" },
    date: { label: "Term / Year", placeholder: "e.g. Fall 2025", hint: "Enter term or year (e.g. Fall 2025 or 2025).", sanitizeType: "date" },
    description: { label: "Key Concepts & Labs", placeholder: "e.g. Dynamic programming, graph optimization, and NP-hard problems.", hint: "Showcase advanced courses that align with target job requirements.", sanitizeType: "strict" }
  },
  extracurriculars: {
    title: { label: "Activity / Organization", placeholder: "e.g. ACM Competitive Programming Team", hint: "Name of the group or activity.", sanitizeType: "strict" },
    subtitle: { label: "Role / Position", placeholder: "e.g. Lead Trainer", hint: "Your role or position.", sanitizeType: "role" },
    date: { label: "Dates Active", placeholder: "e.g. September 2024 - Present", hint: "Enter active timeframe (e.g. Sept 2024 - Present or 2024 - 2025).", sanitizeType: "date" },
    description: { label: "Details & Accomplishments", placeholder: "e.g. Coached 15 members on data structures, improving standings in regional contests.", hint: "Demonstrates leadership, dedication, and teamwork.", sanitizeType: "strict" }
  },
  technicalProfiles: {
    title: { label: "Platform Name", placeholder: "e.g. LeetCode / Kaggle / StackOverflow", hint: "Name of the platform.", sanitizeType: "strict" },
    date: { label: "Profile URL / Link", placeholder: "e.g. https://leetcode.com/coder_jane", hint: "Provide direct link to your profile.", sanitizeType: "url" },
    description: { label: "Highlights & Rankings", placeholder: "e.g. Top 1.5% worldwide rating with 800+ solved problems.", hint: "Provide exact URLs and highlights to prove technical credentials.", sanitizeType: "strict" }
  },
  patents: {
    title: { label: "Patent Title", placeholder: "e.g. Decentralized Consensus Protocol for High-Throughput Networks", hint: "Title of the patent.", sanitizeType: "strict" },
    subtitle: { label: "Patent / App Number", placeholder: "e.g. US Patent App 12/345,678 (or Pending)", hint: "Official filing reference or app number.", sanitizeType: "strict" },
    date: { label: "Filing / Issue Date", placeholder: "e.g. March 2025", hint: "Filing or issue date (e.g. March 2025 or 2025).", sanitizeType: "date" },
    description: { label: "Summary of Invention", placeholder: "e.g. A consensus model enabling micro-node transaction processing without mining overhead.", hint: "State whether the patent is pending, granted, or published.", sanitizeType: "strict" }
  },
  researchExperience: {
    title: { label: "Research Project / Topic", placeholder: "e.g. Neural Networks for Edge Anomaly Detection", hint: "Subject of the research project.", sanitizeType: "strict" },
    subtitle: { label: "Institution / Lab / Advisor", placeholder: "e.g. MIT AI Lab / Advisor: Dr. Alan Turing", hint: "Lab, institution, or principal advisor.", sanitizeType: "strict" },
    date: { label: "Research Dates", placeholder: "e.g. January 2025 - Present", hint: "Enter research timeframe (e.g. Jan 2025 - Present or 2025).", sanitizeType: "date" },
    description: { label: "Methodology, Findings & Tools", placeholder: "e.g. Designed unsupervised LSTM models with PyTorch. Improved edge detection by 14%.", hint: "Detail the scientific methodology, tools utilized, and resulting papers.", sanitizeType: "strict" }
  }
};

const getSectionFieldProps = (secId, fieldKey) => {
  const sectionConfig = SECTION_FIELDS_CONFIG[secId] || {};
  const defaults = {
    title: { label: "Title", placeholder: "Add custom information here.", hint: "Only include relevant information.", sanitizeType: "strict" },
    subtitle: { label: "Subtitle", placeholder: "e.g. Organization, Institution, or Authority", hint: "Provide the name of the relevant organization or entity.", sanitizeType: "strict" },
    date: { label: "Date", placeholder: "e.g. January 2025 - Present or 2025", hint: "Enter format as Month Year (e.g. June 2025) or Date Range (e.g. June 2025 - Present).", sanitizeType: "date" },
    description: { label: "Description", placeholder: "e.g. Detailed description of achievements, activities, or notes.", hint: "Explain your contributions and achievements in this section.", sanitizeType: "strict" }
  };
  return sectionConfig[fieldKey] || defaults[fieldKey] || { label: fieldKey, placeholder: `Enter ${fieldKey}`, hint: `Provide details for ${fieldKey.toLowerCase()}.`, sanitizeType: "strict" };
};

const getSanitizer = (type) => {
  const map = {
    name: sanitizeName,
    role: sanitizeRole,
    url: sanitizeURL,
    year: sanitizeYear,
    digits: sanitizeDigits,
    date: sanitizeFlexibleDate
  };
  return map[type] || sanitizeStrictText;
};


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

// computeAtsReport is imported from ../utils/atsScorer

const normalizeProfileInfo = (profileInfo = {}) => {
  const { profilePreviewUrl, ...rest } = profileInfo || {};
  return {
    ...emptyResume.profileInfo,
    ...rest,
    ProfilePreviewUrl: rest.ProfilePreviewUrl || profilePreviewUrl || "",
  };
};

const makeListTitle = (section, index) => {
  const labels = {
    workExperience: "Experience",
    education: "Education",
    skills: "Skill",
    projects: "Project",
    certifications: "Certification",
    languages: "Language",
    interests: "Interest",
  };
  return `${labels[section] || section} ${index + 1}`;
};

const ResumeEditor = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(emptyResume);
  const [activeSection, setActiveSection] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [imageError, setImageError] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAtsPanel, setShowAtsPanel] = useState(false);
  const [atsBadgeVisible, setAtsBadgeVisible] = useState(true);
  const [atsBadgePos, setAtsBadgePos] = useState({ top: 32, left: 32 });
  /**
   * savedAtsReport — the backend-confirmed authoritative ATS report.
   * Sources (in order of precedence, all produce identical scores):
   *   1. Hydrated from resume.lastAtsScore on page load (zero extra call)
   *   2. Updated silently after every auto-save / manual save
   *   3. Updated when user clicks Run ATS Check in AiRefinePanel
   *
   * When null: badge shows localReport (live preview) labelled "Preview".
   * When set: badge shows savedAtsReport.atsScore labelled "Saved ✓".
   *
   * hasUnsavedChanges overrides the display to "Preview" even when
   * savedAtsReport exists, because the live score is more accurate.
   */
  const [savedAtsReport, setSavedAtsReport] = useState(null);
  const [atsSyncing, setAtsSyncing] = useState(false);
  const atsBadgeDragRef = useRef(null);
  const atsBadgePointerRef = useRef({ active: false, moved: false, startX: 0, startY: 0, originLeft: 0, originTop: 0 });
  const photoInputRef = useRef(null);

  const isFreePlan = user?.subscriptionPlan?.toLowerCase() !== "premium";

  const activeTabRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth < 768 && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSection]);


  const [baselineResume, setBaselineResume] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [skillsMode, setSkillsMode] = useState(() => localStorage.getItem("skillsEditingMode") || "individual");

  const handleSkillsModeChange = (mode) => {
    setSkillsMode(mode);
    localStorage.setItem("skillsEditingMode", mode);
    setResume(prev => ({
      ...prev,
      decoratives: {
        ...(prev.decoratives || {}),
        skillsMode: mode
      }
    }));
  };

  const hasUnsavedChanges = baselineResume !== null && JSON.stringify(resume) !== baselineResume;

  // Undo/Redo History refs and states
  const historyStack = useRef([]);
  const pointer = useRef(-1);
  const isUndoRedoAction = useRef(false);

  const pushToHistory = (state) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const stateStr = JSON.stringify(state);
    if (pointer.current >= 0 && historyStack.current[pointer.current] === stateStr) {
      return;
    }
    const newStack = historyStack.current.slice(0, pointer.current + 1);
    newStack.push(stateStr);
    if (newStack.length > 40) {
      newStack.shift();
    }
    historyStack.current = newStack;
    pointer.current = newStack.length - 1;
  };

  const undo = () => {
    if (pointer.current > 0) {
      isUndoRedoAction.current = true;
      pointer.current -= 1;
      const prevStr = historyStack.current[pointer.current];
      setResume(JSON.parse(prevStr));
    }
  };

  const redo = () => {
    if (pointer.current < historyStack.current.length - 1) {
      isUndoRedoAction.current = true;
      pointer.current += 1;
      const nextStr = historyStack.current[pointer.current];
      setResume(JSON.parse(nextStr));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isZ = e.key === "z" || e.key === "Z";
      const isY = e.key === "y" || e.key === "Y";
      if ((e.ctrlKey || e.metaKey) && isZ) {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && isY) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced observer to record history states automatically as changes occur
  useEffect(() => {
    if (!resume || pointer.current === -1) return;
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const timer = setTimeout(() => {
      pushToHistory(resume);
    }, 350);
    return () => clearTimeout(timer);
  }, [resume]);

  useEffect(() => {
    getResumeById(id)
      .then((res) => {
        const data = res.data;
        const normalized = {
          ...emptyResume,
          ...data,
          template: data.template || "template1",
          fontPairing: data.fontPairing || null,
          decoratives: data.decoratives || {},
          profileInfo: normalizeProfileInfo(data.profileInfo),
          contactInfo: { 
            ...emptyResume.contactInfo, 
            ...data.contactInfo,
            location: (() => {
              const loc = data.contactInfo?.location;
              if (loc && typeof loc === "object") {
                return {
                  value: loc.value ? loc.value.replace(/^(https?:\/\/)?(www\.)?/i, "") : "",
                  displayText: loc.displayText || ""
                };
              }
              return loc ? loc.replace(/^(https?:\/\/)?(www\.)?/i, "") : "";
            })()
          },
          workExperience: (data.workExperience || []).map(item => ({
            ...item,
            location: item.location ? item.location.replace(/^(https?:\/\/)?(www\.)?/i, "") : ""
          })),
          education: (data.education || []).map(item => ({
            ...item,
            location: item.location ? item.location.replace(/^(https?:\/\/)?(www\.)?/i, "") : ""
          })),
          skills: data.skills || [],
          projects: data.projects || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          interests: data.interests || [],
          customSections: (() => {
            const cs = { ...(data.customSections || {}) };
            if (cs.publications) {
              cs.publications = cs.publications.map(item => {
                const newItem = { ...item };
                if (newItem.paperUrl) {
                  newItem.paperUrl = newItem.paperUrl.trim();
                  if (newItem.paperUrl && !/^https?:\/\//i.test(newItem.paperUrl)) {
                    newItem.paperUrl = "https://" + newItem.paperUrl;
                  }
                }
                if (newItem.abstractAuthors !== undefined) {
                  newItem.abstract = newItem.abstractAuthors;
                  newItem.authors = "";
                  delete newItem.abstractAuthors;
                }
                return newItem;
              });
            }
            if (cs.technicalProfiles) {
              cs.technicalProfiles = cs.technicalProfiles.map(item => {
                const newItem = { ...item };
                delete newItem.subtitle;
                return newItem;
              });
            }
            return cs;
          })(),
        };
        setResume(normalized);
        setBaselineResume(JSON.stringify(normalized));
        setSkillsMode(normalized.decoratives?.skillsMode || localStorage.getItem("skillsEditingMode") || "individual");
        setLastSaved(new Date());

        // Hydrate the ATS badge from the persisted score — zero extra network call.
        // lastAtsScore is set by the backend whenever Run ATS Check succeeds.
        if (data.lastAtsScore != null) {
          const report = computeAtsReport(normalized);
          setSavedAtsReport(report);
        }

        // Initialize history stack with loaded state
        historyStack.current = [JSON.stringify(normalized)];
        pointer.current = 0;
      })
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    const key = `atsBadge:${id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.pos) {
        if (typeof parsed.pos.top === "number" && typeof parsed.pos.left === "number") {
          setAtsBadgePos(parsed.pos);
        } else if (typeof parsed.pos.bottom === "number" && typeof parsed.pos.right === "number") {
          // Backward-compatible migration from old bottom/right storage.
          setAtsBadgePos({ top: 9999, left: 9999 });
        }
      }
    } catch (_) {}
  }, [id]);

  useEffect(() => {
    const key = `atsBadge:${id}`;
    try {
      localStorage.setItem(key, JSON.stringify({ pos: atsBadgePos }));
    } catch (_) {}
  }, [id, atsBadgePos]);

  // Memoize local ATS report to avoid redundant heavy recalculations during renders
  const localReport = useMemo(() => {
    if (!resume) return null;
    return computeAtsReport(resume);
  }, [resume]);

  // Restore ATS badge visibility on template change, score change, or new ATS Refine result
  const currentTemplate = resume?.template;
  const currentLocalScore = localReport ? localReport.score : null;
  const currentSavedScore = savedAtsReport ? savedAtsReport.atsScore : null;

  useEffect(() => {
    setAtsBadgeVisible(true);
  }, [currentTemplate, currentLocalScore, currentSavedScore]);

  useEffect(() => {
    const clampBadgeToPreview = () => {
      const wrapper = atsBadgeDragRef.current;
      const parent = wrapper?.offsetParent;
      if (!parent) return;
      const badgeW = wrapper?.offsetWidth || 68;
      const badgeH = wrapper?.offsetHeight || 68;
      const maxLeft = Math.max(0, parent.clientWidth - badgeW);
      const maxTop = Math.max(0, parent.clientHeight - badgeH);
      setAtsBadgePos((prev) => ({
        left: Math.max(0, Math.min(maxLeft, prev.left)),
        top: Math.max(0, Math.min(maxTop, prev.top)),
      }));
    };

    const timer = setTimeout(clampBadgeToPreview, 0);
    window.addEventListener("resize", clampBadgeToPreview);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", clampBadgeToPreview);
    };
  }, [resume, activeSection]);

  const updateField = (section, field, value) =>
    setResume((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const updateListItem = (section, index, field, value) =>
    setResume((prev) => {
      const nextItems = [...prev[section]];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, [section]: nextItems };
    });

  const addListItem = (section, template) =>
    setResume((prev) => ({ ...prev, [section]: [...prev[section], template] }));

  const removeListItem = (section, index) =>
    setResume((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));

  // Auto-save logic: triggers a debounced save 1.5s after user stops typing
  useEffect(() => {
    if (baselineResume === null) return; // Wait until initial resume loads
    if (!hasUnsavedChanges) return;

    const delayDebounce = setTimeout(async () => {
      setSaving(true);
      setSaveError("");
      try {
        await updateResume(id, resume);
        setBaselineResume(JSON.stringify(resume));
        setLastSaved(new Date());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toastService.show("Changes Saved");
        // Silently sync the authoritative ATS score after every save.
        // This keeps savedAtsReport current without any user action.
        if (!isFreePlan) {
          const atsSuccess = await syncAtsAfterSave(id);
          if (!atsSuccess) {
            toastService.show("Resume saved successfully. Unable to refresh ATS score.", "warning");
          }
        } else {
          setSavedAtsReport(computeAtsReport(resume));
        }
      } catch (err) {
        setSaveError(err.response?.data?.message || "Could not auto-save changes.");
        toastService.show("Could not auto-save changes.", "warning");
      } finally {
        setSaving(false);
      }
    }, 1500);

    return () => clearTimeout(delayDebounce);
  }, [resume, baselineResume, hasUnsavedChanges, id]);

  /**
   * Silently fetches the authoritative backend ATS score after a save and
   * stores it in savedAtsReport. Returns boolean indicating success.
   */
  const syncAtsAfterSave = async (resumeId) => {
    if (atsSyncing) return true;
    try {
      setAtsSyncing(true);
      const res = await refineResume(resumeId, "background");
      setSavedAtsReport(res.data);
      return true;
    } catch (_) {
      return false;
    } finally {
      setAtsSyncing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateResume(id, resume);
      setBaselineResume(JSON.stringify(resume));
      setLastSaved(new Date());
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      toastService.show("Changes Saved");
      // Sync authoritative ATS score after manual save too (Pro only).
      if (!isFreePlan) {
        const atsSuccess = await syncAtsAfterSave(id);
        if (!atsSuccess) {
          toastService.show("Resume saved successfully. Unable to refresh ATS score.", "warning");
        }
      }
    } catch (err) {
      setSaveError(err.response?.data?.message || "Could not save this resume.");
      toastService.show("Could not save changes.", "warning");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImageError("File size exceeds the maximum limit of 2MB.");
      return;
    }
    setUploadingImage(true);
    setImageError("");
    try {
      const res = await uploadProfileImage(file);
      updateField("profileInfo", "ProfilePreviewUrl", res.data.imageUrl);
    } catch {
      setImageError("Could not upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removePhoto = () => {
    setImageError("");
    updateField("profileInfo", "ProfilePreviewUrl", "");
  };

  const getPDFBlob = async () => {
    const element = document.getElementById("resume-preview");
    if (!element) {
      throw new Error("Resume preview element not found. Please try again.");
    }

    // 1. Serialize all CSS rules from document.styleSheets
    // This resolves all dynamic Vite CSS, Tailwind, page styles, and dynamic font links.
    let importRules = "";
    let regularRules = "";
    const externalLinks = [];

    for (const sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        for (const rule of rules) {
          // CSSRule.IMPORT_RULE = 3. Put @import rules at the top of the stylesheet.
          if (rule.type === 3 || rule instanceof CSSImportRule) {
            importRules += rule.cssText + "\n";
          } else {
            regularRules += rule.cssText + "\n";
          }
        }
      } catch (e) {
        // Fallback for cross-origin or restricted stylesheets: copy the element
        if (sheet.ownerNode) {
          let nodeHtml = sheet.ownerNode.outerHTML;
          if (sheet.ownerNode.tagName === "LINK" && sheet.ownerNode.href) {
            // Convert relative stylesheet link href to absolute URL
            const absoluteHref = new URL(sheet.ownerNode.getAttribute("href"), window.location.href).href;
            nodeHtml = `<link rel="stylesheet" href="${absoluteHref}">`;
          }
          externalLinks.push(nodeHtml);
        }
      }
    }

    // Combine CSS rules, keeping @import rules strictly at the top
    let combinedCSS = importRules + regularRules;

    // 2. Adjust breakpoints inside the serialized CSS to prevent mobile-collapse at print viewport width (816px)
    // Replace `@media (max-width: 900px)` with `@media (max-width: 500px)` so desktop rules remain active in Puppeteer
    combinedCSS = combinedCSS.replace(/@media\s*\(\s*max-width\s*:\s*900px\s*\)/g, "@media (max-width: 500px)");

    let extraPrintStyles = "";
    if (resume.fontPairing === "fraunces") {
      extraPrintStyles = `
        #resume-preview h1,
        #resume-preview h2,
        #resume-preview h3,
        #resume-preview h4,
        #resume-preview .rp-ats-name,
        #resume-preview .rp-ats-name-serif,
        #resume-preview .rp-sidebar-name,
        #resume-preview .rp-executive-name,
        #resume-preview .rp-sig-name,
        #resume-preview .rp-centered-name,
        #resume-preview .rp-stitle {
          font-family: Georgia, 'Times New Roman', serif !important;
        }
      `;
    }

    const isFullBleed = element.getAttribute("data-hstyle") === "full-bleed" || element.classList.contains("rp-template3");
    const fullBleedPageStyle = isFullBleed ? `
      @page :first {
        margin-top: 0 !important;
      }
    ` : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${resume.title || "Resume"}</title>
          ${externalLinks.join("\n")}
          <style>
            ${combinedCSS}
          </style>
          <style>
            /* Reset print styles that interfere with Puppeteer page breaking and visibility */
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important; /* Hide scrollbars to prevent viewport width reductions */
              visibility: visible !important;
            }

            @page {
              size: letter;
              margin-top: 0px;
              margin-bottom: 36px;
              margin-left: 0;
              margin-right: 0;
            }

            ${fullBleedPageStyle}
            
            /* Ensure all contents are visible in the print view */
            body * {
              visibility: visible !important;
            }

            #resume-preview,
            #resume-preview *,
            .rp-ats-name,
            .rp-ats-name-serif,
            .rp-sidebar-name,
            .rp-executive-name,
            .rp-sig-name,
            .rp-centered-name {
              font-variant-ligatures: none !important;
              font-feature-settings: "liga" 0, "clig" 0, "calt" 0 !important;
              font-kerning: none !important;
              text-rendering: optimizeSpeed !important;
              letter-spacing: 0 !important;
              word-spacing: 0 !important;
            }

            /* Guarantee Target Role Badge readability on export */
            .rp-target-role-badge,
            .rp-ats-badge,
            .rp-ats-badge-left,
            .rp-academic-badge {
              background: var(--badge-bg, #f3f4f6) !important;
              color: var(--badge-text, #1f2937) !important;
              border-color: var(--badge-seeking, #d1d5db) !important;
            }
            .rp-role-seeking-label {
              color: var(--badge-seeking, #4b5563) !important;
            }
            .rp-target-role-text {
              color: var(--badge-text, #111827) !important;
            }

            ${extraPrintStyles}

            /* Professional link style overrides for exported PDF (body only) */
            .resume-preview[data-lstyle="professional"] .resume-link,
            .resume-preview[data-lstyle="professional"] .rp-inline-link,
            .resume-preview[data-lstyle="professional"] .rp-project-link,
            .resume-preview[data-lstyle="professional"] .rp-cert-link,
            .resume-preview[data-lstyle="professional"] .rp-tech-profile-link,
            .resume-preview[data-lstyle="professional"] .rp-tech-profile-url {
              color: inherit !important;
              text-decoration: none !important;
            }

            /* Header Contact Links in print PDF: Professional ON → plain text */
            .resume-preview[data-lstyle="professional"] .header-link,
            .resume-preview[data-lstyle="professional"] .rp-contact-link,
            .resume-preview[data-lstyle="professional"] .rp-contact a,
            .resume-preview[data-lstyle="professional"] .rp-ats-contact a {
              color: inherit !important;
              text-decoration: none !important;
            }

            /* Professional OFF: body links keep accent color, underlined; headers become blue underlined */
            .resume-preview:not([data-lstyle="professional"]) .resume-link,
            .resume-preview:not([data-lstyle="professional"]) .rp-inline-link,
            .resume-preview:not([data-lstyle="professional"]) .rp-project-link,
            .resume-preview:not([data-lstyle="professional"]) .rp-cert-link,
            .resume-preview:not([data-lstyle="professional"]) .rp-tech-profile-link,
            .resume-preview:not([data-lstyle="professional"]) .rp-tech-profile-url {
              color: var(--hyperlink-color, var(--accent-readable)) !important;
              text-decoration: underline !important;
              text-decoration-thickness: 0.5px !important;
              text-underline-offset: 1.5px !important;
            }
            .resume-preview:not([data-lstyle="professional"]):not(.rp-premium1):not(.rp-premium9):not(.rp-tech-faang) .header-link,
            .resume-preview:not([data-lstyle="professional"]):not(.rp-premium1):not(.rp-premium9):not(.rp-tech-faang) .rp-contact-link,
            .resume-preview:not([data-lstyle="professional"]):not(.rp-premium1):not(.rp-premium9):not(.rp-tech-faang) .rp-contact a,
            .resume-preview:not([data-lstyle="professional"]):not(.rp-premium1):not(.rp-premium9):not(.rp-tech-faang) .rp-ats-contact a {
              color: #2563eb !important;
              text-decoration: underline !important;
              text-decoration-thickness: 0.5px !important;
              text-underline-offset: 1.5px !important;
            }

            .resume-preview {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            
            h1, h2, h3, h4, strong {
              color: #000000 !important;
            }

            .rp-desc-list li::marker,
            .rp-item-desc ul > li::marker {
              color: currentColor !important;
            }
            
            .rp-sidebar-dark .rp-sidebar-name,
            .rp-sidebar-dark .rp-sidebar-role,
            .rp-sidebar-dark .rp-contact,
            .rp-sidebar-dark .rp-contact a,
            .rp-sidebar-dark .rp-contact-link,
            .rp-sidebar-dark .rp-stitle,
            .rp-sidebar-dark .rp-skill-name,
            .rp-sidebar-dark .rp-skill-level,
            .rp-sidebar-dark .rp-item-head,
            .rp-sidebar-dark .rp-item-head strong,
            .rp-sidebar-dark .rp-item-sub,
            .rp-sidebar-dark .rp-item-sub span,
            .rp-sidebar-dark .rp-item-desc,
            .rp-sidebar-dark .rp-item-desc li,
            .rp-sidebar-dark .rp-item-desc strong,
            .rp-sidebar-dark .rp-summary,
            .rp-sidebar-dark .rp-tags .rp-tag,
            .rp-sidebar-dark .rp-compact-date,
            .rp-sidebar-dark .rp-compact-subtitle,
            .rp-sidebar-dark .rp-target-role-badge,
            .rp-sidebar-dark .rp-role-seeking-label,
            .rp-sidebar-dark .rp-desc-list li::marker,
            .rp-sidebar-dark .rp-item-desc ul > li::marker {
              color: #ffffff !important;
            }

            [data-hstyle="full-bleed"] .rp-sidebar,
            [data-hstyle="full-bleed"] .rp-sidebar *,
            [data-hstyle="fullBleed"] .rp-sidebar,
            [data-hstyle="fullBleed"] .rp-sidebar * {
              color: #ffffff !important;
            }

            [data-hstyle="full-bleed"] .rp-sidebar .rp-desc-list li::marker,
            [data-hstyle="full-bleed"] .rp-sidebar .rp-item-desc ul > li::marker,
            [data-hstyle="fullBleed"] .rp-sidebar .rp-desc-list li::marker,
            [data-hstyle="fullBleed"] .rp-sidebar .rp-item-desc ul > li::marker {
              color: #ffffff !important;
            }
            
            .rp-item-sub {
              color: #333333 !important;
            }
            
            .rp-item-desc, .rp-summary {
              color: #222222 !important;
            }
            
            .rp-contact, 
            .rp-item-head span, 
            .rp-compact span, 
            .rp-links,
            .rp-ats-contact,
            .rp-ats-bullet {
              color: #444444 !important;
            }

            .rp-contact,
            .rp-ats-contact {
              display: block !important;
              width: 100% !important;
              clear: both !important;
              margin-bottom: 12px !important;
            }

            .rp-sidebar .rp-contact {
              display: flex !important;
              flex-direction: column !important;
              gap: 4px !important;
              margin-bottom: 12px !important;
            }

            .rp-contact span,
            .rp-ats-contact-item {
              display: inline !important;
              float: none !important;
              margin-right: 14px !important;
              white-space: normal !important;
            }

            .rp-sidebar .rp-contact span {
              display: flex !important;
              float: none !important;
              margin-right: 0 !important;
              white-space: nowrap !important;
            }

            .rp-contact a,
            .rp-ats-contact a,
            .rp-links a,
            a.rp-project-link,
            a.rp-custom-link {
              display: inline !important;
              position: static !important;
              float: none !important;
              white-space: normal !important;
            }

            .rp-ats-contact-item {
              margin-right: 6px !important;
            }

            .rp-contact span:last-child,
            .rp-ats-contact-item:last-child {
              margin-right: 0 !important;
            }

            #resume-preview, .resume-preview {
              position: static !important; /* Restore normal flow to prevent layout collapse */
              display: flow-root !important;
              width: 816px !important; /* Force exact same width as desktop live preview */
              max-width: 816px !important;
              height: auto !important;
              min-height: 1056px !important; /* Maintain standard Letter sheet aspect ratio */
              margin: 0 auto !important;
              padding: 0 !important; /* Retain only the template's internal spacing to align text & photos */
              box-shadow: none !important;
              border: var(--page-border, none) !important;
              overflow: visible !important;
              visibility: visible !important;
              box-sizing: border-box !important;
              background-color: #ffffff !important;
            }
            
            /* Ensure headers, icons, and text are visible and retain their template display behaviors (flex, grid, etc.) */
            header, .rp-header, .rp-ats-header, .rp-ats-header-left, .rp-academic-header {
              visibility: visible !important;
              opacity: 1 !important;
            }

            /* Isolate all headers and establish block/flex isolation to prevent semantic leakage */
            .rp-header,
            .rp-sidebar-header,
            .rp-ats-header,
            .rp-ats-header-left,
            .rp-academic-header {
              clear: both !important;
              width: 100% !important;
              margin-bottom: 20px !important;
            }

            .rp-ats-header,
            .rp-ats-header-left,
            .rp-academic-header,
            .rp-sidebar-header,
            .rp-header-executive,
            .rp-header-centered {
              display: flow-root !important;
            }

            .rp-header-classic,
            .rp-header-bleed,
            .rp-header-compact,
            .rp-header-sig,
            .rp-header-accentbar,
            .rp-header-tech {
              display: flex !important;
            }

            /* Prevent page breaks inside critical items and layouts */
            .rp-stitle-num,
            .rp-header,
            .rp-sidebar-header,
            .rp-ats-header,
            .rp-ats-header-left,
            .rp-academic-header,
            .rp-skill-bar-wrap,
            .rp-skill-row,
            .rp-compact,
            .rp-contact,
            .rp-ats-contact {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Prevent headings from being orphaned at the bottom of the page */
            .rp-stitle,
            h1, h2, h3, h4 {
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Keep experience/project metadata together and with its content */
            .rp-item-head,
            .rp-item-sub {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            /* Prevent single list items (bullet points) from splitting across pages */
            .rp-item-desc li {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Allow experience/project containers to split naturally, preventing massive gaps */
            .rp-item {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Keep sections together whenever possible */
            .rp-section, section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Split layout: flex row so sidebar and main col stretch to equal height,
               matching the screen display:grid behaviour.
               Float cannot be used — floated elements cannot equal-height each other. */
            .rp-layout-sidebar {
              display: flex !important;
              flex-direction: row !important;
              align-items: stretch !important;
              width: 100% !important;
              height: auto !important;
              box-sizing: border-box !important;
            }

            .rp-layout-sidebar::after {
              display: none !important;
            }

            .rp-layout-sidebar > .rp-sidebar {
              width: 210px !important;
              flex-shrink: 0 !important;
              float: none !important;
              display: flex !important;
              flex-direction: column !important;
              align-self: stretch !important;
              /* Explicitly override generic height:auto !important so Chromium
                 honours the flex cross-axis stretch. */
              min-height: 100% !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }

            .rp-layout-sidebar > .rp-main-col {
              flex-grow: 1 !important;
              width: calc(100% - 210px) !important;
              float: none !important;
              display: block !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }

            /* ── Technical Profiles — theme-aware colours (mirrors ResumePreview.css) ── */
            /* Name inherits surrounding theme; only URL gets accent colour */
            .rp-tech-profile-name {
              color: inherit !important;
            }
            .rp-tech-profile-url {
              color: var(--accent-readable, #2563EB) !important;
              text-decoration: underline !important;
              text-decoration-thickness: 0.5px !important;
            }
            .rp-tech-profile-date {
              color: #4B5563 !important;
            }
            .rp-tech-profile-highlight,
            .rp-tech-profile-ranking,
            .rp-tech-profile-desc,
            .rp-tech-profile-highlight .rp-desc-text,
            .rp-tech-profile-ranking .rp-desc-text,
            .rp-tech-profile-desc .rp-desc-text,
            .rp-tech-profile-highlight li,
            .rp-tech-profile-ranking li,
            .rp-tech-profile-desc li {
              color: #4B5563 !important;
            }

            /* Dark sidebar: name and URL both go white */
            .rp-sidebar-dark .rp-tech-profile-name {
              color: inherit !important;
            }
            .rp-sidebar-dark .rp-tech-profile-url {
              color: rgba(255,255,255,0.9) !important;
              text-decoration-color: rgba(255,255,255,0.4) !important;
            }
            .rp-sidebar-dark .rp-tech-profile-date {
              color: rgba(255,255,255,0.65) !important;
            }
            .rp-sidebar-dark .rp-tech-profile-highlight,
            .rp-sidebar-dark .rp-tech-profile-ranking,
            .rp-sidebar-dark .rp-tech-profile-desc,
            .rp-sidebar-dark .rp-tech-profile-highlight .rp-desc-text,
            .rp-sidebar-dark .rp-tech-profile-ranking .rp-desc-text,
            .rp-sidebar-dark .rp-tech-profile-desc .rp-desc-text,
            .rp-sidebar-dark .rp-tech-profile-highlight li,
            .rp-sidebar-dark .rp-tech-profile-ranking li,
            .rp-sidebar-dark .rp-tech-profile-desc li {
              color: rgba(255,255,255,0.8) !important;
            }

            /* Light sidebar: accent for URL, inherit for name */
            .rp-sidebar-light .rp-tech-profile-name,
            .rp-sidebar-infographic .rp-tech-profile-name {
              color: inherit !important;
            }
            .rp-sidebar-light .rp-tech-profile-url,
            .rp-sidebar-infographic .rp-tech-profile-url {
              color: var(--accent-readable, #2563EB) !important;
            }
            .rp-sidebar-light .rp-tech-profile-date,
            .rp-sidebar-infographic .rp-tech-profile-date {
              color: #4B5563 !important;
            }
            .rp-sidebar-light .rp-tech-profile-highlight,
            .rp-sidebar-light .rp-tech-profile-ranking,
            .rp-sidebar-light .rp-tech-profile-desc,
            .rp-sidebar-light .rp-tech-profile-highlight .rp-desc-text,
            .rp-sidebar-light .rp-tech-profile-ranking .rp-desc-text,
            .rp-sidebar-light .rp-tech-profile-desc .rp-desc-text,
            .rp-sidebar-light .rp-tech-profile-highlight li,
            .rp-sidebar-light .rp-tech-profile-ranking li,
            .rp-sidebar-light .rp-tech-profile-desc li,
            .rp-sidebar-infographic .rp-tech-profile-highlight,
            .rp-sidebar-infographic .rp-tech-profile-ranking,
            .rp-sidebar-infographic .rp-tech-profile-desc,
            .rp-sidebar-infographic .rp-tech-profile-highlight .rp-desc-text,
            .rp-sidebar-infographic .rp-tech-profile-ranking .rp-desc-text,
            .rp-sidebar-infographic .rp-tech-profile-desc .rp-desc-text,
            .rp-sidebar-infographic .rp-tech-profile-highlight li,
            .rp-sidebar-infographic .rp-tech-profile-ranking li,
            .rp-sidebar-infographic .rp-tech-profile-desc li {
              color: #4B5563 !important;
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `;

    const response = await exportResumePdf(id, htmlContent, isFreePlan);
    return response.data;
  };
  window.getPDFBlob = getPDFBlob;

  const downloadPDF = async () => {
    const element = document.getElementById("resume-preview");
    if (!element) {
      setSaveError("Resume preview not found. Please try again.");
      return;
    }
    setDownloadingPdf(true);
    setSaveError("");
    try {
      const blob = await getPDFBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(resume.title || "resume").trim() || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setSaveError("Failed to generate PDF download. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const chooseTemplate = (templateId, locked) => {
    if (locked) return;
    setResume((prev) => ({ ...prev, template: templateId }));
  };

  if (loading) {
    return (
      <div className="editor-page premium-shell skeleton">
        <header className="editor-topbar">
          <Link to="/dashboard" className="editor-back">← Back</Link>
          <div className="skeleton-line" style={{ width: "200px", height: "24px", marginLeft: "1rem" }} />
          <div className="editor-topbar-actions">
            <div className="skeleton-line" style={{ width: "100px", height: "38px" }} />
            <div className="skeleton-line" style={{ width: "80px", height: "38px" }} />
          </div>
        </header>
        <div className="editor-body">
          <aside className="editor-sidebar">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="skeleton-line" style={{ width: "80%", height: "40px", margin: "10px auto" }} />
            ))}
          </aside>
          <main className="editor-main">
            <div className="editor-section">
              <div className="skeleton-line" style={{ width: "150px", height: "28px", marginBottom: "20px" }} />
              {[1, 2, 3].map((n) => (
                <div key={n} className="field" style={{ marginBottom: "15px" }}>
                  <div className="skeleton-line" style={{ width: "100px", height: "14px", marginBottom: "8px" }} />
                  <div className="skeleton-line" style={{ width: "100%", height: "40px" }} />
                </div>
              ))}
            </div>
          </main>
          <section className="editor-preview-panel">
            <div className="skeleton-line" style={{ width: "120px", height: "20px", marginBottom: "15px" }} />
            <div className="skeleton-thumb" style={{ height: "600px", borderRadius: "4px" }} />
          </section>
        </div>
      </div>
    );
  }

      const fresher = isFresher(resume);
      const visibility = {
        summary: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true
      };
      if (resume.decoratives?.sectionVisibility) {
        try {
          Object.assign(visibility, JSON.parse(resume.decoratives.sectionVisibility));
        } catch (e) {}
      }
      // Optional sections default overrides
      allPossibleOptionalIds.forEach(id => {
        if (visibility[id] === undefined) {
          if (id === "internships" && fresher) {
            visibility[id] = true;
          } else if (id === "experience" && !fresher) {
            visibility[id] = true;
          } else {
            visibility[id] = false;
          }
        }
      });

      let sectionOrderList = resume.decoratives?.sectionOrder 
        ? resume.decoratives.sectionOrder.split(",") 
        : null;
      if (!sectionOrderList) {
        if (fresher) {
          sectionOrderList = ["summary", "education", "skills", "projects", "internships", "certifications"];
        } else {
          sectionOrderList = ["summary", "experience", "skills", "projects", "education", "certifications"];
        }
      }

      // Ensure all possible optional sections are in sectionOrderList
      allPossibleOptionalIds.forEach(id => {
        if (!sectionOrderList.includes(id)) {
          sectionOrderList.push(id);
        }
      });

      const activeSections = [
        "Profile",
        "Contact",
      ];

      sectionOrderList.forEach(secId => {
        if (visibility[secId] !== false) {
          const label = getSectionLabel(secId);
          if (!activeSections.includes(label)) {
            activeSections.push(label);
          }
        }
      });

      // Issue 3: Section Layout promoted before Customization
      activeSections.push(
        "Section Layout",
        "Customization",
        "ATS Refine"
      );

      const optionalSectionEntry = allPossibleOptionalIds.find(id => {
        const isBuiltIn = ["experience", "education", "skills", "projects", "certifications", "summary"].includes(id);
        return !isBuiltIn && getSectionLabel(id) === activeSection;
      });

      const handleSectionVisibilityToggle = (secId, currentVal) => {
        const nextVisibility = { ...visibility, [secId]: !currentVal };
        setResume((prev) => ({
          ...prev,
          decoratives: {
            ...prev.decoratives,
            sectionVisibility: JSON.stringify(nextVisibility)
          }
        }));
      };

      return (
        <div className="editor-page premium-shell">
          <header className="editor-topbar">
            <Link to="/dashboard" className="editor-back">← Back</Link>
            <input
              className="editor-title-input"
              value={resume.title}
              onChange={(e) => setResume((prev) => ({ ...prev, title: sanitizeStrictText(e.target.value) }))}
              placeholder="Resume title"
            />
            <div className="editor-topbar-actions">
              {saveError && <span className="topbar-error">{saveError}</span>}
              <button
                type="button"
                className={`btn-outline-sm btn-fresher ${resume.decoratives?.fresherMode === "true" ? "fresher-active" : ""}`}
                style={{
                  background: resume.decoratives?.fresherMode === "true" ? "rgba(184, 255, 44, 0.15)" : "transparent",
                  borderColor: resume.decoratives?.fresherMode === "true" ? "var(--accent-dark)" : "var(--line)",
                  color: "var(--ink)",
                  fontWeight: "600"
                }}
                onClick={() => {
                  setResume((prev) => {
                    const isNowFresher = prev.decoratives?.fresherMode !== "true";
                    const nextDec = { ...prev.decoratives, fresherMode: isNowFresher ? "true" : "false" };
                    delete nextDec.sectionOrder;
                    return { ...prev, decoratives: nextDec };
                  });
                }}
                title="Toggle Fresher Mode to prioritize Academic credentials & Projects over professional experience"
              >
                {resume.decoratives?.fresherMode === "true" ? "Fresher Mode On" : "Fresher Mode Off"}
              </button>

              {/* Email send is a Pro feature — free users get a tooltip nudge instead */}
              {isFreePlan ? (
                <button
                  className="btn-outline-sm btn-email"
                  onClick={() => alert("Email sharing is a Pro feature. Upgrade to send your resume directly.")}
                  title="Upgrade to Pro to send by email"
                >
                  Send email (Pro)
                </button>
              ) : (
                <button className="btn-outline-sm btn-email" onClick={() => setShowEmailModal(true)}>
                  Send email
                </button>
              )}
              <div className="history-controls" style={{ display: "flex", gap: "0.25rem", marginRight: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-outline-sm btn-history"
                  onClick={undo}
                  disabled={pointer.current <= 0}
                  title="Undo (Ctrl+Z)"
                  style={{
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pointer.current <= 0 ? 0.4 : 1,
                    cursor: pointer.current <= 0 ? "not-allowed" : "pointer",
                    fontSize: "1.1rem"
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="btn-outline-sm btn-history"
                  onClick={redo}
                  disabled={pointer.current >= historyStack.current.length - 1}
                  title="Redo (Ctrl+Y)"
                  style={{
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pointer.current >= historyStack.current.length - 1 ? 0.4 : 1,
                    cursor: pointer.current >= historyStack.current.length - 1 ? "not-allowed" : "pointer",
                    fontSize: "1.1rem"
                  }}
                >
                  ↻
                </button>
              </div>
              <div className="save-status-container" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--muted)", marginRight: "0.5rem" }}>
                {hasUnsavedChanges && (
                  <span className="unsaved-dot" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#e76f51" }} title="Unsaved Changes" />
                )}
                <span>
                  {saving ? "Saving..." : saved ? "Changes Saved" : hasUnsavedChanges ? "Unsaved Changes" : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "Saved"}
                </span>
              </div>
            </div>
          </header>

          <div className="editor-body">
            <aside className="editor-sidebar">
              <span className="swipe-sections-hint">Swipe sections →</span>
              {activeSections.map((section) => (
                <button
                  key={section}
                  className={`sidebar-btn ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                  ref={activeSection === section ? activeTabRef : null}
                >
                  {section}
                </button>
              ))}
            </aside>

            <main className="editor-main">
              {activeSection === "Profile" && (
                <Section title="Profile">
                  <Field label="Full name" value={resume.profileInfo.fullName} placeholder="John Doe" hint="Enter your full name." sanitize={sanitizeName} onChange={(v) => updateField("profileInfo", "fullName", v)} />
                  <Field label="Designation" value={resume.profileInfo.designation} placeholder="Software Engineer" hint="Your professional title." sanitize={sanitizeRole} onChange={(v) => updateField("profileInfo", "designation", v)} />
                  <div className="field">
                <label>Profile photo</label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="editor-photo-input"
                />
                <div className="editor-photo-control">
                  {resume.profileInfo.ProfilePreviewUrl && (
                    <img src={resume.profileInfo.ProfilePreviewUrl} alt="" className="editor-photo-preview" />
                  )}
                  <div className="editor-photo-actions">
                    <button
                      type="button"
                      className="btn-outline-sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {resume.profileInfo.ProfilePreviewUrl ? "Change Photo" : "Upload Photo"}
                    </button>
                    {resume.profileInfo.ProfilePreviewUrl && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={removePhoto}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {imageError && <p className="field-error">{imageError}</p>}
              </div>
            </Section>
          )}

          {activeSection === "Summary" && (
            <Section title="Summary">
              <Field 
                label="Summary" 
                value={resume.profileInfo.summary} 
                placeholder="Frontend developer with experience in React and JavaScript."
                hint="Write 2–3 short sentences. Example: Built web projects using React and REST APIs."
                sanitize={sanitizeStrictText}
                onChange={(v) => updateField("profileInfo", "summary", v)} 
                textarea 
                className="summary-field"
              />
            </Section>
          )}

          {activeSection === "Contact" && (
            <Section title="Contact">
              <CustomizableContactField platform="email"    label="Email"    value={resume.contactInfo.email}    onChange={(v) => updateField("contactInfo", "email", v)} placeholder="name@example.com" hint="Use a professional email." />
              <CustomizableContactField platform="phone"    label="Phone"    value={resume.contactInfo.phone}    onChange={(v) => updateField("contactInfo", "phone", v)} placeholder="+91 9876543210" hint="Include country code if needed." isPhone={true} />
              <CustomizableContactField platform="location" label="Location" value={resume.contactInfo.location} onChange={(v) => updateField("contactInfo", "location", v)} placeholder="Hyderabad, India" hint="City and country are enough." />
              <CustomizableContactField platform="linkedin" label="LinkedIn" value={resume.contactInfo.linkedIn} onChange={(v) => updateField("contactInfo", "linkedIn", v)} placeholder="linkedin.com/in/username" hint="Optional but recommended." />
              <CustomizableContactField platform="github"   label="GitHub"   value={resume.contactInfo.github}   onChange={(v) => updateField("contactInfo", "github", v)} placeholder="github.com/username" hint="Add if you have projects." />
              <CustomizableContactField platform="website"  label="Website"  value={resume.contactInfo.website}  onChange={(v) => updateField("contactInfo", "website", v)} placeholder="https://example.com" hint="Your portfolio or personal website." />
            </Section>
          )}

          {activeSection === "Experience" && (
            <Section title="Work Experience" onAdd={() => addListItem("workExperience", { company: "", role: "", location: "", startDate: "", endDate: "", description: "" })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-experience"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.experience !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.experience = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-experience" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.workExperience.map((item, index) => (
                <ListCard key={index} title={item.role || makeListTitle("workExperience", index)} onRemove={() => removeListItem("workExperience", index)}>
                  <Field label="Company" value={item.company} placeholder="Google" hint="Enter the full name of the company or organization." sanitize={sanitizeTextOnly} onChange={(v) => updateListItem("workExperience", index, "company", v)} />
                  <Field label="Role" value={item.role} placeholder="Software Engineering Intern" hint="Your job title or role during this experience." sanitize={sanitizeRole} onChange={(v) => updateListItem("workExperience", index, "role", v)} />
                  <Field label="Location" value={item.location || ""} sanitize={sanitizeLocation} onChange={(v) => updateListItem("workExperience", index, "location", v)} placeholder="e.g. City, State or Country" hint="City and State/Country (e.g., Hyderabad, India)." />
                  <DateRangePicker
                    startDate={item.startDate}
                    endDate={item.endDate}
                    onChange={({ startDate, endDate }) => {
                      updateListItem("workExperience", index, "startDate", startDate);
                      updateListItem("workExperience", index, "endDate", endDate);
                    }}
                  />
                  <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block", marginBottom: "1rem" }}>Supported formats: Month Year (e.g. Jan 2025), Year only (e.g. 2025), or Present for end dates.</small>
                  <Field 
                    label="Description" 
                    value={item.description} 
                    placeholder="Built responsive web pages using React."
                    hint="Write 2–4 simple bullet points. Example: Improved UI performance and fixed bugs."
                    sanitize={sanitizeStrictText}
                    onChange={(v) => updateListItem("workExperience", index, "description", v)} 
                    textarea 
                  />
                </ListCard>
              ))}
            </Section>
          )}

          {activeSection === "Education" && (
            <Section title="Education" onAdd={() => addListItem("education", { degree: "", institution: "", location: "", gpa: "", startDate: "", endDate: "", description: "" })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-education"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.education !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.education = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-education" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.education.map((item, index) => (
                <ListCard key={index} title={item.degree || makeListTitle("education", index)} onRemove={() => removeListItem("education", index)}>
                  <Field label="Degree" value={item.degree} placeholder="B.Tech Information Technology" hint="Degree or credential earned (e.g., B.Tech, M.S.)." sanitize={sanitizeStrictText} onChange={(v) => updateListItem("education", index, "degree", v)} />
                  <Field label="Institution" value={item.institution} placeholder="St. Martin's Engineering College" hint="Name of the school or university." sanitize={sanitizeTextOnly} onChange={(v) => updateListItem("education", index, "institution", v)} />
                  <Field label="Location" value={item.location || ""} sanitize={sanitizeLocation} onChange={(v) => updateListItem("education", index, "location", v)} placeholder="e.g. City, State" hint="City and State/Country of the school." />
                  <Field label="GPA" value={item.gpa || ""} placeholder="8.5" hint="Optional." sanitize={sanitizeDecimal} onChange={(v) => updateListItem("education", index, "gpa", v)} />
                  <DateRangePicker
                    startDate={item.startDate}
                    endDate={item.endDate}
                    onChange={({ startDate, endDate }) => {
                      updateListItem("education", index, "startDate", startDate);
                      updateListItem("education", index, "endDate", endDate);
                    }}
                  />
                  <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block", marginBottom: "1rem" }}>Supported formats: Year (e.g. 2026) or Month Year (e.g. June 2026).</small>
                  <Field 
                    label="Details / Coursework" 
                    value={item.description || ""} 
                    placeholder="Data Structures, DBMS, Operating Systems"
                    hint="Relevant coursework, projects, or academic honors."
                    sanitize={sanitizeStrictText}
                    onChange={(v) => updateListItem("education", index, "description", v)} 
                    textarea 
                  />
                </ListCard>
              ))}
            </Section>
          )}

          {activeSection === "Skills" && (
            <Section title="Skills" onAdd={() => addListItem("skills", { name: "", progress: 70 })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-skills"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.skills !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.skills = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-skills" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>

              <div className="skills-mode-selector">
                <span className="skills-mode-title">Editing Style</span>
                <div className="skills-mode-grid">
                  <button
                    type="button"
                    className={`skills-mode-card ${skillsMode === "individual" ? "selected" : ""}`}
                    onClick={() => handleSkillsModeChange("individual")}
                  >
                    <span className="skills-mode-card-title">
                      <input
                        type="radio"
                        checked={skillsMode === "individual"}
                        readOnly
                      />
                      Individual Skills
                    </span>
                    <span className="skills-mode-card-desc">
                      Each category is edited separately. (Default)
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`skills-mode-card ${skillsMode === "category" ? "selected" : ""}`}
                    onClick={() => handleSkillsModeChange("category")}
                  >
                    <span className="skills-mode-card-title">
                      <input
                        type="radio"
                        checked={skillsMode === "category"}
                        readOnly
                      />
                      Category Skills
                    </span>
                    <span className="skills-mode-card-desc">
                      Organize skills using category titles and comma-separated skills.
                    </span>
                  </button>
                </div>
              </div>

              {skillsMode === "category" ? (
                resume.skills.map((item, index) => {
                  const name = item.name || "";
                  const colonIdx = name.indexOf(":");
                  const categoryValue = colonIdx !== -1 ? name.substring(0, colonIdx).trim() : "";
                  const skillsValue = colonIdx !== -1 ? name.substring(colonIdx + 1).trim() : name.trim();

                  const handleCategoryChange = (newCategory) => {
                    const newName = newCategory ? `${newCategory}: ${skillsValue}` : skillsValue;
                    updateListItem("skills", index, "name", newName);
                  };

                  const handleSkillsChange = (newSkills) => {
                    const cleaned = newSkills.replace(/,,+/g, ",").replace(/, ,+/g, ", ");
                    const newName = categoryValue ? `${categoryValue}: ${cleaned}` : cleaned;
                    updateListItem("skills", index, "name", newName);
                  };

                  const handleSkillsBlur = (e) => {
                    const val = e.target.value;
                    const normalized = val
                      .split(",")
                      .map(s => s.trim())
                      .filter(Boolean)
                      .join(", ");
                    const newName = categoryValue ? `${categoryValue}: ${normalized}` : normalized;
                    updateListItem("skills", index, "name", newName);
                  };

                  return (
                    <ListCard
                      key={index}
                      title={categoryValue || skillsValue || makeListTitle("skills", index)}
                      onRemove={() => removeListItem("skills", index)}
                    >
                      <Field
                        label="Category Title"
                        value={categoryValue}
                        placeholder="Languages, Web Development, etc."
                        onChange={handleCategoryChange}
                      />
                      <Field
                        label="Skills"
                        value={skillsValue}
                        placeholder="Java, Python, HTML, JavaScript"
                        hint="Separate skills with commas."
                        onChange={handleSkillsChange}
                        onBlur={handleSkillsBlur}
                      />
                      <RangeField
                        label="Proficiency"
                        value={item.progress}
                        onChange={(v) => updateListItem("skills", index, "progress", v)}
                      />
                    </ListCard>
                  );
                })
              ) : (
                resume.skills.map((item, index) => (
                  <ListCard key={index} title={item.name || makeListTitle("skills", index)} onRemove={() => removeListItem("skills", index)}>
                    <Field label="Skill" value={item.name} placeholder="Java" hint="Separate skills with commas." sanitize={sanitizeRawText} onChange={(v) => updateListItem("skills", index, "name", v)} />
                    <RangeField label="Proficiency" value={item.progress} onChange={(v) => updateListItem("skills", index, "progress", v)} />
                  </ListCard>
                ))
              )}
            </Section>
          )}

          {activeSection === "Projects" && (
            <Section title="Projects" onAdd={() => addListItem("projects", { title: "", description: "", github: "", liveDemo: "" })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-projects"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.projects !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.projects = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-projects" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.projects.map((item, index) => (
                <ListCard key={index} title={item.title || makeListTitle("projects", index)} onRemove={() => removeListItem("projects", index)}>
                  <Field label="Project title" value={item.title} placeholder="AI Resume Builder" hint="Name of the project." sanitize={sanitizeTextOnly} onChange={(v) => updateListItem("projects", index, "title", v)} />
                  <Field 
                    label="Description" 
                    value={item.description} 
                    placeholder="Built a resume builder with ATS scoring."
                    hint="Explain what the project does. Example: Created a web app for resume creation."
                    sanitize={sanitizeStrictText}
                    onChange={(v) => updateListItem("projects", index, "description", v)} 
                    textarea 
                  />
                  <Field
                    label="GitHub URL"
                    value={item.github}
                    placeholder="https://github.com/username/project"
                    hint="Link to the repository."
                    sanitize={sanitizeURL}
                    onChange={(v) => updateListItem("projects", index, "github", v)}
                    onBlur={(e) => {
                      const normalized = normalizeUrl("github", e.target.value);
                      updateListItem("projects", index, "github", normalized);
                    }}
                  />
                  <Field
                    label="Live demo URL"
                    value={item.liveDemo}
                    placeholder="https://example.com"
                    hint="Link to the working application."
                    sanitize={sanitizeURL}
                    onChange={(v) => updateListItem("projects", index, "liveDemo", v)}
                    onBlur={(e) => {
                      const normalized = normalizeUrl("website", e.target.value);
                      updateListItem("projects", index, "liveDemo", normalized);
                    }}
                  />
                </ListCard>
              ))}
            </Section>
          )}

          {activeSection === "Certifications" && (
            <Section title="Certifications" onAdd={() => addListItem("certifications", { title: "", issuer: "", year: "", certificateUrl: "" })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-certifications"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.certifications !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.certifications = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-certifications" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.certifications.map((item, index) => (
                <ListCard key={index} title={item.title || makeListTitle("certifications", index)} onRemove={() => removeListItem("certifications", index)}>
                  <Field label="Title" value={item.title} placeholder="AWS Cloud Practitioner" hint="Name of the certification earned." sanitize={sanitizeTextOnly} onChange={(v) => updateListItem("certifications", index, "title", v)} />
                  <Field label="Issuer" value={item.issuer} placeholder="Amazon Web Services" hint="Organization that issued this certificate." sanitize={sanitizeTextOnly} onChange={(v) => updateListItem("certifications", index, "issuer", v)} />
                  <Field label="Date" value={item.year} placeholder="March 2025" hint="Date or year when you received the certification." sanitize={sanitizeFlexibleDate} onChange={(v) => updateListItem("certifications", index, "year", v)} />
                  <Field
                    label="Certificate URL"
                    value={item.certificateUrl || ""}
                    placeholder="https://example.com/certificate"
                    hint="Optional link to verify the certificate online."
                    sanitize={sanitizeURL}
                    onChange={(v) => updateListItem("certifications", index, "certificateUrl", v)}
                    onBlur={(e) => {
                      const normalized = normalizeUrl("website", e.target.value);
                      updateListItem("certifications", index, "certificateUrl", normalized);
                    }}
                  />
                </ListCard>
              ))}
            </Section>
          )}

          {activeSection === "Languages" && (
            <Section title="Languages" onAdd={() => addListItem("languages", { name: "", progress: 70 })}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-languages"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.languages !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.languages = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-languages" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.languages.map((item, index) => (
                <ListCard key={index} title={item.name || makeListTitle("languages", index)} onRemove={() => removeListItem("languages", index)}>
                  <Field label="Language" value={item.name} placeholder="English" hint="Separate with commas." sanitize={sanitizeRawText} onChange={(v) => updateListItem("languages", index, "name", v)} />
                  <RangeField label="Proficiency" value={item.progress} onChange={(v) => updateListItem("languages", index, "progress", v)} />
                </ListCard>
              ))}
            </Section>
          )}

          {activeSection === "Interests" && (
            <Section title="Interests" onAdd={() => addListItem("interests", "")}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="bullets-toggle-interests"
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config.interests !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config.interests = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor="bullets-toggle-interests" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {resume.interests.length === 0 && (
                <p className="editor-note">No interests added yet. Click "Add" to start.</p>
              )}
              {resume.interests.map((item, index) => (
                <div key={index} className="list-card">
                  <div className="list-card-header">
                    <span>Interest {index + 1}</span>
                    <button className="btn-remove" onClick={() => removeListItem("interests", index)}>Remove</button>
                  </div>
                  <div className="field">
                    <label>Interest / Hobby</label>
                    <input
                      type="text"
                      value={item || ""}
                      onChange={(e) => {
                        const next = [...resume.interests];
                        next[index] = sanitizeRawText(e.target.value);
                        setResume((prev) => ({ ...prev, interests: next }));
                      }}
                      placeholder="Web Development, AI"
                    />
                    <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block" }}>Keep it professional.</small>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {activeSection === "Customization" && (
            <Section title="Customization" subtitle="Templates • Fonts • Decoratives">
              <h3 className="decoratives-heading" style={{ marginTop: 0 }}>Templates</h3>
              {/* Free users only see Classic. Everything else is Pro. */}
              <TemplateGroup title="Free template" templates={FREE_TEMPLATES} current={resume.template} onChoose={chooseTemplate} />

              {isFreePlan ? (
                <div className="template-locked-notice">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <p>12 Pro templates unlock with a Pro subscription.</p>
                  <Link to="/pricing" className="btn-create" style={{ display: 'inline-block', padding: '0.6rem 1rem', textDecoration: 'none' }}>Upgrade to Pro →</Link>
                </div>
              ) : (
                <TemplateGroup title="Pro templates" templates={PREMIUM_TEMPLATES} current={resume.template} locked={false} onChoose={chooseTemplate} />
              )}

              {/* Font picker — Pro only */}
              {isFreePlan ? (
                <div className="template-locked-notice" style={{ marginTop: '1.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                  </svg>
                  <p>Font customization is a Pro feature.</p>
                </div>
              ) : (
                <div className="decoratives-section">
                  <h3 className="decoratives-heading">Font <span className="pro-badge">Pro</span></h3>
                  <p className="editor-note" style={{ marginBottom: '0.85rem' }}>Overrides the template default. Applies to the whole resume.</p>
                  <div className="font-picker-grid">
                    {FONT_OPTIONS.map((font) => {
                      // Lazy-load this font so user can preview it
                      if (font.url) {
                        const existing = document.querySelector(`link[data-font-pick="${font.id}"]`);
                        if (!existing) {
                          const link = document.createElement('link');
                          link.rel = 'stylesheet';
                          link.href = font.url;
                          link.setAttribute('data-font-pick', font.id);
                          document.head.appendChild(link);
                        }
                      }
                      const isActive = (resume.fontPairing || 'inter') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          className={`font-chip ${isActive ? 'active' : ''}`}
                          style={{ fontFamily: font.heading }}
                          onClick={() => setResume((prev) => ({ ...prev, fontPairing: font.id }))}
                        >
                          {font.label}
                        </button>
                      );
                    })}
                  </div>
                  </div>

              )}

              {/* Decoratives — Pro only */}
              {!isFreePlan && (
                <div className="decoratives-section">
                  <h3 className="decoratives-heading">Decoratives <span className="pro-badge">Pro</span></h3>
                  <DecorativesPanel
                    decoratives={resume.decoratives || {}}
                    onChange={(dec) => setResume((prev) => ({ ...prev, decoratives: dec }))}
                    skillsMode={skillsMode}
                  />
                </div>
              )}
            </Section>
          )}

          {activeSection === "Section Layout" && (
            <Section title="Section Architecture & Layout">
              <div className="decoratives-section" style={{ marginTop: "0" }}>
                <h3 className="decoratives-heading">Add Additional Sections</h3>
                <p className="editor-note" style={{ marginBottom: "0.85rem" }}>
                  Select additional sections to add to your resume. Enabled sections will appear in the sidebar for editing and layout configuration.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                  {allPossibleOptionalIds.map(secId => {
                    const isVisible = visibility[secId] === true;
                    return (
                      <button
                        key={secId}
                        type="button"
                        className="btn-outline-sm"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: isVisible ? "rgba(184, 255, 44, 0.15)" : "transparent",
                          borderColor: isVisible ? "var(--accent-dark)" : "var(--line)",
                          color: "var(--ink)",
                          fontWeight: isVisible ? "600" : "400",
                          whiteSpace: "normal",
                          textAlign: "left",
                          gap: "8px",
                          height: "auto",
                          minHeight: "44px",
                          lineHeight: "1.25"
                        }}
                        onClick={() => handleSectionVisibilityToggle(secId, isVisible)}
                      >
                        <span style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>{getSectionLabel(secId)}</span>
                        <span style={{ fontSize: "0.8rem", color: isVisible ? "var(--accent-dark)" : "var(--muted)", flexShrink: 0 }}>{isVisible ? "✓ Enabled" : "+ Add"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="decoratives-section" style={{ marginTop: "1.5rem" }}>
                <h3 className="decoratives-heading">Section Visibility & Order</h3>
                <p className="editor-note" style={{ marginBottom: "0.85rem" }}>
                  Toggle visibility and arrange sections in your target recruiter-optimal layout.
                </p>
                <div className="section-order-list">
                  {sectionOrderList
                    .filter(secId => {
                      const isOptional = allPossibleOptionalIds.includes(secId);
                      return !isOptional || visibility[secId] === true;
                    })
                    .map((secId, idx, filteredArr) => {
                      const labelMap = {
                        summary: "Summary / Profile Info",
                        experience: "Work Experience",
                        education: "Education",
                        skills: "Skills",
                        projects: "Projects",
                        certifications: "Certifications",
                        languages: "Languages",
                        interests: "Interests",
                      };
                      const label = labelMap[secId] || getSectionLabel(secId);
                      const isVisible = visibility[secId] !== false;
                      
                      const handleMove = (direction) => {
                        const nextOrder = [...sectionOrderList];
                        const currentIndex = nextOrder.indexOf(secId);
                        
                        const targetSecId = filteredArr[idx + direction];
                        if (!targetSecId) return;
                        const targetIndex = nextOrder.indexOf(targetSecId);
                        
                        const temp = nextOrder[currentIndex];
                        nextOrder[currentIndex] = nextOrder[targetIndex];
                        nextOrder[targetIndex] = temp;
                        
                        setResume((prev) => ({
                          ...prev,
                          decoratives: {
                            ...prev.decoratives,
                            sectionOrder: nextOrder.join(",")
                          }
                        }));
                      };

                      return (
                        <div
                          key={secId}
                          className="section-order-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                            gap: "12px"
                          }}
                        >
                          <div
                            className="section-order-item-left"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flex: 1,
                              minWidth: 0
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => handleSectionVisibilityToggle(secId, isVisible)}
                              style={{ flexShrink: 0 }}
                            />
                            <span
                              style={{
                                opacity: isVisible ? 1 : 0.5,
                                fontWeight: isVisible ? "500" : "400",
                                wordBreak: "break-word",
                                lineHeight: "1.3"
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          <div
                            className="section-order-item-actions"
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexShrink: 0
                            }}
                          >
                            <button
                              type="button"
                              className="btn-order-arrow"
                              disabled={idx === 0}
                              onClick={() => handleMove(-1)}
                              style={{ padding: "4px 8px", cursor: idx === 0 ? "not-allowed" : "pointer" }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="btn-order-arrow"
                              disabled={idx === filteredArr.length - 1}
                              onClick={() => handleMove(1)}
                              style={{ padding: "4px 8px", cursor: idx === filteredArr.length - 1 ? "not-allowed" : "pointer" }}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Section>
          )}

          {activeSection === "ATS Refine" && (
            <Section title="ATS Optimization">
              {!isFreePlan ? (
                <div className="decoratives-section" id="ats-refine-section">
                  <p className="editor-note" style={{ marginBottom: "1.5rem" }}>
                    Analyze your resume against industry standards and get AI-powered suggestions to beat the bots.
                  </p>
                  <AiRefinePanel resumeId={id} onResult={(result) => setSavedAtsReport(result)} />
                </div>
              ) : (
                <div className="template-locked-notice">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  <p>ATS Resume Analysis is a Pro feature. Upgrade to optimize your resume.</p>
                  <Link to="/pricing" className="btn-create" style={{ display: 'inline-block', padding: '0.6rem 1rem', textDecoration: 'none' }}>Upgrade to Pro →</Link>
                </div>
              )}
            </Section>
          )}

          {/* Custom Optional Sections Editor (Issue 6) */}
          {optionalSectionEntry && (
            <Section
              title={getSectionLabel(optionalSectionEntry)}
              onAdd={() => {
                const currentList = resume.customSections?.[optionalSectionEntry] || [];
                const newItemTemplate = optionalSectionEntry === "publications"
                  ? { title: "", subtitle: "", date: "", authors: "", abstract: "", paperUrl: "" }
                  : optionalSectionEntry === "technicalProfiles"
                    ? { title: "", date: "", description: "" }
                    : { title: "", subtitle: "", date: "", description: "" };
                const nextList = [...currentList, newItemTemplate];
                setResume(prev => ({
                  ...prev,
                  customSections: {
                    ...(prev.customSections || {}),
                    [optionalSectionEntry]: nextList
                  }
                }));
              }}
            >
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id={`bullets-toggle-${optionalSectionEntry}`}
                  checked={
                    (() => {
                      try {
                        const config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                        return config[optionalSectionEntry] !== false;
                      } catch (e) {
                        return true;
                      }
                    })()
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let config = {};
                    try {
                      config = JSON.parse(resume.decoratives?.sectionBullets || "{}");
                    } catch (err) {}
                    config[optionalSectionEntry] = isChecked;
                    setResume(prev => ({
                      ...prev,
                      decoratives: {
                        ...(prev.decoratives || {}),
                        sectionBullets: JSON.stringify(config)
                      }
                    }));
                  }}
                />
                <label htmlFor={`bullets-toggle-${optionalSectionEntry}`} style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Show bullet points for this section
                </label>
              </div>
              {((resume.customSections?.[optionalSectionEntry]) || []).map((item, index) => (
                <ListCard
                  key={index}
                  title={item.title || `${getSectionLabel(optionalSectionEntry)} Item ${index + 1}`}
                  onRemove={() => {
                    const currentList = resume.customSections?.[optionalSectionEntry] || [];
                    const nextList = currentList.filter((_, i) => i !== index);
                    setResume(prev => ({
                      ...prev,
                      customSections: {
                        ...(prev.customSections || {}),
                        [optionalSectionEntry]: nextList
                      }
                    }));
                  }}
                >
                  {(() => {
                    const titleProps = getSectionFieldProps(optionalSectionEntry, "title");
                    const subtitleProps = getSectionFieldProps(optionalSectionEntry, "subtitle");
                    const dateProps = getSectionFieldProps(optionalSectionEntry, "date");
                    
                    if (optionalSectionEntry === "publications") {
                      const authorsProps = getSectionFieldProps("publications", "authors");
                      const abstractProps = getSectionFieldProps("publications", "abstract");
                      const paperUrlProps = getSectionFieldProps("publications", "paperUrl");
                      return (
                        <>
                          <Field
                            label={titleProps.label}
                            value={item.title}
                            placeholder={titleProps.placeholder}
                            hint={titleProps.hint}
                            sanitize={getSanitizer(titleProps.sanitizeType)}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], title: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                          <Field
                            label={subtitleProps.label}
                            value={item.subtitle}
                            placeholder={subtitleProps.placeholder}
                            hint={subtitleProps.hint}
                            sanitize={getSanitizer(subtitleProps.sanitizeType)}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], subtitle: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                          <Field
                            label={dateProps.label}
                            value={item.date}
                            placeholder={dateProps.placeholder}
                            hint={dateProps.hint}
                            sanitize={getSanitizer(dateProps.sanitizeType)}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], date: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                          <Field
                            label={authorsProps.label}
                            value={item.authors}
                            placeholder={authorsProps.placeholder}
                            hint={authorsProps.hint}
                            sanitize={getSanitizer(authorsProps.sanitizeType)}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], authors: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                          <Field
                            label={abstractProps.label}
                            value={item.abstract}
                            placeholder={abstractProps.placeholder}
                            hint={abstractProps.hint}
                            sanitize={getSanitizer(abstractProps.sanitizeType)}
                            textarea
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], abstract: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                          <Field
                            label={paperUrlProps.label}
                            value={item.paperUrl}
                            placeholder={paperUrlProps.placeholder}
                            hint={paperUrlProps.hint}
                            sanitize={getSanitizer(paperUrlProps.sanitizeType)}
                            onBlur={(e) => {
                              const val = e.target.value;
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              let normalized = val.trim();
                              if (normalized && !/^https?:\/\//i.test(normalized)) {
                                normalized = "https://" + normalized;
                              }
                              currentList[index] = { ...currentList[index], paperUrl: normalized };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], paperUrl: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                        </>
                      );
                    }
                    
                    const descProps = getSectionFieldProps(optionalSectionEntry, "description");
                    
                    return (
                      <>
                        <Field
                          label={titleProps.label}
                          value={item.title}
                          placeholder={titleProps.placeholder}
                          hint={titleProps.hint}
                          sanitize={getSanitizer(titleProps.sanitizeType)}
                          onBlur={(e) => {
                            if (titleProps.sanitizeType === "url") {
                              const normalized = normalizeUrl("website", e.target.value);
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], title: normalized };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }
                          }}
                          onChange={(v) => {
                            const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                            currentList[index] = { ...currentList[index], title: v };
                            setResume(prev => ({
                              ...prev,
                              customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                            }));
                          }}
                        />
                        {optionalSectionEntry !== "technicalProfiles" && (
                          <Field
                            label={subtitleProps.label}
                            value={item.subtitle}
                            placeholder={subtitleProps.placeholder}
                            hint={subtitleProps.hint}
                            sanitize={getSanitizer(subtitleProps.sanitizeType)}
                            onBlur={(e) => {
                              if (subtitleProps.sanitizeType === "url") {
                                const normalized = normalizeUrl("website", e.target.value);
                                const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                                currentList[index] = { ...currentList[index], subtitle: normalized };
                                setResume(prev => ({
                                  ...prev,
                                  customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                                }));
                              }
                            }}
                            onChange={(v) => {
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], subtitle: v };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }}
                          />
                        )}
                        <Field
                          label={dateProps.label}
                          value={item.date}
                          placeholder={dateProps.placeholder}
                          hint={dateProps.hint}
                          sanitize={getSanitizer(dateProps.sanitizeType)}
                          onBlur={(e) => {
                            if (dateProps.sanitizeType === "url") {
                              const normalized = normalizeUrl("website", e.target.value);
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], date: normalized };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }
                          }}
                          onChange={(v) => {
                            const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                            currentList[index] = { ...currentList[index], date: v };
                            setResume(prev => ({
                              ...prev,
                              customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                            }));
                          }}
                        />
                        <Field
                          label={descProps.label}
                          value={item.description}
                          placeholder={descProps.placeholder}
                          hint={descProps.hint}
                          sanitize={getSanitizer(descProps.sanitizeType)}
                          textarea
                          onBlur={(e) => {
                            if (descProps.sanitizeType === "url") {
                              const normalized = normalizeUrl("website", e.target.value);
                              const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                              currentList[index] = { ...currentList[index], description: normalized };
                              setResume(prev => ({
                                ...prev,
                                customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                              }));
                            }
                          }}
                          onChange={(v) => {
                            const currentList = [...(resume.customSections?.[optionalSectionEntry] || [])];
                            currentList[index] = { ...currentList[index], description: v };
                            setResume(prev => ({
                              ...prev,
                              customSections: { ...(prev.customSections || {}), [optionalSectionEntry]: currentList }
                            }));
                          }}
                        />
                      </>
                    );
                  })()}
                </ListCard>
              ))}
            </Section>
          )}
        </main>

        <section className="editor-preview-panel" style={{ position: "relative" }}>
          <div className="mobile-preview-header">
            <h2>Resume Preview</h2>
          </div>
          <div className="preview-actions" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem" }}>
            <button onClick={downloadPDF} className="btn-save" disabled={downloadingPdf}>
              {downloadingPdf ? "Downloading..." : "Download PDF"}
            </button>
          </div>
          <ResumePreview resume={resume} isFreePlan={isFreePlan} />


          {/* ATS Floating Score Badge
               — "Saved ✓"  when savedAtsReport exists and no unsaved edits
               — "Preview"  while editing (unsaved changes) or no saved report yet
               Both states use scores computed by the same algorithm; the only
               difference is confirmed-by-backend vs live-in-browser. */}
          {(() => {
            // True when the badge should show the confirmed backend score.
            const showSaved = savedAtsReport && !hasUnsavedChanges;
            const atsReport = showSaved
              ? savedAtsReport
              : (localReport || { score: 0, issues: [] });
            const atsScore  = atsReport.score ?? atsReport.atsScore ?? 0;
            const scoreClass = atsScore >= 85 ? "good" : atsScore >= 60 ? "warn" : "poor";

            return atsBadgeVisible ? (
              <>
                {/* Draggable wrapper */}
                <div
                  ref={atsBadgeDragRef}
                  className="ats-score-badge-floating-wrap"
                  style={{ top: atsBadgePos.top, left: atsBadgePos.left, right: "auto", bottom: "auto" }}
                  onPointerDown={(e) => {
                    if (e.target?.closest(".ats-badge-remove-btn")) return;
                    if (e.button !== 0) return;
                    const wrapper = atsBadgeDragRef.current;
                    const parent = wrapper?.offsetParent;
                    if (!wrapper || !parent) return;
                    atsBadgePointerRef.current = {
                      active: true,
                      moved: false,
                      startX: e.clientX,
                      startY: e.clientY,
                      originLeft: atsBadgePos.left,
                      originTop: atsBadgePos.top,
                    };
                    wrapper.setPointerCapture?.(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const wrapper = atsBadgeDragRef.current;
                    const parent = wrapper?.offsetParent;
                    const state = atsBadgePointerRef.current;
                    if (!state.active || !parent) return;
                    const pRect = parent.getBoundingClientRect();
                    const badgeW = wrapper?.offsetWidth || 68;
                    const badgeH = wrapper?.offsetHeight || 68;
                    const deltaX = e.clientX - state.startX;
                    const deltaY = e.clientY - state.startY;
                    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) state.moved = true;
                    const nextLeft = state.originLeft + deltaX;
                    const nextTop = state.originTop + deltaY;
                    const maxLeft = Math.max(0, pRect.width - badgeW);
                    const maxTop = Math.max(0, pRect.height - badgeH);
                    setAtsBadgePos({
                      left: Math.max(0, Math.min(maxLeft, nextLeft)),
                      top: Math.max(0, Math.min(maxTop, nextTop)),
                    });
                  }}
                  onPointerUp={(e) => {
                    atsBadgePointerRef.current.active = false;
                    atsBadgeDragRef.current?.releasePointerCapture?.(e.pointerId);
                  }}
                  onPointerCancel={(e) => {
                    atsBadgePointerRef.current.active = false;
                    atsBadgeDragRef.current?.releasePointerCapture?.(e.pointerId);
                  }}
                >
                  <button
                    type="button"
                    className={`ats-score-badge-floating ats-score-${scoreClass}`}
                    onClick={() => {
                      if (atsBadgePointerRef.current.moved) {
                        atsBadgePointerRef.current.moved = false;
                        return;
                      }
                      setShowAtsPanel(prev => !prev);
                    }}
                    title="Click to view ATS Score details. Drag to move."
                  >
                    <div className="ats-score-badge-circle">
                      <span className="ats-score-badge-val">{atsScore}</span>
                      <span className="ats-score-badge-lbl" style={{ fontSize: "0.52rem", letterSpacing: "0.02em" }}>
                        {showSaved ? "Saved ✓" : "Preview"}
                      </span>
                    </div>
                  </button>
                  {/* Remove button */}
                  <button
                    type="button"
                    className="ats-badge-remove-btn"
                    title="Hide ATS badge"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      atsBadgePointerRef.current.active = false;
                      atsBadgeDragRef.current?.releasePointerCapture?.(e.pointerId);
                    }}
                    onClick={(e) => { e.stopPropagation(); setAtsBadgeVisible(false); setShowAtsPanel(false); }}
                  >
                    x
                  </button>
                </div>

                {/* Sliding Glassmorphic Panel */}
                {showAtsPanel && (
                  <div className="ats-heatmap-panel glassmorphic-panel">
                    <div className="ats-heatmap-header">
                      <h3>ATS Score Diagnostics</h3>
                      <button type="button" className="btn-close-ats" onClick={() => setShowAtsPanel(false)}>x</button>
                    </div>
                    <div className="ats-heatmap-body">
                      <div className="ats-heatmap-score-row">
                        <span className="ats-heatmap-large-score">{atsScore}%</span>
                        <div>
                          <p style={{ margin: 0 }}>ATS Match Score</p>
                          {atsReport.overallFeedback && (
                            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>{atsReport.overallFeedback}</p>
                          )}
                          {atsReport.category && (
                            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--accent)" }}>Role: {atsReport.category}</p>
                          )}
                        </div>
                      </div>
                      {isFreePlan ? (
                        <div className="template-locked-notice" style={{ marginTop: "1rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(232, 230, 220, 0.15)" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="6"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                          </svg>
                          <p style={{ fontWeight: "600", color: "var(--ink)", margin: "0.25rem 0" }}>Detailed Diagnostics Locked</p>
                          <p style={{ fontSize: "0.82rem", margin: "0 0 1rem", color: "var(--muted)" }}>
                            Upgrade to Pro to unlock keyword recommendations, metric analysis, and formatting suggestions.
                          </p>
                          <Link to="/pricing" className="btn-create" style={{ display: 'inline-block', padding: '0.6rem 1rem', textDecoration: 'none', fontSize: "0.85rem" }}>
                            Upgrade to Pro →
                          </Link>
                        </div>
                      ) : (
                        <div className="ats-heatmap-issues-list">
                          {atsReport.issues.map((issue, idx) => (
                            <div key={idx} className={`ats-issue-item ats-issue-${issue.severity}`}>
                              <div className="ats-issue-header">
                                <span className={`ats-issue-badge ${issue.severity}`}>
                              {issue.severity === "error" ? "Error" : issue.severity === "warning" ? "Warning" : "Tip"}
                                </span>
                                {issue.points > 0 && <span className="ats-issue-points">-{issue.points} pts</span>}
                                <span className="ats-issue-section">{issue.section}</span>
                              </div>
                              <p className="ats-issue-text">{issue.suggestion}</p>
                              {issue.original && issue.original.trim() && (
                                <p className="ats-issue-original">"{issue.original}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Re-show badge button when hidden */
              <button
                type="button"
                className="ats-badge-restore-btn"
                title="Show ATS Score Badge"
                onClick={() => setAtsBadgeVisible(true)}
              >
                ATS
              </button>
            );
          })()}
        </section>
      </div>

      {showEmailModal && (
        <EmailModal
          resumeTitle={resume.title}
          getPDFBlob={getPDFBlob}
          onClose={() => setShowEmailModal(false)}
        />
      )}

    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({ title, subtitle, children, onAdd }) => {
  const containerRef = useRef(null);
  const prevCountRef = useRef(0);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!onAdd || !containerRef.current) return;

    const cards = containerRef.current.querySelectorAll(".list-card");
    const currentCount = cards.length;

    if (hasMountedRef.current) {
      if (currentCount > prevCountRef.current) {
        const lastCard = cards[cards.length - 1];
        if (lastCard) {
          lastCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setTimeout(() => {
            const firstInput = lastCard.querySelector("input, textarea, select");
            if (firstInput) {
              firstInput.focus();
            }
          }, 100);
        }
      }
    } else {
      hasMountedRef.current = true;
    }

    prevCountRef.current = currentCount;
  });

  return (
    <section className="editor-section" ref={containerRef}>
      <div className="section-header" style={subtitle ? { flexDirection: "column", alignItems: "flex-start" } : {}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h2>{title}</h2>
          {onAdd && <button className="btn-add" onClick={onAdd}>Add</button>}
        </div>
        {subtitle && <small className="section-subtitle" style={{ color: "var(--accent)", marginTop: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>{subtitle}</small>}
      </div>
      {children}
      {onAdd && (
        <button 
          className="btn-add-bottom" 
          onClick={onAdd}
          type="button"
        >
          + Add {title}
        </button>
      )}
    </section>
  );
};

const Field = ({ label, value, onChange, onBlur, textarea, sanitize, inputMode, maxLength, placeholder, hint, className }) => {
  const handleChange = (nextValue) => {
    onChange(sanitize ? sanitize(nextValue) : nextValue);
  };

  const handleBlur = (e) => {
    if (sanitize && (sanitize === sanitizeName || sanitize === sanitizeRole)) {
      if (isNumericPattern(e.target.value)) {
        onChange("");
      }
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className={`field ${className || ""}`}>
      <div className="field-label-row">
        <label>{label}</label>
      </div>
      {textarea ? (
        <textarea value={value || ""} onChange={(e) => handleChange(e.target.value)} onBlur={handleBlur} rows={4} maxLength={maxLength} placeholder={placeholder} />
      ) : (
        <input type="text" value={value || ""} onChange={(e) => handleChange(e.target.value)} onBlur={handleBlur} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} />
      )}
      {hint && <small className="field-hint" style={{ marginTop: "0.25rem", color: "var(--muted)", display: "block" }}>{hint}</small>}
    </div>
  );
};

const RangeField = ({ label, value = 0, onChange }) => (
  <div className="field">
    <label>{label}: {value || 0}%</label>
    <input type="range" min={0} max={100} value={value || 0} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
);

const ListCard = ({ title, children, onRemove }) => (
  <div className="list-card">
    <div className="list-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <span style={{ fontWeight: 720, flex: 1, minWidth: 0, wordBreak: "break-word", lineHeight: "1.3" }}>{title}</span>
      <button className="btn-remove" onClick={onRemove} style={{ flexShrink: 0 }}>Remove</button>
    </div>
    {children}
  </div>
);

const TemplateGroup = ({ title, templates, current, locked = false, onChoose }) => (
  <div className="template-group">
    <h3>{title}</h3>
    <div className="editor-template-grid">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className={`editor-template ${current === template.id ? "selected" : ""} ${locked ? "locked" : ""}`}
          disabled={locked}
          onClick={() => onChoose(template.id, locked)}
          title={locked ? "Upgrade to Pro to unlock" : template.name}
        >
          <span className={`editor-template-art art-${template.id}`}>
            <i /><i /><i />
          </span>
          <strong>{template.name}</strong>
          {locked && <small className="template-lock-badge">Pro</small>}
        </button>
      ))}
    </div>
  </div>
);

// ─── Email Modal ──────────────────────────────────────────────────────────────

const EmailModal = ({ resumeTitle, getPDFBlob, onClose }) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState(`Resume – ${resumeTitle || "Application"}`);
  const [message, setMessage] = useState("Please find my resume attached.\n\nBest regards");
  const [status, setStatus] = useState("idle"); // idle | generating | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;
    setStatus("generating");
    setErrorMsg("");

    try {
      const blob = await getPDFBlob();
      const file = new File([blob], `${resumeTitle || "resume"}.pdf`, { type: "application/pdf" });
      setStatus("sending");
      await sendResumeByEmail({ recipientEmail, subject, message, pdfFile: file });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to send. Please try again.");
      setStatus("error");
    }
  };

  const btnLabel = {
    idle: "Send resume",
    generating: "Generating PDF…",
    sending: "Sending…",
    success: "Sent ✓",
    error: "Retry",
  }[status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <p>Share via email</p>
          <h2>Send your resume as a PDF</h2>
        </div>
        {status === "success" ? (
          <div className="email-success">
            <p>Resume sent to <strong>{recipientEmail}</strong>.</p>
            <button className="btn-create" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="email-form">
            <div className="field">
              <label>Recipient email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recruiter@company.com"
                autoFocus
              />
            </div>
            <div className="field">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            {errorMsg && <p className="field-error">{errorMsg}</p>}
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
              <button type="submit" className="btn-create" disabled={status === "generating" || status === "sending"}>
                {btnLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;


