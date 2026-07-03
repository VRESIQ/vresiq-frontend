import fs from "fs";
import path from "path";

console.log("[JS Test Data Generator] Generating 30 test resumes...");

const resumes = [];

// Helper to create basic template
const baseResume = (title, designation, summary, email, plan = "basic") => ({
  title,
  template: "template1",
  profileInfo: {
    fullName: "Test Candidate",
    designation,
    summary
  },
  contactInfo: {
    email,
    phone: "+1 555-9999",
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

// 1. First-year Student
const r1 = baseResume("First-year Student", "First-year CS Student", "First-year computer science student interested in learning Java and web development.", "student1@test.edu");
r1.education.push({ degree: "B.S. in Computer Science", institution: "Stanford University", startDate: "Sep 2025", endDate: "Present" });
r1.skills.push({ name: "Python", progress: 60 });
r1.projects.push({ title: "Calculater App", description: "Built simple python calculator app.", github: "https://github.com/test/calc" });
resumes.push(r1);

// 2. Final-year Student
const r2 = baseResume("Final-year Student", "Final-year Student", "Final-year engineering student with projects in database optimization.", "student2@test.edu");
r2.education.push({ degree: "B.S. in Software Engineering", institution: "MIT", startDate: "Sep 2022", endDate: "Jun 2026" });
r2.skills.push({ name: "Java", progress: 80 }, { name: "SQL", progress: 75 });
resumes.push(r2);

// 3. Master's Student
const r3 = baseResume("Master's Student", "Graduate CS Student", "Master's student in Computer Science focusing on distributed systems.", "student3@test.edu");
r3.education.push({ degree: "M.S. in Computer Science", institution: "UCLA", startDate: "Sep 2024", endDate: "Jun 2026" });
r3.skills.push({ name: "C++", progress: 85 }, { name: "Go", progress: 75 });
resumes.push(r3);

// 4. Fresher Software Engineer
const r4 = baseResume("Fresher Software Engineer", "Fresher Software Engineer", "Recent graduate eager to work on building scalable applications and REST APIs.", "fresher1@test.com");
r4.education.push({ degree: "B.S. in Computer Science", institution: "UCSC", startDate: "Sep 2021", endDate: "May 2025" });
r4.skills.push({ name: "Java", progress: 80 }, { name: "Python", progress: 75 }, { name: "SQL", progress: 70 }, { name: "Git", progress: 85 }, { name: "Docker", progress: 60 });
r4.projects.push({ title: "Task Manager REST API", description: "Designed REST API using Spring Boot with JWT authentication.", github: "https://github.com/test/task" });
resumes.push(r4);

// 5. Fresher QA Engineer
const r5 = baseResume("Fresher QA Engineer", "QA Engineer Intern", "Detail-oriented junior QA engineer focused on automation testing and manual verification.", "fresher2@test.com");
r5.education.push({ degree: "B.S. in Software Engineering", institution: "SJSU", startDate: "Sep 2021", endDate: "May 2025" });
r5.skills.push({ name: "automation testing", progress: 75 }, { name: "Selenium", progress: 70 }, { name: "Jira", progress: 80 });
resumes.push(r5);

// 6. Backend Intern
const r6 = baseResume("Backend Intern", "Backend Developer Intern", "Undergraduate student looking for a backend development internship.", "intern1@test.com");
r6.education.push({ degree: "B.S. in CS", institution: "Caltech", startDate: "Sep 2023", endDate: "Present" });
r6.skills.push({ name: "Node.js", progress: 80 }, { name: "Express.js", progress: 75 });
resumes.push(r6);

// 7. Product Intern
const r7 = baseResume("Product Intern", "Associate Product Manager Intern", "Eager PM intern focused on product roadmaps and user research.", "intern2@test.com");
r7.education.push({ degree: "B.A. in Economics", institution: "Berkeley", startDate: "Sep 2022", endDate: "Present" });
r7.skills.push({ name: "product roadmap", progress: 70 }, { name: "Agile", progress: 65 });
resumes.push(r7);

// 8. Freelance Web Developer
const r8 = baseResume("Freelance Web Developer", "Freelance Web Developer", "Self-employed web developer building custom applications for small clients.", "free1@test.com");
r8.workExperience.push({ company: "Freelance", role: "Web Developer", startDate: "Jun 2022", endDate: "Present", description: "Built customized React websites. Automated content delivery. Improved response times by 30%." });
r8.skills.push({ name: "React", progress: 90 }, { name: "JavaScript", progress: 95 }, { name: "HTML", progress: 95 }, { name: "CSS", progress: 90 });
resumes.push(r8);

// 9. Freelance Content Writer
const r9 = baseResume("Freelance Content Writer", "Freelance Content Writer", "Non-technical writer creating engaging tech documentation.", "free2@test.com");
r9.workExperience.push({ company: "Self-Employed", role: "Content Writer", startDate: "Jan 2021", endDate: "Present", description: "Wrote technical blogs, SEO content, and marketing copies." });
r9.skills.push({ name: "SEO", progress: 85 });
resumes.push(r9);

// 10. Junior Backend Developer
const r10 = baseResume("Junior Backend Developer", "Junior Backend Developer", "Junior backend developer building server APIs and databases.", "jr1@test.com");
r10.workExperience.push({ company: "Startup Inc", role: "Junior Developer", startDate: "Jun 2024", endDate: "Present", description: "Maintained REST APIs using Express.js and MongoDB. Automated database backups." });
r10.skills.push({ name: "Node.js", progress: 80 }, { name: "Express.js", progress: 80 }, { name: "MongoDB", progress: 75 });
resumes.push(r10);

// 11. Junior React Developer
const r11 = baseResume("Junior React Developer", "Junior React Developer", "Junior frontend engineer specializing in React and responsive design.", "jr2@test.com");
r11.workExperience.push({ company: "Pixel Studio", role: "Junior Frontend Developer", startDate: "Aug 2024", endDate: "Present", description: "Developed React interface components. Styled layouts using CSS. Integrated REST APIs." });
r11.skills.push({ name: "React", progress: 80 }, { name: "JavaScript", progress: 85 }, { name: "CSS", progress: 90 });
resumes.push(r11);

// 12. Mid-level Python Developer
const r12 = baseResume("Mid-level Python Developer", "Python Developer", "Python developer building data pipelines and backend applications.", "mid1@test.com");
r12.workExperience.push({ company: "DataFlow Corp", role: "Python Developer", startDate: "Mar 2022", endDate: "Present", description: "Designed ETL data pipelines using Python and pandas. Automated task scheduling. Reduced database load by 25%." });
r12.skills.push({ name: "Python", progress: 90 }, { name: "pandas", progress: 85 }, { name: "SQL", progress: 80 });
resumes.push(r12);

// 13. Mid-level Java Developer
const r13 = baseResume("Mid-level Java Developer", "Java Developer", "Java backend developer designing microservices with Spring Boot.", "mid2@test.com");
r13.workExperience.push({ company: "Enterprise Systems", role: "Java Developer", startDate: "Jan 2022", endDate: "Present", description: "Built microservices using Spring Boot and Hibernate. Designed SQL database schema. Managed server configurations." });
r13.skills.push({ name: "Java", progress: 90 }, { name: "Spring Boot", progress: 85 }, { name: "SQL", progress: 80 });
resumes.push(r13);

// 14. Senior Software Engineer
const r14 = baseResume("Senior Software Engineer", "Senior Software Engineer", "Senior engineer leading teams, designing systems, and building scalable cloud microservices.", "sr1@test.com");
r14.workExperience.push({ company: "MegaCorp", role: "Senior Software Engineer", startDate: "May 2018", endDate: "Present", description: "Architected Spring Boot microservices. Automated deployment using Docker. Coordinated code reviews and mentored junior devs." });
r14.skills.push({ name: "Java", progress: 95 }, { name: "Spring Boot", progress: 90 }, { name: "Microservices", progress: 90 }, { name: "System Design", progress: 85 });
resumes.push(r14);

// 15. Senior DevOps Engineer
const r15 = baseResume("Senior DevOps Engineer", "Senior DevOps Engineer", "Infrastructure specialist orchestrating Kubernetes clusters on AWS.", "sr2@test.com");
r15.workExperience.push({ company: "Cloud Dynamics", role: "Senior DevOps Engineer", startDate: "Jul 2019", endDate: "Present", description: "Automated AWS resources using Terraform. Managed Kubernetes clusters. Configured monitoring using Prometheus." });
r15.skills.push({ name: "Docker", progress: 95 }, { name: "Kubernetes", progress: 95 }, { name: "Terraform", progress: 90 }, { name: "AWS", progress: 95 });
resumes.push(r15);

// 16. Senior ML Engineer
const r16 = baseResume("Senior ML Engineer", "Senior ML Engineer", "ML engineer designing, training, and deploying deep learning models.", "sr3@test.com");
r16.workExperience.push({ company: "AI Research Lab", role: "Senior ML Engineer", startDate: "Aug 2020", endDate: "Present", description: "Trained transformer models using PyTorch. Deployed computer vision pipelines. Optimized inference latency by 45%." });
r16.skills.push({ name: "Python", progress: 95 }, { name: "PyTorch", progress: 95 }, { name: "machine learning", progress: 90 });
resumes.push(r16);

// 17. Career Switcher - Sales to CS
const r17 = baseResume("Career Switcher - Sales to CS", "Career Switcher", "Sales professional transitioning to customer support or junior software engineering.", "switch1@test.com");
r17.workExperience.push({ company: "Paper Corp", role: "Sales Rep", startDate: "Jan 2015", endDate: "Present", description: "Managed corporate clients, driving sales growth and maintaining relationships." });
r17.skills.push({ name: "Sales", progress: 90 });
resumes.push(r17);

// 18. Career Switcher - Teacher to Designer
const r18 = baseResume("Career Switcher - Teacher to Designer", "Career Switcher", "Educator transitioning to UI/UX design, bringing strong user-centric empathy.", "switch2@test.com");
r18.workExperience.push({ company: "City School", role: "Teacher", startDate: "Sep 2018", endDate: "Jun 2024", description: "Developed interactive curriculum. Taught graphics class to 100 students." });
r18.skills.push({ name: "Figma", progress: 75 }, { name: "UI", progress: 70 });
resumes.push(r18);

// 19. QA Engineer
const r19 = baseResume("QA Engineer", "QA Engineer", "Automated and manual tester implementing testing strategies.", "qa@test.com");
r19.workExperience.push({ company: "Software Tech", role: "QA Engineer", startDate: "Oct 2022", endDate: "Present", description: "Built Selenium automation suites. Conducted manual regression testing. Tracked issues in Jira." });
r19.skills.push({ name: "automation testing", progress: 90 }, { name: "Selenium", progress: 90 }, { name: "Jira", progress: 85 });
resumes.push(r19);

// 20. DevOps Engineer
const r20 = baseResume("DevOps Engineer", "DevOps Engineer", "Orchestrating CI/CD and managing cloud architectures.", "devops@test.com");
r20.workExperience.push({ company: "Global Systems", role: "DevOps Engineer", startDate: "Feb 2021", endDate: "Present", description: "Configured CI/CD via GitHub Actions. Maintained Docker containers. Automated server setups." });
r20.skills.push({ name: "Docker", progress: 90 }, { name: "CI/CD", progress: 90 }, { name: "AWS", progress: 85 });
resumes.push(r20);

// 21. Data Analyst
const r21 = baseResume("Data Analyst", "Data Analyst", "Analyzing large datasets and designing corporate dashboards.", "analyst@test.com");
r21.workExperience.push({ company: "Analytics Corp", role: "Data Analyst", startDate: "Nov 2022", endDate: "Present", description: "Wrote SQL queries. Created Tableau dashboards. Analyzed business KPIs." });
r21.skills.push({ name: "SQL", progress: 90 }, { name: "Tableau", progress: 85 }, { name: "Excel", progress: 90 });
resumes.push(r21);

// 22. Machine Learning Engineer
const r22 = baseResume("ML Engineer", "Machine Learning Engineer", "Developing machine learning and computer vision architectures.", "ml@test.com");
r22.workExperience.push({ company: "Vision Corp", role: "ML Engineer", startDate: "Mar 2023", endDate: "Present", description: "Built object detection networks using TensorFlow. Processed imagery datasets." });
r22.skills.push({ name: "Python", progress: 90 }, { name: "TensorFlow", progress: 85 }, { name: "machine learning", progress: 85 });
resumes.push(r22);

// 23. UI/UX Designer
const r23 = baseResume("UI/UX Designer", "UI/UX Designer", "Creating wireframes, conducting user testing, and maintaining design libraries.", "designer@test.com");
r23.workExperience.push({ company: "Design Agency", role: "Designer", startDate: "Apr 2022", endDate: "Present", description: "Designed user interfaces. Developed wireframes and interactive prototypes." });
r23.skills.push({ name: "Figma", progress: 95 }, { name: "UI", progress: 90 }, { name: "UX", progress: 90 });
resumes.push(r23);

// 24. Product Manager
const r24 = baseResume("Product Manager", "Product Manager", "Leading product roadmaps, aligning stakeholders, and writing user stories.", "pm@test.com");
r24.workExperience.push({ company: "Retail App", role: "Product Manager", startDate: "Jul 2021", endDate: "Present", description: "Wrote PRDs and roadmap schedules. Managed sprint backlogs in Jira." });
r24.skills.push({ name: "product roadmap", progress: 95 }, { name: "user stories", progress: 90 }, { name: "Agile", progress: 90 });
resumes.push(r24);

// 25. Customer Success Manager (Non-Technical)
const r25 = baseResume("Customer Success Manager", "Customer Success Manager", "Resolving customer support requests and improving customer retention metrics.", "success@test.com");
r25.workExperience.push({ company: "SaaS Inc", role: "Customer Success Manager", startDate: "Jun 2022", endDate: "Present", description: "Guided 50+ enterprise customer accounts. Automated customer onboarding. Reduced churn rate by 15%." });
r25.skills.push({ name: "CRM", progress: 85 }, { name: "customer support", progress: 90 });
resumes.push(r25);

// 26. Stress Test - Very Small
const r26 = {
  title: "Stress Test - Very Small",
  template: "template1",
  profileInfo: { fullName: "A" }, // Missing target title and summary
  contactInfo: { email: "a@a.com" }, // Minimal contact
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: []
};
resumes.push(r26);

// 27. Stress Test - Very Large
const r27 = baseResume("Stress Test - Very Large", "Senior Lead Software Architect", "Very large senior resume building microservices, frontend components, managing infrastructure, and databases.", "huge@test.com");
for (let i = 0; i < 15; i++) {
  r27.workExperience.push({ company: `Company ${i}`, role: `Software Architect ${i}`, startDate: "Jan 2010", endDate: "Dec 2012", description: `Built server code ${i}. Optimized database indexing. Managed developers.` });
  r27.skills.push({ name: `Skill ${i}`, progress: 80 });
  r27.projects.push({ title: `Project ${i}`, description: `Project summary detailed description ${i}.` });
  r27.certifications.push({ title: `Cert ${i}`, issuer: `Issuer ${i}`, year: "2015" });
  r27.languages.push({ name: `Language ${i}`, progress: 90 });
  r27.interests.push(`Interest ${i}`);
}
resumes.push(r27);

// 28. Stress Test - Unicode & Symbols
const r28 = baseResume("Stress Test - Unicode & Symbols", "Software Engineer 💻", "Experienced coder with emoji and unicode: 🚀 🔬 𠜎 🇨🇳. Built systems with latency < 50ms and revenue > $10M.", "unicode@test.com");
r28.workExperience.push({ company: "Unicode Corp", role: "Lead Dev 工程师", startDate: "Jan 2021", endDate: "Present", description: "Optimized database pipelines. latency was reduced by 50% for 10M+ users." });
r28.skills.push({ name: "C++", progress: 90 }, { name: "Java ☕", progress: 80 });
resumes.push(r28);

// 29. Stress Test - Invalid Dates & Order
const r29 = baseResume("Stress Test - Invalid Dates", "DevOps Engineer", "DevOps engineer with date edge cases.", "dates@test.com");
r29.workExperience.push({ company: "Bad Dates Inc", role: "Engineer", startDate: "Jan 2024", endDate: "Dec 2023", description: "Start date is after end date." });
r29.education.push({ degree: "B.S. CS", institution: "State Univ", startDate: "Invalid Month 2020", endDate: "Dec 2024" });
resumes.push(r29);

// 30. Stress Test - Duplicate Entries
const r30 = baseResume("Stress Test - Duplicate Entries", "Software Engineer", "React software engineer.", "dup@test.com");
r30.skills.push({ name: "React", progress: 80 }, { name: "React", progress: 90 }, { name: "REACT", progress: 70 });
r30.languages.push({ name: "English", progress: 90 }, { name: "english", progress: 80 });
r30.interests.push("Coding", "coding", "CODING");
resumes.push(r30);

// Write to resumes.json
const destPath = path.resolve("../resumes.json");
fs.writeFileSync(destPath, JSON.stringify(resumes, null, 2), "utf-8");
console.log(`[JS Test Data Generator] Success! Wrote 30 resumes to ${destPath}`);
