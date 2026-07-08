import path from 'path';

export const CONFIG = {
  // Local servers
  frontendUrl: 'http://localhost:4173',
  backendUrl: 'http://localhost:8081',
  
  // Storage locations
  outputDir: './audit-output',
  baselineDir: './tools/visual-regression/baselines',
  
  // PDF.js library CDN to load inside browser for PDF-to-PNG rendering
  pdfJsUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfJsWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',

  // Tested templates list
  templates: [
    "template1", "template2", "template3", "premium1", "premium2",
    "premium3", "premium4", "premium5", "premium6", "premium7",
    "premium8", "premium9", "premium10", "consulting_bcg", "tech_faang",
    "harvard_ats", "swiss_minimal", "ats_classic", "ats_entry", "ats_senior",
    "ats_lead", "ats_intern", "ats_experienced", "academic_cv", "engineer_ats"
  ],

  // custom styling parameters
  fonts: ["default", "inter", "sora", "playfair", "outfit", "lora"],
  accents: ["default", "#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#1f2937"],
  headerStyles: ["minimal", "card", "full-bleed"],
  densities: ["true", "false"],
  linkStyles: ["professional", "standard"],
  photos: ["circle", "none"],
  
  // Visual diff thresholds
  diffThreshold: 1.0, // fail if diff > 1.0%
};

// Generates a smart combinatorial matrix mapping every template to a diverse rendering path
export function generateSmartMatrix() {
  const cases = [];
  
  // Define 6 content variations
  const contentVariations = [
    { type: 'very_short', description: 'Brief profile, single educational entry, no projects' },
    { type: 'medium', description: 'Standard details, medium experience, typical bullet points' },
    { type: 'long', description: 'Robust multiple-page profile with projects and certifications' },
    { type: 'very_long', description: 'Three-page profile, lengthy URLs, publications, and awards' },
    { type: 'only_education', description: 'Academic profile with credentials but zero experience' },
    { type: 'no_summary', description: 'Professional profile completely skipping the summary section' }
  ];

  CONFIG.templates.forEach((template, idx) => {
    // Generate 3 unique configurations per template (pairwise coverage variant)
    // Ensures all header styles, fonts, accents, density modes, photos, and content variations are tested.
    cases.push({
      template,
      caseId: `case_a`,
      description: `Default template with normal density, default styles and medium content`,
      config: {
        fontPairing: 'default',
        useCustomAccent: 'false',
        accentColor: 'default',
        highDensity: 'false',
        headerStyle: CONFIG.headerStyles[idx % 3],
        photo: CONFIG.photos[idx % 2],
        linkStyle: 'professional',
        contentProfile: contentVariations[idx % 6]
      }
    });

    cases.push({
      template,
      caseId: `case_b`,
      description: `Custom typography and custom accents with high-density and short profile content`,
      config: {
        fontPairing: CONFIG.fonts[(idx + 1) % CONFIG.fonts.length],
        useCustomAccent: 'true',
        accentColor: CONFIG.accents[(idx + 1) % CONFIG.accents.length],
        highDensity: 'true',
        headerStyle: CONFIG.headerStyles[(idx + 1) % 3],
        photo: CONFIG.photos[(idx + 1) % 2],
        linkStyle: 'standard',
        contentProfile: contentVariations[(idx + 1) % 6]
      }
    });

    cases.push({
      template,
      caseId: `case_c`,
      description: `Vibrant color themes, standard hyperlinks, and long multiple page content`,
      config: {
        fontPairing: CONFIG.fonts[(idx + 2) % CONFIG.fonts.length],
        useCustomAccent: 'true',
        accentColor: CONFIG.accents[(idx + 2) % CONFIG.accents.length],
        highDensity: 'false',
        headerStyle: CONFIG.headerStyles[(idx + 2) % 3],
        photo: CONFIG.photos[(idx + 2) % 2],
        linkStyle: 'professional',
        contentProfile: contentVariations[(idx + 2) % 6]
      }
    });
  });

  return cases;
}
