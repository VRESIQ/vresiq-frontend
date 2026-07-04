import fs from "fs";
import path from "path";

console.log("[JS 2000 Resumes Generator] Generating 2,000 highly diverse resumes...");

const resumes = [];

const baseResume = (title, designation, summary, email) => ({
  title,
  template: "template1",
  profileInfo: {
    fullName: "Stress Test Candidate",
    designation,
    summary
  },
  contactInfo: {
    email,
    phone: "+1 555-0100",
    location: "New York, NY"
  },
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: []
});

const roles = [
  "Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer",
  "Java Developer", "Python Developer", "C++ Developer", ".NET Developer", "Go Developer",
  "Rust Developer", "PHP Developer", "Node Developer", "React Developer", "Angular Developer",
  "Vue Developer", "Flutter Developer", "Android Developer", "iOS Developer", "Data Scientist",
  "Machine Learning Engineer", "AI Engineer", "Deep Learning Engineer", "Data Analyst",
  "Business Analyst", "BI Developer", "Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer",
  "Cybersecurity Analyst", "SOC Analyst", "Network Engineer", "System Administrator", "QA Engineer",
  "Automation Tester", "Embedded Engineer", "IoT Engineer", "Game Developer", "Blockchain Developer",
  "ERP Consultant", "SAP Consultant", "UI Designer", "UX Designer", "Product Designer",
  "Graphic Designer", "Technical Writer", "Research Engineer", "Mechanical Engineer", "Civil Engineer",
  "Electrical Engineer", "Electronics Engineer", "Registered Nurse", "Pharmacist", "Legal Advisor"
];

const experienceQualities = [
  // Weak descriptions
  "Worked on various tasks. Helped team members and assisted with documentation.",
  "Responsible for writing code and testing features. Worked on software products.",
  // Medium quality
  "Developed system components and built REST APIs using Node.js and SQL.",
  "Designed and automated workflows, improving efficiency and collaborating with team members.",
  // Strong quality (metrics and active verbs)
  "Designed and architected a multi-tier microservices backend using Spring Boot. Reduced API response latency by 35% and scaled database queries for 15,000 active users.",
  "Led development of a high-traffic React frontend, optimizing webpack builds and improving load times by 40% for over 50k customers."
];

const projectQualities = [
  "Built a basic project using HTML and CSS for final year submission.",
  "Developed a web app with React. Implemented features and hosted it on Render.",
  "Designed an Event-Driven microservices pipeline deployed on AWS. Integrated Docker and GitHub Actions, achieving 99.9% uptime."
];

const skillGroups = [
  ["Java", "Spring Boot", "SQL", "Git", "REST API", "Maven", "Hibernate"],
  ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Vite", "Figma"],
  ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn", "Machine Learning"],
  ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Ansible", "Linux"],
  ["SQL", "Python", "Excel", "Tableau", "Power BI", "Data Analysis"],
  ["Selenium", "Cypress", "QA", "Automation", "JUnit", "Postman"]
];

for (let i = 1; i <= 2000; i++) {
  const title = `Validation Persona ${i}`;
  const des = roles[i % roles.length];
  
  // High entropy summary text
  let sum = "Experienced specialist dedicated to optimization and scalable engineering.";
  if (i % 7 === 0) sum = ""; // Missing summary
  else if (i % 7 === 1) sum = "Fast learner and results-driven team player looking for synergy."; // Filler words
  else if (i % 7 === 2) sum = "Designed a cloud migration pipeline, reducing AWS infrastructure spend by 25% for 10k users."; // Metric
  
  const email = `persona${i}@stress-validation.com`;
  const r = baseResume(title, des, sum, email);
  
  // Assign templates with variations
  const templates = ["template1", "template2", "template3", "premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8", "premium9", "premium10"];
  r.template = templates[i % templates.length];
  
  // Add education unless modulo matches
  if (i % 11 !== 0) {
    r.education.push({
      degree: "B.S. in Computer Science",
      institution: "State University",
      startDate: "Sep 2018",
      endDate: i % 2 === 0 ? "Present" : "May 2022"
    });
  }
  
  // Add skills unless modulo matches
  if (i % 13 !== 0) {
    const group = skillGroups[i % skillGroups.length];
    group.forEach((skName, idx) => {
      r.skills.push({ name: skName, progress: 50 + (idx * 5) });
    });
    // Stress test: Duplicate skills
    if (i % 17 === 0) {
      r.skills.push({ name: group[0], progress: 80 });
    }
  }
  
  // Add work experience
  if (i % 5 !== 0) {
    const desc = experienceQualities[i % experienceQualities.length];
    r.workExperience.push({
      company: "InnovateTech Corp",
      role: des,
      startDate: "Jan 2020",
      endDate: i % 3 === 0 ? "present" : "Jan 2023",
      description: desc
    });
    // Add multiple roles for senior/experienced personas
    if (i % 10 === 0) {
      r.workExperience.push({
        company: "Legacy Systems Inc",
        role: "Associate Developer",
        startDate: "Jun 2017",
        endDate: "Dec 2019",
        description: "Assisted with feature rollout and codebase migration."
      });
    }
  }
  
  // Add projects
  if (i % 6 !== 0) {
    const pDesc = projectQualities[i % projectQualities.length];
    r.projects.push({
      title: `Project Platform ${i}`,
      description: pDesc,
      github: i % 2 === 0 ? "https://github.com/stress/proj" : ""
    });
  }

  // Add certifications
  if (i % 9 === 0) {
    r.certifications.push({
      title: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      year: "2022"
    });
  }

  resumes.push(r);
}

const destPath = path.resolve("../resumes.json");
fs.writeFileSync(destPath, JSON.stringify(resumes, null, 2), "utf-8");
console.log(`[JS 2000 Resumes Generator] Success! Wrote 2,000 resumes to ${destPath}`);
