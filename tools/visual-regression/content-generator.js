/**
 * Helper to generate different resume JSON contents for Visual Regression Audit
 */
export function getMockResumeForProfile(profileType) {
  const base = {
    _id: 'test-audit-id',
    title: `Audit - Profile ${profileType}`,
    decoratives: {
      useCustomAccent: 'false',
      accentColor: '#111410',
      dividerStyle: 'line',
      headerStyle: 'minimal',
      photoShape: 'circle',
      progressStyle: 'bar',
      bulletStyle: 'disc',
      pageBorder: 'false',
      sectionNumbers: 'false',
      highDensity: 'false',
      linkStyle: 'professional',
      accentLinks: 'true'
    }
  };

  switch (profileType) {
    case 'very_short':
      return {
        ...base,
        profileInfo: {
          fullName: 'S.',
          designation: 'Staff Dev',
          summary: 'Minimal summary.'
        },
        contactInfo: {
          email: 's@dev.io',
          phone: '911',
          location: 'Remote'
        },
        workExperience: [],
        education: [
          { institution: 'MIT', degree: 'B.S.', startDate: '2020', endDate: '2024' }
        ],
        skills: [{ name: 'Rust, C++' }],
        projects: [],
        certifications: [],
        publications: [],
        awards: [],
        languages: [],
        interests: []
      };

    case 'only_education':
      return {
        ...base,
        profileInfo: {
          fullName: 'Prof. Alice Carter',
          designation: 'Dean of Computer Science',
          summary: 'Alice Carter is a distinguished academic with over 20 years of research experience in distributed systems, network security, and quantum cryptography.'
        },
        contactInfo: {
          email: 'carter@mit.edu',
          phone: '+1 617-253-1000',
          location: 'Cambridge, MA',
          website: 'https://mit.edu/carter'
        },
        workExperience: [],
        education: [
          { institution: 'Harvard University', degree: 'Ph.D. in Computer Science', startDate: '1998', endDate: '2002' },
          { institution: 'Stanford University', degree: 'M.S. in Computer Science', startDate: '1996', endDate: '1998' }
        ],
        skills: [{ name: 'Distributed Systems, Quantum Cryptography, Cryptanalysis' }],
        projects: [],
        certifications: [],
        publications: [
          { name: 'On Quantum Consensus Protocols', publisher: 'ACM Transactions on Computer Systems', date: '2005' }
        ],
        awards: [
          { name: 'Turing Award nominee', issuer: 'ACM', date: '2021' }
        ]
      };

    case 'no_summary':
      return {
        ...base,
        profileInfo: {
          fullName: 'Johnathan Doe',
          designation: 'Senior Frontend Architect',
          summary: '' // EMPTY
        },
        contactInfo: {
          email: 'johnathan.doe@frontend.io',
          phone: '+1 555-123-4567',
          location: 'Denver, CO',
          linkedIn: 'https://linkedin.com/in/johnathan-doe'
        },
        workExperience: [
          { company: 'LeadDev Corp', position: 'Lead Developer', startDate: '2019-01', endDate: 'Present', description: 'Rebuilt company core application in React and Next.js, saving 40% loading time.' }
        ],
        education: [],
        skills: [{ name: 'React, Redux, Next.js, Webpack, Vite, CSS Modules' }],
        projects: [],
        certifications: []
      };

    case 'long':
      return {
        ...base,
        profileInfo: {
          fullName: 'Elizabeth Montgomery',
          designation: 'Principal Solutions Architect',
          summary: 'Elizabeth Montgomery is a cloud certified solutions architect who handles multi-million dollar cloud infrastructure systems. Specializes in cost optimization, infrastructure as code, and high-availability disaster recovery models.'
        },
        contactInfo: {
          email: 'elizabeth.montgomery@cloudarchitect.net',
          phone: '+1 (312) 555-0143',
          location: 'Chicago, IL',
          github: 'https://github.com/elizabeth-montgomery',
          website: 'https://elizabeth.montgomery.architect.io'
        },
        workExperience: [
          { company: 'Enterprise Scale Inc.', position: 'Principal Architect', startDate: '2020-04', endDate: 'Present', description: 'Migrated legacy mainframe compute layers to AWS serverless setups. Reduced overhead costs by $2.4M annually.' },
          { company: 'Global Solutions LLC', position: 'Senior Infrastructure Engineer', startDate: '2016-02', endDate: '2020-04', description: 'Led Kubernetes platform migration across 4 corporate data centers. Managed CI/CD release integrations.' }
        ],
        education: [
          { institution: 'Northwestern University', degree: 'B.S. in Electrical and Computer Engineering', startDate: '2012', endDate: '2016' }
        ],
        skills: [
          { name: 'AWS Cloud Services, GCP, Terraform, Ansible, Docker, Kubernetes' },
          { name: 'Linux System Administration, Bash, Python scripting, PostgreSQL, Redis' }
        ],
        projects: [
          { name: 'Terraform AWS Orchestration Module', description: 'Open source module with 50,000+ downloads for provisioning multi-region VPC architectures.', url: 'https://github.com/elizabeth/terraform-aws' }
        ],
        certifications: [
          { name: 'AWS Certified Solutions Architect - Professional', issuer: 'Amazon Web Services' },
          { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud Platform' }
        ]
      };

    case 'very_long':
      return {
        ...base,
        profileInfo: {
          fullName: 'Dr. Christopher Alexander Theodore Vance II', // Long name
          designation: 'Executive Director & Chief Scientific Advisor for Cyber-Physical Scalable Systems', // Long role
          summary: 'Christopher Theodore Vance II is an executive leader and researcher with 20+ years of tenure leading scientific research consortia. Highly experienced in securing multi-million dollar research grants, writing peer-reviewed publications, and designing physical compute boards.'
        },
        contactInfo: {
          email: 'christopher.alexander.theodore.vance.ii@scientific-consortium.org', // Long email
          phone: '+1 206-555-0199 ext. 4930',
          location: 'Seattle, WA, United States of America',
          linkedIn: 'https://linkedin.com/in/christopher-alexander-theodore-vance-ii-scientific-consortium-consortia-systems', // Long URL
          github: 'https://github.com/christopher-alexander-theodore-vance-ii-scientific-computing-systems',
          website: 'https://christopher-alexander-theodore-vance-ii.scientific-consortium.org/publications/2026'
        },
        workExperience: [
          { company: 'National Consortium for Advanced Computations', position: 'Executive Director', startDate: '2018-09', endDate: 'Present', description: 'Directing federal research grants, coordinating engineering teams developing experimental supercomputer designs, and managing an annual budget of $15,000,000.' },
          { company: 'Pacific Northwest Laboratories', position: 'Lead Computational Scientist', startDate: '2010-06', endDate: '2018-09', description: 'Developed custom parallel computing compiler techniques. Published 12 peer-reviewed journal papers on distributed memory paradigms.' }
        ],
        education: [
          { institution: 'University of Washington', degree: 'Ph.D. in Parallel Systems and Compiler Theory', startDate: '2005', endDate: '2010' },
          { institution: 'University of Washington', degree: 'M.S. in Computer Science', startDate: '2003', endDate: '2005' },
          { institution: 'Oregon State University', degree: 'B.S. in Mathematics and Computer Science', startDate: '1999', endDate: '2003' }
        ],
        skills: [
          { name: 'MPI, OpenMP, CUDA, Parallel Algorithms, High Performance Computing, Compiler Optimizations' },
          { name: 'Fortran, C, C++, Rust, assembly language, supercomputer cluster architectures, cluster networking' }
        ],
        projects: [
          { name: 'UW-MPIC: Parallel Compiler Compiler for Distributed Compute Cells', description: 'Developed open-source message passing interface compiler overlay reducing cache misses by 44%.', url: 'https://github.com/uw-mpic/dist-compiler-cell-hpc-rust' }
        ],
        certifications: [
          { name: 'HPC Professional Cluster Manager Certification', issuer: 'OpenHPC' }
        ],
        publications: [
          { name: 'Optimal Cache Cell Alignments for Parallel Compilers', publisher: 'IEEE Transactions on Parallel Computing', date: '2011' },
          { name: 'Scaling distributed computing compiler layers to 10,000 nodes', publisher: 'ACM Transactions on Parallel Systems', date: '2016' }
        ],
        awards: [
          { name: 'Outstanding Young Computational Scientist Award', issuer: 'National Science Foundation', date: '2012' },
          { name: 'Distinguished Service Medal for Scientific Leadership', issuer: 'NCAC', date: '2024' }
        ]
      };

    default: // medium
      return {
        ...base,
        profileInfo: {
          fullName: 'Marcus Aurelius',
          designation: 'Senior DevOps Architect',
          summary: 'Experienced infrastructure architect focusing on cloud orchestration and declarative container deployment flows.'
        },
        contactInfo: {
          email: 'marcus.aurelius@devops.org',
          phone: '+1 555-9018',
          location: 'Rome, GA',
          linkedIn: 'https://linkedin.com/in/marcus-aurelius'
        },
        workExperience: [
          { company: 'SaaS Systems Ltd', position: 'Senior DevOps Engineer', startDate: '2021-02', endDate: 'Present', description: 'Optimized Kubernetes pod allocation reducing cloud costs by 22%.' }
        ],
        education: [
          { institution: 'Georgia Tech', degree: 'B.S. in Computer Science', startDate: '2017', endDate: '2021' }
        ],
        skills: [{ name: 'Terraform, Docker, Kubernetes, Prometheus, Grafana' }],
        projects: [],
        certifications: []
      };
  }
}
