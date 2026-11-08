# Batch 2 — Light Theme Correction Report

**Date:** 2026-11-08
**Scope:** `vresiq-frontend` — light ("day") theme only. Dark theme intentionally untouched.
**Status:** Implemented and visually verified. **Not committed, not pushed.**

---

## 1. Root cause

The yellow was **not** a single broken color — it was the light palette itself plus surfaces that bypassed it.

| Layer | Problem |
|---|---|
| **Shared tokens** (`src/styles/brand.css` `:root`) | `--paper: #fffef9` (warm cream), `--wash: #f4f2ea` (beige), `--wash-2: #ebe8dd` (warm gray), `--line: rgba(17,20,16,0.1)`. Every page, card, sidebar and input inherits these, so the whole app was cream. |
| **Hardcoded "glass" whites** | 24 declarations used `rgba(255, 254, 249, …)` — a warm off-white — across nav bars, cards, inputs, editor panels, loaders and the modal. These ignored the tokens entirely. |
| **Lime background washes** | `.premium-shell` (used by dashboard, editor, landing, pricing, profile, admin) painted `linear-gradient(180deg, rgba(184,255,44,0.14), …)`. 14% lime over cream is exactly the pale-yellow tint reported. `Auth.css` had the same at 0.12, the dashboard thumbnail placeholder at 0.20, and the landing hero glow blob at 0.28. |
| **Warm leftovers** | Skeleton shimmer (`#ebe8dd`/`#f4f2ea`), resume thumbnail wrap (`#f0eee4`), template-art bars (`#d8d5ca`), preview backdrop (`#f2f0e8`), phone-country active chip (`#f0eed6`), landing paper mock lines (`#e8e7df`). |

Theme **mechanics** were already correct and were left alone: `useTheme` applies `data-theme` from `localStorage["vresiq-theme"]` (falling back to `prefers-color-scheme`), and `ThemeToggle` writes the same key. No architectural change was needed — this is a palette/token defect, not a theme-system defect.

## 2. New light palette (`:root` in `brand.css`)

| Token | Old | New | Role |
|---|---|---|---|
| `--paper` | `#fffef9` | `#FFFFFF` | page + card background |
| `--wash` | `#f4f2ea` | `#F7F8FA` | secondary background |
| `--wash-2` | `#ebe8dd` | `#EEF0F3` | fills, hover, skeletons |
| `--ink` | `#111410` | `#171717` | primary text |
| `--muted` | `#697067` | `#666666` | secondary text |
| `--line` | `rgba(17,20,16,0.1)` | `#E5E7EB` | borders |
| `--accent` | `#b8ff2c` | **unchanged** | lime brand accent |
| `--accent-dark` | `#648c00` | **unchanged** | accessible green text/link |

Every neutral now has near-equal RGB channels, so no surface can render warm/yellow. Inputs resolve to white (`rgba(255,255,255,0.72)` over `#fff`) with `#E5E7EB` borders.

## 3. Changes made

| File | Change |
|---|---|
| `src/styles/brand.css` | Retuned all light tokens; documented the palette; `.premium-shell` gradient switched from lime wash to `var(--wash)` fade |
| `src/pages/Home.css` | Hero glow tokenised (`--glow-min/--glow-max`: 0.10/0.14 light, 0.28/0.36 dark — dark keeps its previous effective values); paper mock lines `#e8e7df` → `#e5e7eb` |
| `src/pages/Dashboard.css` | Thumbnail wrap → `var(--wash)`; placeholder lime gradient → neutral 5% ink; template mini cards → `var(--paper)`; skeleton shimmer → `--wash-2`/`--wash`; upgrade strip lime 0.14 → 0.08 |
| `src/pages/Auth.css` | Lime page gradient → neutral `--wash` fade |
| `src/pages/ResumeEditor.css` | Template-art bars → `var(--line)`; preview backdrop `#f2f0e8` → `var(--wash)` |
| `src/components/common/SmartInputs.css` | Active country option `#f0eed6` → `var(--wash-2)` |
| `src/components/common/GlobalLoader.css`, `MediumLoader.css` | `#fffef9` fallbacks → `#ffffff` |
| all page/component CSS | 24 × `rgba(255,254,249,…)` → `rgba(255,255,255,…)` (semantically white glass, identical alpha) |
| `tools/batch2/theme-audit.mjs` | New Playwright audit: light/dark screenshots + computed-color neutrality checks + persistence |

**No component JSX, no route, no API and no dark-mode rule was modified.** Dark mode redefines the same tokens, so it inherits nothing from this change except the two glow variables, which were set back to their previous effective values.

## 4. Verification

Command: `node tools/batch2/theme-audit.mjs` (real Vite app, Playwright, `/api/*` stubbed). Machine-readable output: `tools/batch2/out/theme-results.json`.

### Computed colors — light mode (neutral = RGB spread ≤ 6)

| Surface | Measured | Verdict |
|---|---|---|
| Landing `body` | `rgb(255,255,255)` | white |
| Landing nav | `rgba(255,255,255,0.75)` | white glass |
| Landing `h1` | `rgb(23,23,23)` | `#171717` |
| Dashboard root | `rgb(255,255,255)` | white |
| Resume card | `rgba(255,255,255,0.92)` | white |
| Resume thumbnail wrap | `rgb(247,248,250)` | `#F7F8FA`, spread 3 |
| Editor body | `rgb(255,255,255)` | white |
| Editor sidebar | `rgba(255,255,255,0.72)` | white glass |
| Editor preview panel | `rgb(247,248,250)` | `#F7F8FA` |
| Editor input | `rgba(255,255,255,0.72)` | white |
| Editor input border | `rgb(229,231,235)` | `#E5E7EB` |
| Modal | `rgba(255,255,255,0.92)` | white |
| Modal input | `rgba(255,255,255,0.72)` | white |
| Tokens | `--paper #ffffff`, `--wash #f7f8fa`, `--line #e5e7eb` | as specified |

Zero surfaces measured warm (max RGB spread across all light surfaces: 3).

### Dark mode — unchanged

`--ink #f0f1ee`, `--paper #0a0b09`, dashboard root `rgb(10,11,9)`, cards `rgba(18,20,16,0.6)`, editor sidebar `rgba(18,20,16,0.95)` — identical to the pre-change values. Dark screenshot reviewed side by side; no visual regression.

### Theme persistence

| Check | Result |
|---|---|
| `data-theme` on load | `light` (and `dark` when stored) |
| Dark persists after full reload | `dark` |
| Toggle switches to light | `light` |
| Light persists after reload | `light` |
| `localStorage["vresiq-theme"]` | `light` |

### Pages/states captured

Landing, Dashboard, Editor (Profile), Section Layout, Customization, ATS Refine, document view, New-resume modal, mobile dashboard (390×844), dark dashboard, dark editor. **Page errors: none. Mobile horizontal overflow: 0px.**

## 5. Screenshots (`tools/batch2/out/`)

| File | Mode |
|---|---|
| `light-landing.png` | light |
| `light-dashboard.png` | light |
| `light-editor.png` | light |
| `light-section-layout.png` | light |
| `light-customization.png` | light |
| `light-ats-refine.png` | light |
| `light-modal.png` | light |
| `light-dashboard-mobile.png` | light |
| `dark-dashboard.png` | dark |
| `dark-editor.png` | dark |

## 6. Build

`npx vite build --outDir /tmp/vresiq-b2-build --emptyOutDir` → **exit 0**, built in 42.37s, bundles emitted normally.

## 7. Deliberately preserved

- Lime accent on buttons, selected template borders, focus rings, toggle switches, skill bars and section-enabled chips. These are brand **accents**, not surfaces; the spec asked to keep the green identity.
- The resume document itself (`.resume-preview`, all `rp-*` templates) keeps its own print-oriented colors — it must not follow the app theme, and it was not touched.
- Dark mode's warmer charcoal/lime-tinted borders (e.g. `rgba(232,230,220,…)` inside `[data-theme="dark"]` blocks) were left as-is by design.

## 8. Limitations

- **No live backend/account** in this environment, so pages were driven with stubbed API responses through the real UI and CSS. Visual/theme correctness is fully exercised; data flows are not.
- Modal and editor tabs were captured; native `<select>` popups (OS-rendered) were not screenshotted, and the custom phone-country dropdown was fixed at the token level but not opened in a screenshot.
- No cross-browser pass beyond Chromium (the project's own test browser). Contrast was chosen from the specified palette; automated WCAG contrast ratios were not computed for every component.
- Print/PDF output is unaffected by this change (it uses the resume's own print stylesheet), so PDFs were not regenerated.
- Nothing committed or pushed.

## 9. Definition of Done

Day mode is now consistently neutral white/light-gray (`#FFFFFF` / `#F7F8FA` / `#E5E7EB`, text `#171717` / `#666666`), every previously warm surface and lime background wash is gone, dark mode is unchanged, and the lime accent identity is intact. The only gap is that no real backend was available for authenticated data flows, which are unrelated to theming.
