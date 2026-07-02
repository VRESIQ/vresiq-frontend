export const FREE_TEMPLATES = [
  { id: "template1", name: "Classic" },
];

export const PREMIUM_TEMPLATES = [
  { id: "template2",  name: "Nova" },
  { id: "template3",  name: "Horizon" },
  { id: "premium1",  name: "Prestige" },
  { id: "premium2",  name: "Executive" },
  { id: "premium3",  name: "Elite" },
  { id: "premium4",  name: "Signature" },
  { id: "premium5",  name: "Apex" },
  { id: "premium6",  name: "Split" },
  { id: "premium7",  name: "Block" },
  { id: "premium8",  name: "Visual" },
  { id: "premium9",  name: "Centered" },
  { id: "premium10", name: "Minimal" },
  { id: "consulting_bcg", name: "Summit" },
  { id: "tech_faang", name: "Atlas" },
  { id: "harvard_ats", name: "Stone" },
  { id: "swiss_minimal", name: "Metro" },
  { id: "ats_classic",     name: "Standard" },
  { id: "ats_entry",       name: "Edge" },
  { id: "ats_senior",      name: "Serif" },
  { id: "ats_lead",        name: "Lead" },
  { id: "ats_intern",      name: "Campus" },
  { id: "ats_experienced", name: "Prime" },
  { id: "academic_cv",     name: "Scholar" },
  { id: "engineer_ats",    name: "Frame" },
];

export const ALL_TEMPLATE_MAP = Object.fromEntries(
  [...FREE_TEMPLATES, ...PREMIUM_TEMPLATES].map((t) => [t.id, t.name])
);
