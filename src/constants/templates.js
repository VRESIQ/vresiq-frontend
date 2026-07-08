export const FREE_TEMPLATES = [
  { id: "template1", name: "Classic", defaultFont: "inter", defaultAccent: "#111410" },
];

export const PREMIUM_TEMPLATES = [
  { id: "template2",  name: "Nova", defaultFont: "sora", defaultAccent: "#2d6a4f" },
  { id: "template3",  name: "Horizon", defaultFont: "playfair", defaultAccent: "#1d3557" },
  { id: "premium1",  name: "Prestige", defaultFont: "outfit", defaultAccent: "#3a7d44" },
  { id: "premium2",  name: "Executive", defaultFont: "cormorant", defaultAccent: "#5c4033" },
  { id: "premium3",  name: "Elite", defaultFont: "spacegrotesk", defaultAccent: "#0d3b66" },
  { id: "premium4",  name: "Signature", defaultFont: "raleway", defaultAccent: "#222222" },
  { id: "premium5",  name: "Apex", defaultFont: "jakarta", defaultAccent: "#c1121f" },
  { id: "premium6",  name: "Split", defaultFont: "ibmplex", defaultAccent: "#14213d" },
  { id: "premium7",  name: "Block", defaultFont: "bodoni", defaultAccent: "#7b2d8b" },
  { id: "premium8",  name: "Visual", defaultFont: "nunito", defaultAccent: "#e76f51" },
  { id: "premium9",  name: "Centered", defaultFont: "fraunces", defaultAccent: "#2c6e49" },
  { id: "premium10", name: "Minimal", defaultFont: "sourcecode", defaultAccent: "#1b4332" },
  { id: "consulting_bcg", name: "Summit", defaultFont: "tinos", defaultAccent: "#000000" },
  { id: "tech_faang", name: "Atlas", defaultFont: "inter", defaultAccent: "#1a5fb4" },
  { id: "harvard_ats", name: "Stone", defaultFont: "default", defaultAccent: "#000000" },
  { id: "swiss_minimal", name: "Metro", defaultFont: "default", defaultAccent: "#2b2b2b" },
  { id: "ats_classic",     name: "Standard", defaultFont: "inter", defaultAccent: "#111111" },
  { id: "ats_entry",       name: "Edge", defaultFont: "inter", defaultAccent: "#111111" },
  { id: "ats_senior",      name: "Serif", defaultFont: "default", defaultAccent: "#111111" },
  { id: "ats_lead",        name: "Lead", defaultFont: "inter", defaultAccent: "#111111" },
  { id: "ats_intern",      name: "Campus", defaultFont: "inter", defaultAccent: "#111111" },
  { id: "ats_experienced", name: "Prime", defaultFont: "inter", defaultAccent: "#111111" },
  { id: "academic_cv",     name: "Scholar", defaultFont: "lora", defaultAccent: "#111111" },
  { id: "engineer_ats",    name: "Frame", defaultFont: "inter", defaultAccent: "#111111" },
];

export const ALL_TEMPLATE_MAP = Object.fromEntries(
  [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES].map((t) => [t.id, t.name])
);

export const getTemplateDefaultFont = (templateId) => {
  const t = [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES].find((x) => x.id === templateId);
  return t?.defaultFont || "default";
};

export const getTemplateDefaultAccent = (templateId) => {
  const t = [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES].find((x) => x.id === templateId);
  return t?.defaultAccent || "#111111";
};
