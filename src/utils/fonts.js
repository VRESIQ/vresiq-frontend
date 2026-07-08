// Maps each template ID to its Google Fonts URL and CSS variable names.
// Fonts are loaded dynamically on template switch — only active template fonts load.

export const FONT_MAP = {
  template1: {
    name: "Inter",
    url: null, // already preloaded in index.html
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  template2: {
    name: "Sora",
    url: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap",
    heading: "'Sora', sans-serif",
    body: "'Inter', sans-serif",
  },
  template3: {
    name: "Playfair Display",
    url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Lato:wght@300;400;700&display=swap",
    heading: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
  },
  premium1: {
    name: "Outfit",
    url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap",
    heading: "'Outfit', sans-serif",
    body: "'DM Sans', sans-serif",
  },
  premium2: {
    name: "Cormorant Garamond",
    url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500&display=swap",
    heading: "'Cormorant Garamond', serif",
    body: "'Jost', sans-serif",
  },
  premium3: {
    name: "Space Grotesk",
    url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  },
  premium4: {
    name: "Raleway",
    url: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800&family=Nunito+Sans:wght@300;400;600&display=swap",
    heading: "'Raleway', sans-serif",
    body: "'Nunito Sans', sans-serif",
  },
  premium5: {
    name: "Plus Jakarta Sans",
    url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Figtree:wght@300;400;500&display=swap",
    heading: "'Plus Jakarta Sans', sans-serif",
    body: "'Figtree', sans-serif",
  },
  premium6: {
    name: "IBM Plex Sans",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
    heading: "'IBM Plex Sans', sans-serif",
    body: "'IBM Plex Sans', sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },
  premium7: {
    name: "Bodoni Moda",
    url: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400&family=Mulish:wght@300;400;500;600&display=swap",
    heading: "'Bodoni Moda', serif",
    body: "'Mulish', sans-serif",
  },
  premium8: {
    name: "Nunito",
    url: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Open+Sans:wght@300;400;500&display=swap",
    heading: "'Nunito', sans-serif",
    body: "'Open Sans', sans-serif",
  },
  premium9: {
    name: "Fraunces",
    url: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;1,400&family=Manrope:wght@300;400;500;600&display=swap",
    heading: "'Fraunces', serif",
    body: "'Manrope', sans-serif",
  },
  premium10: {
    name: "Source Code Pro",
    url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&family=Source+Sans+3:wght@300;400;600&display=swap",
    heading: "'Source Code Pro', monospace",
    body: "'Source Sans 3', sans-serif",
  },
  academic_cv: {
    name: "Lora",
    url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
    heading: "'Lora', Georgia, serif",
    body: "'Lora', Georgia, serif",
  },
  consulting_bcg: {
    name: "Times New Roman",
    url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700&display=swap",
    heading: "'Lora', Georgia, serif",
    body: "'Lora', Georgia, serif",
  },
  tech_faang: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  harvard_ats: {
    name: "Georgia",
    url: null,
    heading: "Georgia, serif",
    body: "Georgia, serif",
  },
  swiss_minimal: {
    name: "Jost",
    url: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap",
    heading: "'Jost', sans-serif",
    body: "'Jost', sans-serif",
  },
  ats_classic: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  ats_entry: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  ats_senior: {
    name: "Georgia",
    url: null,
    heading: "Georgia, serif",
    body: "Georgia, serif",
  },
  ats_lead: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  ats_intern: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  ats_experienced: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  engineer_ats: {
    name: "Inter",
    url: null,
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
};

const loadedFonts = new Set(["template1"]);

/**
 * Dynamically injects a Google Fonts <link> tag for the given template.
 * Only injects once per session.
 */
export const loadTemplateFont = (templateId) => {
  if (loadedFonts.has(templateId)) return;
  const config = FONT_MAP[templateId];
  if (!config?.url) return;

  const existing = document.querySelector(`link[data-font="${templateId}"]`);
  if (existing) { loadedFonts.add(templateId); return; }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = config.url;
  link.setAttribute("data-font", templateId);
  document.head.appendChild(link);
  loadedFonts.add(templateId);
};

/**
 * Returns CSS font-family strings for the given template.
 */
export const getFontVars = (templateId) => {
  const config = FONT_MAP[templateId] || FONT_MAP.template1;
  return {
    "--rp-font-heading": config.heading,
    "--rp-font-body": config.body,
    "--rp-font-mono": config.mono || "'Source Code Pro', monospace",
  };
};
