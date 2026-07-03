import fs from "fs";
import path from "path";

console.log("[JS Test Data Generator] Generating 100 test resumes...");

const resumes = [];

const baseResume = (title, designation, summary, email) => ({
  title,
  template: "template1",
  profileInfo: {
    fullName: "Test Candidate",
    designation,
    summary
  },
  contactInfo: {
    email,
    phone: "+1 555-0100",
    location: "San Francisco, CA"
  },
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: []
});

for (let i = 1; i <= 100; i++) {
  let title = `Test Persona ${i}`;
  let des = "";
  let sum = "";
  let email = `persona${i}@test.com`;

  // Determine stage and designation based on index blocks
  if (i <= 10) {
    // 1-10 Students
    const studentFields = ["CS", "Healthcare", "Finance", "Mechanical", "Civil", "Chemistry", "Electrical", "Biology", "Physics", "Math"];
    des = `${studentFields[(i - 1) % studentFields.length]} Student Candidate`;
    sum = "Motivated academic student looking to secure a summer internship to apply technical coursework.";
  } else if (i <= 20) {
    // 11-20 Freshers
    const fresherRoles = ["Software Engineer Graduate", "Associate Nurse", "Junior Accountant", "Graduate Marketer", "Mechanical Associate", "Civil Engineer Graduate", "Junior Clerk", "HR Assistant", "Sales Trainee", "Support Agent"];
    des = fresherRoles[(i - 11) % fresherRoles.length];
    sum = "Entry level professional seeking to leverage academic capstones and hands-on laboratory experience.";
  } else if (i <= 30) {
    // 21-30 Junior
    const juniorRoles = ["Junior Java Developer", "Junior QA Engineer", "Junior UI Designer", "Junior Business Analyst", "Marketing Coordinator", "Junior Systems Admin", "Junior Copywriter", "Junior Accountant", "Junior Support Specialist", "Junior Electrician"];
    des = juniorRoles[(i - 21) % juniorRoles.length];
    sum = "Junior specialist with 1-2 years of experience assisting in design, deployment, and testing workflows.";
  } else if (i <= 50) {
    // 31-50 Mid-Level
    const midRoles = ["Full Stack Developer", "Data Scientist", "Mechanical Engineer", "Civil Engineer", "Research Scientist", "Sales Executive", "Financial Analyst", "DevOps Engineer", "Automation Tester", "Technical Writer", "Android Developer", "Network Engineer", "Cyber Security Analyst", "UI/UX Designer", "Product Designer", "Business Analyst", "Marketing Manager", "Finance Manager", "HR Generalist", "Academic Researcher"];
    des = midRoles[(i - 31) % midRoles.length];
    sum = "Experienced professional delivering business value, technical solutions, and cross-functional project success.";
  } else if (i <= 65) {
    // 51-65 Senior / Lead / Manager
    const seniorRoles = ["Senior Software Engineer", "Lead Developer", "Engineering Manager", "Principal Architect", "Senior DevOps Engineer", "Lead QA Tester", "Senior Product Manager", "Marketing Director", "Finance Director", "Senior Mechanical Designer", "Lead Civil Inspector", "Clinical Director", "Government Director", "Principal Researcher", "Lead HR Business Partner"];
    des = seniorRoles[(i - 51) % seniorRoles.length];
    sum = "Orchestrating system architecture, leading cross-functional teams, managing budgets, and driving product scale.";
  } else if (i <= 80) {
    // 66-80 Career Switchers
    const switchers = ["Career Switcher - Sales to CS", "Career Switcher - Teacher to UX", "Career Switcher - Nurse to Tech", "Career Switcher - Accountant to PM", "Career Switcher - Retail to HR", "Career Switcher - Support to QA", "Career Switcher - Mechanical to Software", "Career Switcher - Chemist to Data Analyst", "Career Switcher - Clerk to Marketing", "Career Switcher - Designer to Developer", "Career Switcher - Sales to Marketing", "Career Switcher - HR to Recruiter", "Career Switcher - Finance to Business Analyst", "Career Switcher - Developer to Technical Writer", "Career Switcher - General"];
    des = switchers[(i - 66) % switchers.length];
    sum = "Adaptive professional transitioning domain experience towards strategic new career pathways.";
  } else if (i <= 90) {
    // 81-90 Sector-Specific
    const sectors = ["Registered Nurse (Healthcare)", "Investment Banker (Finance)", "HVAC Engineer (Mechanical)", "Policy Advisor (Government)", "Environmental Consultant (Civil)", "Lab Technician (Research)", "HR Compliance Officer (Government)", "Stock Broker (Finance)", "Aeronautical Engineer (Mechanical)", "Clinical Researcher (Healthcare)"];
    des = sectors[(i - 81) % sectors.length];
    sum = "Sector specialist managing compliance, technical guidelines, and industrial workflows.";
  } else {
    // 91-100 Edge Cases & Stress Tests
    const edgeCases = ["Empty Resume Case", "Huge Resume Case", "Unicode Heavy Spec 🚀", "Invalid Date Order Resume", "Duplicate Skills & Entries", "General Resume Target", "Unknown Designation", "Highly Bloated Profile", "Minimal Student Case", "Maximal Senior Profile"];
    des = edgeCases[(i - 91) % edgeCases.length];
    sum = "Edge case profile for testing layout validation, character encodings, and date orders.";
  }

  // Create Resume Object
  const r = baseResume(title, des, sum, email);

  // Set variable date formats
  const dateFormats = ["2023", "2027", "Jan 2024", "January 2024", "Expected 2027", "Present", "Current"];
  const dFormat = dateFormats[i % dateFormats.length];
  r.education.push({
    degree: "B.S. in Applied Science",
    institution: "Federal Institute",
    startDate: "Sep 2019",
    endDate: dFormat
  });

  // Assign base skills
  if (des.toLowerCase().includes("java")) {
    r.skills.push({ name: "Java", progress: 90 });
  } else if (des.toLowerCase().includes("react") || des.toLowerCase().includes("frontend")) {
    r.skills.push({ name: "React", progress: 90 });
  } else if (des.toLowerCase().includes("python") || des.toLowerCase().includes("machine learning") || des.toLowerCase().includes("ml")) {
    r.skills.push({ name: "Python", progress: 90 });
  } else {
    r.skills.push({ name: "SQL", progress: 80 });
  }

  // Fill experience or projects based on stage
  const isStudentOrFresher = i <= 20 || des.toLowerCase().includes("student") || des.toLowerCase().includes("intern") || des.toLowerCase().includes("fresher");
  if (isStudentOrFresher) {
    r.projects.push({
      title: "Academic Capstone Project",
      description: "Designed a localized application and integrated a database. Achieved 95% validation latency score."
    });
  } else {
    r.workExperience.push({
      company: "Enterprise Corp",
      role: des,
      startDate: "Feb 2020",
      endDate: "Dec 2023",
      description: "Designed core system components. Improved service delivery times by 30% and managed deployments."
    });
  }

  // Inject stress-test attributes for specific indices
  if (des.includes("Unicode")) {
    r.profileInfo.fullName = "工程师 🚀 🔬";
    r.profileInfo.summary = "Experienced developer with emoji support and non-Latin: 𠜎 🇨🇳. latency < 20ms.";
  }
  if (des.includes("Invalid Date")) {
    r.workExperience.push({
      company: "Broken Timeline Corp",
      role: "Developer",
      startDate: "Jan 2024",
      endDate: "Dec 2023",
      description: "Project timeline test."
    });
  }
  if (des.includes("Duplicate Skills")) {
    r.skills.push({ name: "React", progress: 80 }, { name: "JS", progress: 80 }, { name: "JavaScript", progress: 90 });
  }
  if (des.includes("Huge Resume")) {
    for (let k = 0; k < 12; k++) {
      r.workExperience.push({ company: `Company ${k}`, role: `Engineer ${k}`, startDate: "2010", endDate: "2012", description: `Did coding ${k}` });
      r.skills.push({ name: `SkillName ${k}`, progress: 80 });
    }
  }

  resumes.push(r);
}

const destPath = path.resolve("../resumes.json");
fs.writeFileSync(destPath, JSON.stringify(resumes, null, 2), "utf-8");
console.log(`[JS Test Data Generator] Success! Wrote 100 resumes to ${destPath}`);
