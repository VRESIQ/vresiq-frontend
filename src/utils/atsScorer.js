/**
 * ATS Refine Engine - Redesigned Recruiter Review Scorer
 * 
 * Purpose: Evaluates resumes across 9 professional dimensions using role-aware,
 *          stage-aware, and recruiter-focused intelligence.
 * Used By: ResumeEditor.jsx, Dashboard.jsx
 */

// Role intelligence keyword database
export const ROLE_INTELLIGENCE = {
  "software engineer": {
    required: ["Java", "Python", "JavaScript", "Git", "SQL"],
    recommended: ["Spring Boot", "TypeScript", "REST API", "Docker", "CI/CD"],
    optional: ["Kubernetes", "AWS", "System Design", "Microservices", "NoSQL"]
  },
  "backend developer": {
    required: ["Java", "SQL", "Git", "OOP", "REST API"],
    recommended: ["Spring Boot", "Hibernate", "Node.js", "Docker", "JUnit"],
    optional: ["Microservices", "Kafka", "Redis", "Kubernetes", "AWS"]
  },
  "frontend developer": {
    required: ["HTML", "CSS", "JavaScript", "React"],
    recommended: ["TypeScript", "Redux", "REST API", "Git", "Vite"],
    optional: ["Next.js", "Tailwind CSS", "Jest", "Figma", "Sass"]
  },
  "full stack developer": {
    required: ["JavaScript", "HTML", "CSS", "SQL", "Git"],
    recommended: ["React", "Node.js", "REST API", "TypeScript", "Docker"],
    optional: ["Next.js", "AWS", "GraphQL", "NoSQL", "CI/CD"]
  },
  "data analyst": {
    required: ["Excel", "SQL", "Python"],
    recommended: ["Power BI", "Tableau", "Pandas", "ETL", "Statistics"],
    optional: ["Machine Learning", "Azure", "R", "data warehousing", "KPIs"]
  },
  "data scientist": {
    required: ["Python", "SQL", "Statistics", "Machine Learning"],
    recommended: ["pandas", "scikit-learn", "TensorFlow", "PyTorch", "model evaluation"],
    optional: ["NLP", "Deep Learning", "Spark", "data preparation", "R"]
  },
  "ml engineer": {
    required: ["Python", "Machine Learning", "Mathematics", "Git"],
    recommended: ["PyTorch", "TensorFlow", "scikit-learn", "Docker", "Model Deployment"],
    optional: ["Deep Learning", "NLP", "Kubeflow", "MLOps", "AWS"]
  },
  "designer": {
    required: ["Figma", "UI", "UX", "wireframes"],
    recommended: ["prototypes", "user research", "usability testing", "design systems"],
    optional: ["Adobe Illustrator", "Sketch", "HTML", "CSS", "responsive design"]
  },
  "devops engineer": {
    required: ["Linux", "Git", "Docker", "CI/CD"],
    recommended: ["Kubernetes", "AWS", "Terraform", "Ansible", "bash scripting"],
    optional: ["GCP", "Azure", "Prometheus", "Grafana", "Jenkins", "SRE"]
  },
  "product manager": {
    required: ["product roadmap", "user stories", "Agile", "prioritization"],
    recommended: ["Scrum", "KPIs", "PRD", "market research", "Jira"],
    optional: ["Confluence", "A/B testing", "GTM strategy", "analytics"]
  }
};

// Generic Fallback Categories
export const CATEGORY_KEYWORDS = Object.fromEntries(
  Object.entries(ROLE_INTELLIGENCE).map(([role, data]) => [
    role,
    [...data.required, ...data.recommended]
  ])
);

// Date format regex checkers (ATS friendly variants)
const VALID_DATE_PATTERNS = [
  /^(19|20)\d{2}$/,                                                    // 2023
  /^(19|20)\d{2}\s*[\u2013\u2014-]\s*Present$/i,                        // 2023-Present
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}$/i, // Jan 2023, January 2023
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\s*[\u2013\u2014-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}$/i, // Aug 2023 - May 2027
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\s*[\u2013\u2014-]\s*Present$/i, // Aug 2023 - Present
  /^Expected\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\.?\s*(19|20)\d{2}$/i, // Expected 2027 or Expected May 2027
  /^Present$/i
];

const HAS_METRIC = /(\d+%|\$\s?\d+|\d+\s*x|\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(percent|x)\b|\d{2,}\s*(users|clients|customers|requests|orders|revenue|sales|million|thousand|percent|hours|ms|seconds|repos|features|bugs|projects|team members|people))/i;
const PASSIVE_VOICE_REGEX = /\b(was|were|been|is|are)\s+(responsible for|managed by|handled by|tasked with|assigned to|involved in|utilized|leveraged)\b/i;
const ACTION_VERBS = ["achieved", "automated", "built", "created", "delivered", "designed", "developed", "drove", "implemented", "improved", "increased", "launched", "led", "managed", "migrated", "optimized", "owned", "reduced", "shipped", "streamlined", "trained", "transformed"];

// Helper: Converts values to trimmed strings
const asText = (v) => {
  if (v && typeof v === "object") {
    return String(v.value !== undefined ? v.value : "").trim();
  }
  return String(v || "").trim();
};

const hasText = (v) => asText(v).length > 0;

// Helper: Matches text for standard verbs
const containsActionVerb = (text) => {
  const lower = text.toLowerCase();
  return ACTION_VERBS.some(verb => lower.includes(verb));
};

// 1. Career Stage Detector
const detectCareerStage = (resume) => {
  const exp = resume.workExperience || [];
  const edu = resume.education || [];
  
  const yearsOfExp = exp.reduce((acc, job) => {
    const start = parseYear(job.startDate);
    const end = job.endDate && job.endDate.toLowerCase() === "present" ? new Date().getFullYear() : parseYear(job.endDate);
    if (start && end && end >= start) {
      return acc + (end - start);
    }
    return acc;
  }, 0);

  const isCurrentlyStudent = edu.some(e => {
    const end = asText(e.endDate).toLowerCase();
    return end.includes("expected") || end.includes("present") || parseYear(e.endDate) >= new Date().getFullYear();
  });

  if (isCurrentlyStudent && yearsOfExp <= 1) return "Student";
  if (yearsOfExp === 0) return "Fresher";
  if (yearsOfExp <= 2) return "Junior";
  if (yearsOfExp <= 5) return "Mid-level";
  if (yearsOfExp <= 8) return "Senior";
  
  // Check for management indicators
  const rolesText = exp.map(j => asText(j.role).toLowerCase()).join(" ");
  if (rolesText.includes("lead") || rolesText.includes("principal")) return "Lead";
  if (rolesText.includes("manager") || rolesText.includes("director") || rolesText.includes("head")) return "Manager";
  
  return "Senior";
};

const parseYear = (dateStr) => {
  const text = asText(dateStr);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
};

// 2. Role Detector
export const detectCategory = (designation) => {
  if (!designation || !designation.trim()) return "software engineer";
  const lower = designation.toLowerCase();
  for (const category of Object.keys(ROLE_INTELLIGENCE)) {
    if (lower.includes(category)) return category;
  }
  // Loose matching on split terms
  for (const category of Object.keys(ROLE_INTELLIGENCE)) {
    const parts = category.split(" ");
    if (parts.every((p) => lower.includes(p))) return category;
  }
  return "software engineer"; // Default fallback
};

// Helper to validate dates
const isValidDate = (dateStr) => {
  const text = asText(dateStr).trim();
  if (!text) return false;
  return VALID_DATE_PATTERNS.some(pat => pat.test(text));
};

// Suggestion Builder following Phase 13 requirements
const buildSuggestion = ({ why, importance, how, example }) => {
  return `[${importance}] ${why} ${how} (Example: "${example}")`;
};

// Main Scorer Implementation
export const computeAtsReport = (resume = {}) => {
  const issues = [];
  const strengths = [];

  const profile = resume.profileInfo || {};
  const contact = resume.contactInfo || {};
  const experience = resume.workExperience || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];
  const certifications = resume.certifications || [];
  const languages = resume.languages || [];

  // Phase 1 & 2: Role and Stage Understanding
  const careerStage = detectCareerStage(resume);
  const targetRoleName = detectCategory(profile.designation);
  const roleIntel = ROLE_INTELLIGENCE[targetRoleName];
  const resumeText = JSON.stringify(resume).toLowerCase();

  // Scoring dimension metrics
  let atsCompatibility = 100;
  let recruiterReadability = 100;
  let roleMatch = 100;
  let contentStrength = 100;
  let technicalAlignment = 100;
  let impactMetrics = 100;
  let formatting = 100;
  let keywordCoverage = 100;
  let overallQuality = 100;

  // Track counts to avoid false positives
  const hasInternship = experience.some(j => asText(j.company).toLowerCase().includes("intern") || asText(j.role).toLowerCase().includes("intern"));
  const hasFreelance = experience.some(j => asText(j.company).toLowerCase().includes("freelance") || asText(j.role).toLowerCase().includes("freelance"));
  const hasProjects = projects.length > 0;

  // -- 1. PROFILE SECTION EVALUATION --
  if (!hasText(profile.fullName)) {
    atsCompatibility -= 15;
    issues.push({
      type: "missing_name",
      section: "Profile",
      original: "",
      severity: "error",
      points: 15,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "ATS and recruiters use your full name to create your candidate file.",
        importance: "Critical",
        how: "Add your full legal or professional name at the top of your resume.",
        example: "Jane Doe"
      })
    });
  } else {
    strengths.push("Contact profile name is clearly provided.");
  }

  if (!hasText(profile.designation)) {
    roleMatch -= 15;
    issues.push({
      type: "missing_designation",
      section: "Profile",
      original: "",
      severity: "error",
      points: 15,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "A targeted designation helps search algorithms and recruiters match your resume to specific job listings.",
        importance: "Critical",
        how: "State your target role directly under your name.",
        example: "Backend Java Developer"
      })
    });
  }

  // Summary evaluation
  const summaryText = asText(profile.summary);
  if (!hasText(summaryText)) {
    contentStrength -= 15;
    issues.push({
      type: "missing_summary",
      section: "Profile",
      original: "",
      severity: "warning",
      points: 15,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "A professional summary serves as your elevator pitch, framing your expertise immediately.",
        importance: "Major",
        how: "Add a 2-3 sentence summary detailing your target role, core stack, and value proposition.",
        example: "Detail-oriented Software Engineer with 3+ years of experience specializing in Java microservices and RESTful API development. Proven record of optimizing query latency by 15%."
      })
    });
  } else {
    if (summaryText.length < 80) {
      contentStrength -= 5;
      issues.push({
        type: "short_summary",
        section: "Profile",
        original: summaryText,
        severity: "warning",
        points: 5,
        confidence: "medium",
        suggestion: buildSuggestion({
          why: "Short summaries fail to present a comprehensive value proposition.",
          importance: "Minor",
          how: "Expand the summary to detail your specialization, tools, and a key achievement.",
          example: "Full Stack Developer with 2+ years of experience designing responsive React pages and scalable Node.js microservices."
        })
      });
    }
    if (!HAS_METRIC.test(summaryText)) {
      impactMetrics -= 8;
      issues.push({
        type: "summary_no_metric",
        section: "Profile",
        original: summaryText,
        severity: "warning",
        points: 8,
        confidence: "high",
        suggestion: buildSuggestion({
          why: "Recruiters favor summaries containing quantifiable results that back up your claims.",
          importance: "Major",
          how: "Integrate one metric indicating scale, latency improvement, or business outcome.",
          example: "Reduced page load time by 20% or mentored a team of 3 junior engineers."
        })
      });
    }
  }

  // -- 2. CONTACT INFO EVALUATION --
  if (!hasText(contact.email)) {
    atsCompatibility -= 15;
    issues.push({
      type: "missing_email",
      section: "Contact",
      original: "",
      severity: "error",
      points: 15,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "Your email is the primary identifier used by recruitment systems.",
        importance: "Critical",
        how: "Enter a professional email address.",
        example: "john.doe@email.com"
      })
    });
  }
  if (!hasText(contact.phone)) {
    atsCompatibility -= 10;
    issues.push({
      type: "missing_phone",
      section: "Contact",
      original: "",
      severity: "warning",
      points: 10,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "Recruiters require a valid telephone number for scheduling initial phone screens.",
        importance: "Major",
        how: "Add your contact number including the country code.",
        example: "+1-555-0199"
      })
    });
  }

  // -- 3. EXPERIENCE SECTION EVALUATION --
  // Section Intelligence check (equivalents)
  const hasAnyExperience = experience.length > 0 || hasInternship || hasFreelance;
  if (!hasAnyExperience) {
    // If user is a Student/Fresher, missing experience is only a Warning, otherwise an Error
    const ded = careerStage === "Student" || careerStage === "Fresher" ? 10 : 25;
    contentStrength -= ded;
    issues.push({
      type: "missing_experience",
      section: "Experience",
      original: "",
      severity: careerStage === "Student" ? "warning" : "error",
      points: ded,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "A professional history segment (internships, employment, or co-ops) validates your hands-on ability.",
        importance: careerStage === "Student" ? "Major" : "Critical",
        how: "Add your employment, internship, or freelance experience.",
        example: "Software Engineer Intern at Acme Corp."
      })
    });
  } else {
    strengths.push("Found valid professional experience or internship records.");
    experience.forEach((job, idx) => {
      const label = `Experience ${idx + 1} (${asText(job.company)})`;
      
      // Date verification
      if (!isValidDate(job.startDate) || !isValidDate(job.endDate)) {
        formatting -= 5;
        issues.push({
          type: "invalid_date_format",
          section: label,
          original: `${job.startDate} - ${job.endDate}`,
          severity: "warning",
          points: 5,
          confidence: "high",
          suggestion: buildSuggestion({
            why: "ATS parsing scripts extract standard date formats to compute your tenure.",
            importance: "Minor",
            how: "Use standard timelines like 'Month Year' or year-only configurations.",
            example: "Jan 2023 - Present"
          })
        });
      }

      // Quality evaluation
      const desc = asText(job.description);
      if (!hasText(desc)) {
        contentStrength -= 10;
        issues.push({
          type: "missing_description",
          section: label,
          original: "",
          severity: "error",
          points: 10,
          confidence: "high",
          suggestion: buildSuggestion({
            why: "Recruiters cannot gauge your contributions without specific task descriptions.",
            importance: "Critical",
            how: "Add 2-4 bullet points detailing your contributions, stack, and results.",
            example: "Designed and implemented microservices using Spring Boot."
          })
        });
      } else {
        if (!containsActionVerb(desc)) {
          contentStrength -= 5;
          issues.push({
            type: "missing_action_verb",
            section: label,
            original: desc.slice(0, 50) + "...",
            severity: "warning",
            points: 5,
            confidence: "medium",
            suggestion: buildSuggestion({
              why: "Sentences starting with weak fillers fail to convey initiative.",
              importance: "Minor",
              how: "Begin your descriptions with strong action-oriented verbs.",
              example: "Optimized, Refactored, Maintained, or Automated."
            })
          });
        }
        if (!HAS_METRIC.test(desc)) {
          impactMetrics -= 8;
          issues.push({
            type: "missing_experience_metric",
            section: label,
            original: desc.slice(0, 50) + "...",
            severity: "warning",
            points: 8,
            confidence: "high",
            suggestion: buildSuggestion({
              why: "An internship or job description is much stronger if you quantify one measurable achievement.",
              importance: "Major",
              how: "Add a percentage scale, latency speedup, or customer scope detail to at least one bullet.",
              example: "Reduced execution latency of SQL queries by 35%."
            })
          });
        }
      }
    });
  }

  // -- 4. EDUCATION SECTION EVALUATION --
  if (education.length === 0) {
    atsCompatibility -= 10;
    issues.push({
      type: "missing_education",
      section: "Education",
      original: "",
      severity: "warning",
      points: 10,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "Educational background validates academic qualifications.",
        importance: "Major",
        how: "Add your degree program, major, and graduation details.",
        example: "B.S. in Computer Science"
      })
    });
  } else {
    strengths.push("Education credentials listed clearly.");
  }

  // -- 5. PROJECTS SECTION EVALUATION --
  if (projects.length === 0 && (careerStage === "Student" || careerStage === "Fresher" || (experience.length <= 1 && (careerStage === "Junior" || careerStage === "Mid-level")))) {
    contentStrength -= 12;
    issues.push({
      type: "missing_projects",
      section: "Projects",
      original: "",
      severity: "warning",
      points: 12,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "For entry-level candidates, personal or academic projects represent critical evidence of coding competence.",
        importance: "Major",
        how: "Add 1-2 coding projects showing off your primary technical stack.",
        example: "E-Commerce REST API built with Node.js and MongoDB."
      })
    });
  } else {
    projects.forEach((proj, idx) => {
      const label = `Project ${idx + 1} (${asText(proj.title)})`;
      const desc = asText(proj.description);
      if (!hasText(desc)) {
        contentStrength -= 5;
        issues.push({
          type: "missing_project_description",
          section: label,
          original: "",
          severity: "warning",
          points: 5,
          confidence: "high",
          suggestion: buildSuggestion({
            why: "A project entry needs context explaining its implementation details.",
            importance: "Major",
            how: "Add a summary explaining the problem solved and the technologies utilized.",
            example: "Developed a distributed chat tool using React, WebSocket, and Redis."
          })
        });
      }
      
      // GitHub check: only recommend if missing
      const githubUrl = asText(proj.github || proj.liveDemo);
      if (!hasText(githubUrl)) {
        issues.push({
          type: "missing_project_link",
          section: label,
          original: "",
          severity: "tip",
          points: 0,
          confidence: "medium",
          suggestion: buildSuggestion({
            why: "Recruiters favor entries offering verifiable evidence like Git repositories or demo links.",
            importance: "Suggestion",
            how: "Add a repository URL to make your project work auditable.",
            example: "https://github.com/username/project"
          })
        });
      }
    });
  }

  // -- 6. SKILLS SECTION EVALUATION --
  if (skills.length === 0) {
    technicalAlignment -= 15;
    issues.push({
      type: "missing_skills",
      section: "Skills",
      original: "",
      severity: "error",
      points: 15,
      confidence: "high",
      suggestion: buildSuggestion({
        why: "ATS indexing filters match your technical core skills against job criteria.",
        importance: "Critical",
        how: "Add 8-12 hard skills matching your target profile.",
        example: "JavaScript, TypeScript, React, HTML, CSS"
      })
    });
  } else {
    strengths.push("Solid set of core skills added to the profile.");
  }

  // -- 7. ROLE SPECIFIC KEYWORD COGNITION --
  if (roleIntel) {
    let matchedRequired = 0;
    const missingRecommended = [];
    
    roleIntel.required.forEach(kw => {
      if (resumeText.includes(kw.toLowerCase())) {
        matchedRequired++;
      }
    });

    roleIntel.recommended.forEach(kw => {
      if (!resumeText.includes(kw.toLowerCase())) {
        missingRecommended.push(kw);
      }
    });

    const requiredCoverage = roleIntel.required.length > 0 ? (matchedRequired / roleIntel.required.length) : 1;
    keywordCoverage = Math.round(requiredCoverage * 100);

    // Context Aware keyword suggestions
    if (missingRecommended.length > 0) {
      const topRecs = missingRecommended.slice(0, 3);
      technicalAlignment -= 5;
      issues.push({
        type: "keyword_gap",
        section: "Technical Alignment",
        original: `Missing: ${topRecs.join(", ")}`,
        severity: "warning",
        points: 5,
        confidence: "high",
        suggestion: `[Major] For ${targetRoleName} roles, ${topRecs.join(" and ")} are commonly requested. If you have utilized them in your career or projects, consider mentioning them to improve keyword match.`
      });
    }
  }

  // Deduct points based on issues
  const totalDeductions = issues.reduce((acc, issue) => acc + (issue.points || 0), 0);
  overallQuality = Math.max(0, 100 - totalDeductions);

  // Overall score averages all 9 review dimensions
  const score = Math.round(
    (atsCompatibility +
      recruiterReadability +
      roleMatch +
      contentStrength +
      technicalAlignment +
      impactMetrics +
      formatting +
      keywordCoverage +
      overallQuality) /
      9
  );

  // Map severities to error/warning/tip for UI compatibility
  const finalIssues = issues.map(issue => {
    let uiSeverity = "tip";
    if (issue.severity === "error") {
      uiSeverity = "error";
    } else if (issue.severity === "warning") {
      uiSeverity = "warning";
    }
    return {
      ...issue,
      severity: uiSeverity
    };
  });

  // Strengths / Positive items
  strengths.forEach(str => {
    finalIssues.push({
      type: "strength",
      section: "Strengths",
      original: "",
      severity: "tip",
      points: 0,
      confidence: "high",
      suggestion: `[Strength] ${str}`
    });
  });

  const errorsCount = finalIssues.filter(i => i.severity === "error").length;
  const warningsCount = finalIssues.filter(i => i.severity === "warning").length;

  const overallFeedback = score >= 85
    ? "Excellent context-aware match! The resume exhibits clean formatting and solid technical metrics."
    : score >= 70
      ? `Good profile. Address the ${errorsCount} critical and ${warningsCount} major recruiter recommendations to optimize impact.`
      : "High ATS Risk. Strengthen metrics, action verbs, and matching tech keywords to align with industry expectations.";

  return {
    score,
    atsScore: score,
    issues: finalIssues,
    overallFeedback,
    category: targetRoleName
  };
};
