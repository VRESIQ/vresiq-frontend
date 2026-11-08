# VRESIQ — Bottom Black Horizontal Line: Forensic Investigation & Permanent Fix

**Date:** 2026-11-08
**Investigator:** Buffy (independent investigation)
**Target project:** `vresiq-frontend` (Vite + React), PDF path `vresiq-backend/pdf-generator.js`
**Status:** Root cause proven experimentally; fix implemented; preview and PDF verified. Not committed, not deployed.

---

## 1. Original problem

A solid black horizontal rule appeared immediately after the last resume section, spanning the full resume page width, with blank white space below it. It was reported in both the live preview and the downloaded PDF, for every template/user.

## 2. Repository state before any change

| Item | Value |
|---|---|
| Repo | `C:\Users\ACER\Documents\GitHub\vresiq-frontend` (`.git` lives only here; the workspace root is not a git repo) |
| Branch | `main` |
| HEAD | `2da4a07` (".", 2026-09-12) |
| `origin/main` | `2da4a07` — identical to HEAD |
| Working tree | **clean** (`git status --porcelain` empty) |
| `dist/` | committed, hash `ResumePreview-bn25KlVz.css` |

Recent history:

```
2da4a07 .                        (adds .watermark-footer element + investigation scripts)
fe098b7 fix(watermark): hide HTML watermark in print ...   (display:none in @media print)
a8b0107 .
```

Important finding: **there is no `.resume-preview::after` rule anywhere in this repository, in any stylesheet, in any commit reachable from `origin/main`, or in the committed `dist/` bundle.** The removal described in the brief is not present in the code that is actually being built here, so it could not have been the cause of a line that still exists after it.

## 3. Previous attempted-fix findings (investigation history, not root causes)

1. **Commit `fe098b7`** changed the print rule for `.watermark-footer` from `position: fixed` to `display: none`, on the theory that duplicate watermarks (HTML + Puppeteer `footerTemplate`) created the line.
   - `ResumePreview.css` today: `.watermark-footer { position: sticky; ... }` on screen, `display: none !important` in `@media print`.
   - The watermark footer has **no border, outline or background** (`background: transparent`, no `border-*`), so it cannot paint a solid line.
2. **Commit `2da4a07`** added the `.watermark-footer` element to the preview and various `debug-*.js` / `inspect-line.mjs` scripts. Those scripts inspected only the article's direct children and the watermark; none of them compared the *outermost content container's* border, which is where the line actually comes from.
3. **Production drift:** the live deployment (`https://vresiq.vercel.app`, redirected from `vresiq-frontend.vercel.app`) serves `index-BVhLcgbi.css` byte-identical to this repo's `dist/`, but its `ResumePreview` chunk is **older** — it still contains `@media print { .watermark-footer { position: fixed !important; ... display:block !important } }`. So at least one previous "fix" was never deployed. Production is not a valid reference for current source.

## 4. Actual root cause (proven)

**File:** `src/components/ResumePreview.css`
**Selector:** `.rp-ats-container.rp-ats-senior` — the wrapper that contains the *entire* resume body.

```css
.rp-ats-senior {
  border-top: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);   /* ← the black line */
  --fb-border-bottom: 3px double var(--on-accent-line, rgba(255,255,255,0.2));
}
```

- `ats_senior` ("Serif") defaults to accent `#111111` (`templates.js`), rendered as `rgb(17, 17, 17)` — a near-pure-black 2px rule.
- Because the border sits on the **content container**, it is painted immediately after the last section, not at the page edge.
- The article adds `padding-bottom: 48px` and `min-height: 1056px`, so the rule lands at the end of content with **~220px of blank white page below it** — exactly the reported appearance.
- The same DOM + CSS is serialized by `getPDFBlob()` (`ResumeEditor.jsx`) and printed by Puppeteer, so the identical rule is in the PDF.

### DOM / geometry evidence (live app render)

```
container   : div.rp-ats-container.rp-ats-senior
border-bottom: 2px solid rgb(17, 17, 17)
accent      : #111111
contentBottom: 836   (relative to article top)
article     : height 1056, padding-bottom 48px
→ 220px of blank white space below the line
```

Pixel scan of the real element screenshot (816px wide):

| State | Dark full-width rows (≥88% width, luminance <110) |
|---|---|
| Before fix | `y=1–2` (template top rule), `y=172`, `y=264`, `y=409`, `y=529` (section-title dividers), **`y=616–617`, coverage 0.999** ← artifact |
| After fix | `y=1–2` (top rule), `y=172`, `y=264`, `y=409`, `y=529` (section titles). **No end-of-content band.** |

Experimental control in the running app: re-injecting only `.rp-ats-senior{border-bottom:2px solid var(--accent)}` restores the line; removing it deletes only that band, leaving every section divider intact.

### PDF evidence (content-stream level)

Generated with the project's own `vresiq-backend/pdf-generator.js` from the exact HTML the app POSTs to `/api/resumes/{id}/export-pdf`.

**Before fix** (1-page, free plan) — full-width filled rects, color `.0667` = `#111111`:

```
0 0 816 2 re f      ← template top rule
0 773 816 2 re f    ← THE ARTIFACT (container bottom border, 816 wide, 2 high)
40 137 736 1 re f   ← section dividers (40), still present
...
```

**After fix** (1-page): the `0 773 816 2 re f` rect is **absent**; `0 0 816 2 re f` (top rule) and all `736×1` section dividers remain.

**After fix** (2-page, 1527px content): 2 pages; page 2 contains only `736×1` section dividers — no `816×2` rect at all. No blank page.

## 5. Why the previous fix did not work

- It targeted `.resume-preview::after`, which **does not exist in this source tree**; deleting a non-existent rule cannot change rendering.
- It targeted the watermark, which has no paint properties capable of drawing a solid line.
- Previous automated checks inspected the watermark and the article's direct children, never the nested `.rp-ats-container` border, so the line was never in their candidate set.
- The production bundle was stale relative to source, making before/after comparisons unreliable.

## 6. Exact file modified

| File | Change |
|---|---|
| `src/components/ResumePreview.css` | Removed `border-bottom: 2px solid var(--accent);` from `.rp-ats-senior`; added an explanatory comment. Kept `border-top` and `--fb-border-bottom`. |

Net diff: **1 declaration removed, 1 comment added.** No other file changed. `git status` shows only this file plus the untracked evidence folder below.

## 7. Permanent implementation

```css
.rp-ats-senior {
  /* Top rule only. This container wraps the entire resume, so a border-bottom
     here renders as a full-width rule immediately after the final section and
     above the page's remaining blank space — in the live preview and in the
     exported PDF ... Section-title dividers and the header's double rule are
     unaffected. */
  border-top: 2px solid var(--accent);
  --fb-border-bottom: 3px double var(--on-accent-line, rgba(255,255,255,0.2));
}
```

Why this is the right level: the rule is a shared, template-level style, so every resume using `ats_senior` (existing and newly created) inherits it; preview and PDF read the same CSS, so both are corrected by one change. Section dividers (`.rp-stitle`, `.rp-rule`, header double rule), pagination rules and page dimensions are untouched.

## 8. Verification

### 8.1 Real preview (live React app, real `ResumePreview`, real template data)

| Scenario | Result |
|---|---|
| One-page `ats_senior` (free) | **Verified** — artifact band gone; watermark present |
| Two-page `ats_senior` (free, 1527px) | **Verified** — no end-of-content band; watermark present |
| Section dividers preserved | **Verified** — bands at y=172/264/409/529 remain |
| All 24 templates swept (pixel scan for ≥88%-width dark rows ending at content bottom) | **Verified** — `endBands=[]` for all 24 after fix; before fix only `ats_senior` had one (`y=835–836`, coverage 0.999) |
| Free-plan watermark | **Verified** — `.watermark-footer` "Made with VRESIQ" still renders in preview |

### 8.2 Real PDF

| Scenario | Result |
|---|---|
| One-page PDF (free) | **Verified** — no bottom `816×2` rect; top rule + dividers intact; footer watermark present (`pdftotext` finds "Made with VRESIQ" once) |
| Two-page PDF (free) | **Verified** — 2 pages, no `816×2` rect on either page, watermark text on both pages, no blank page |
| PDF metadata step | **Verified** — `pdf-lib` metadata step ran successfully |

### 8.3 Build / regression

- `npx vite build` → **succeeded** (25.8s, exit 0). Output written to a temp directory so the committed `dist/` was not modified.
- Preview CSS bundle hash changed (`ResumePreview-bn25KlVz.css` → `ResumePreview-BrrcAqq2.css`), confirming the fix is in the shipped asset.
- No tests were weakened or removed; no test suite exists for resume rendering in this repo (`visual:test` requires baselines and was not run).

## 9. Evidence artifacts

All under `tools/bottomline-forensics/`:

| Artifact | Purpose |
|---|---|
| `out/EVIDENCE-before.png` | Artifact visible (control: removed declaration re-injected into the running app) |
| `out/EVIDENCE-after.png` | Current code — line gone, watermark intact |
| `out/before-free.pdf` | Real pre-fix PDF (contains `0 773 816 2 re`) |
| `out/after-one.pdf`, `out/after-multi.pdf` | Real post-fix PDFs |
| `out/export-before.html`, `out/export-after-*.html` | Exact HTML the app POSTs to the export endpoint |
| `out/sweep-all-free.json` | Per-template pixel/geometry sweep |
| `lib-harness.mjs`, `13-sweep.mjs`, `14-ats-senior.mjs`, `15-sweep-all.mjs`, `16-pdf-capture.mjs`, `17-long-pdf.mjs`, `18-evidence-shots.mjs`, `pdfscan-forensic.cjs` | Reproducible harness |

## 10. Remaining limitations (explicit)

**Verified:** the DOM/CSS source of the line, its removal in the preview, its removal in a PDF produced by the app's own serializer + the project's own Puppeteer generator, all 24 templates, one- and two-page pagination, free-plan watermark.

**Partially verified / not verified:**

- **Authentication was not exercised end-to-end.** The local Spring backend had no seeded admin (seeder needs `SEED_ADMIN_*` env), the old admin credentials were rejected, and the production API rejects the same password; registration requires email verification. The harness therefore drives the **real application UI and real `ResumePreview` component** but fulfills `/api/auth/profile` and `/api/resumes/{id}` with a test user and real resume-shaped data via Playwright routing. The rendering/PDF code paths are untouched by this stubbing, but a signed-in manual pass is still advisable.
- **Multi-page was produced by expanding resume data** (10 experience items + 6 projects) rather than a real 2-page user resume; page-breaking CSS was not modified, and page count matched content height (1527px → 2 pages).
- **Decoratives combinations** (card/full-bleed headers, custom accents, page border toggle) were not swept; only clean defaults plus the default accent for each template. `pageBorder` remains an explicit opt-in (`--page-border`) and was off.
- **The live production site still serves the older bundle**, so the fix is not live until a build + deploy happens; `dist/` in the repo is now one build behind the source on purpose (to avoid touching committed artifacts).
- A 3+ page PDF was not generated; the removed border only exists once per document (outer container), so page count cannot reintroduce it.
- No commit or push was made.

## 11. Reproduction commands

```bash
cd vresiq-frontend
npx vite --port 5180 --strictPort        # dev server
node tools/bottomline-forensics/18-evidence-shots.mjs   # before/after images
node tools/bottomline-forensics/15-sweep-all.mjs free   # all-template pixel sweep
node tools/bottomline-forensics/17-long-pdf.mjs after   # capture export HTML
cd ../vresiq-backend
node pdf-generator.js ../vresiq-frontend/tools/bottomline-forensics/out/export-after-one.html /tmp/one.pdf true
node ../vresiq-frontend/tools/bottomline-forensics/pdfscan-forensic.cjs /tmp/one.pdf
```

## 12. Conclusion

The line was **not** a pseudo-element, not the watermark, and not a print-only artifact. It was the `border-bottom` of the `.rp-ats-senior` resume container — a near-black 2px rule painted at the end of the content flow, above the page's unused white space, and serialized verbatim into the PDF. Removing that single declaration eliminates the line in the live preview and in generated PDFs for one, two and multi-page resumes, while preserving section dividers, the top template rule, page dimensions, pagination and the free-plan watermark.
