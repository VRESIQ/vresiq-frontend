# Batch 1 — Internship URL Field + Independent Training Section

**Date:** 2026-11-08
**Scope:** `vresiq-frontend` (React/Vite editor + preview) and `vresiq-backend` (Spring Boot resume document model)
**Status:** Implemented and verified locally. **Not committed, not pushed, not deployed.**

---

## 1. Summary

| Objective | Result |
|---|---|
| A. Optional **Relevant URL** on Internships | Done — editor field, `https://` normalization, persisted, rendered as a clickable link in preview and PDF |
| B. Independent **Training** section | Done — own `customSections.training` array, own fields/labels/heading, bullets toggle, Section Visibility & Order, preview + PDF |
| Regression | 37/37 UI/PDF/model checks pass; frontend build and backend compile both succeed |

Training is **not** an alias of Internships: it stores under a different key, has its own field labels and placeholder copy, and its own section heading and bullet setting. Editors, preview and export all consume them independently.

---

## 2. Data model changes

### Frontend resume shape

```js
customSections: {
  internships: [{ title, subtitle, date, description, url }],   // url is new + optional
  training:    [{ title, subtitle, date, description, url }],   // new section
}
```

- `internships[].url` — optional string, absolute `http(s)://` URL after blur normalization.
- `training[].title` — Training / Course Name
- `training[].subtitle` — Training Provider / Institution
- `training[].date` — Training Dates / Duration
- `training[].description` — Key Skills & Learnings (supports the existing multi-bullet description syntax)
- `training[].url` — optional string

Section-level state continues to live in `decoratives`:
- `sectionVisibility` → now contains `"training": true|false`
- `sectionOrder` → may contain `training`
- `sectionBullets` → now supports `"training": true|false`

### Backend document (`Resume.CustomSectionEntry`)

```java
private String title;
private String subtitle;
private String date;
private String description;
/** Optional relevant URL (internship certificate/page, training certificate/course). */
private String url;          // ← added
private String authors;
@JsonProperty("abstract") private String abstractText;
private String paperUrl;
private String abstractAuthors;
```

**Migration:** none required. `customSections` is a `Map<String, List<CustomSectionEntry>>` embedded in the MongoDB `resumes` document; adding a nullable field means existing documents simply deserialize `url = null`. No index, schema or backfill changes.

## 3. API changes

**None.** The existing contract already carries the data:

- `PUT /api/resumes/{id}` (`ResumeUpdateRequest.customSections`) → `ResumeService.updateResume` performs `existing.setCustomSections(incoming.getCustomSections())`, i.e. a wholesale replacement, so `training` and `url` flow through untouched.
- `GET /api/resumes/{id}` returns the same map.

The only backend change needed was the model field, because `CustomSectionEntry` is a closed class and Jackson would otherwise drop `url` (verified: `FAIL_ON_UNKNOWN_PROPERTIES` is only disabled for unrelated rules loaders, so relying on leniency would have been unsafe).

No new endpoints, no DTO signature changes, no serialization break for older resume records.

## 4. Changed files

| File | Change |
|---|---|
| `vresiq-frontend/src/pages/ResumeEditor.jsx` | +50/−4 — `training` added to `allPossibleOptionalIds`; `url` config for internships; new `training` field config; `Training` label; `hasConfiguredField` helper; new entries seeded with `url: ""`; URL `Field` with blur-time `https://` normalization |
| `vresiq-frontend/src/components/ResumePreview.jsx` | +15/−1 — `training` in optional ids + label map; `CustomSection` renders `item.url` as a visible, clickable link |
| `vresiq-backend/src/main/java/in/rithik/resumebuilderapi/document/Resume.java` | +2 — `url` on `CustomSectionEntry` |
| `vresiq-frontend/tools/batch1/verify.mjs` | new — Playwright verification harness |
| `vresiq-frontend/tools/batch1/annots.cjs` | new — PDF link-annotation inspector |

No CSS changes were needed: the URL line reuses the existing `resume-link rp-compact-url` styles, so internship/training spacing matches every other link in the resume.

## 5. UI behaviour

- **Internship form:** Internship Role → Company / Team → Internship Dates → Key Projects & Learnings → **Relevant URL (optional)**. Same `.field` markup, hint style and spacing as the other fields; the URL field is only rendered for sections that declare a `url` config, so no other section changed.
- **Training form:** Add / Remove via the existing `Section` + `ListCard` controls used by Internships. Header shows `Add` and `+ Add Training`; each card has `Remove`. Fields: Training / Course Name, Training Provider / Institution, Training Dates / Duration, Key Skills & Learnings, Relevant URL (optional).
- **Show bullet points:** the existing per-section checkbox (`#bullets-toggle-training`) is generated automatically because Training is a first-class optional section — identical behaviour to Internships (list ⇄ stacked blocks).
- **Section Visibility & Order:** Training appears in *Add Additional Sections* (`+ Add` → `✓ Enabled`) and in the reorder list, with the same up/down controls. Navigation shows a single `Training` entry (no duplicates), and the sidebar entry only appears once the section is enabled.
- **Preview:** URL renders as a visible URL line (`acme.example.com/cert/123 ↗`) so parsers read the text; the anchor is the clickable target for humans and PDF consumers.

## 6. Tests actually run

Harness: real Vite app, real `ResumeEditor` + `ResumePreview`, real CSS, with `/api/*` fulfilled by Playwright (no live backend was available — see §8). Command: `node tools/batch1/verify.mjs` → **37/37 PASS**, `tools/batch1/out/verify-results.json`.

| # | Check | Result |
|---|---|---|
| 1 | Existing internship record loads (pre-existing data, no `url`) | PASS |
| 2 | Internship URL field present and hydrated from stored data | PASS |
| 3 | Internship URL renders in preview | PASS |
| 4 | Internship URL is a real anchor with the exact href | PASS |
| 5 | Training absent before enabling | PASS |
| 6 | Training enabled → exactly one navigation entry | PASS |
| 7 | Section Layout shows Training as `✓ Enabled` | PASS |
| 8 | Bare domain `nptel.ac.in/cert/abc` normalizes to `https://…` | PASS |
| 9–14 | Name, provider, dates, skills, URL text + anchor in preview | PASS |
| 15 | Training has its own section heading (separate from Internships) | PASS |
| 16 | Training renders a bullet list by default | PASS |
| 17 | Bullets toggle off → stacked `div` list, no `ul` | PASS |
| 18 | Multiple training entries (2 cards) | PASS |
| 19 | Second entry renders (name + provider) | PASS |
| 20 | Training **without** URL adds no link (link count stays 2) | PASS |
| 21 | Entry removal works (2 → 1) | PASS |
| 22 | Removed entry disappears from preview | PASS |
| 23 | Training listed in Section Visibility & Order | PASS |
| 24 | Reordering moves Training (position 6 → 5) | PASS |
| 25–28 | Save payload: internship URL, training entry, training URL, separate keys | PASS |
| 29 | `sectionVisibility.training === true` in save payload | PASS |
| 30–32 | Reload: training entry, training URL, internship URL survive | PASS |
| 33 | Export HTML captured (231,132 bytes) | PASS |
| 34–36 | Export HTML contains Training, training href, internship href | PASS |
| 37 | No uncaught page errors | PASS |

### PDF export (project's own generator)

```
node pdf-generator.js out/export-batch1.html out/batch1.pdf true
```

- **1 page**, watermark footer enabled (free plan).
- `pdftotext` extraction (ATS path):
  - `Software Engineering Intern Acme Cloud Built internal deployment tooling.`
  - `acme.example.com/cert/123`
  - `TRAINING`
  - `Advanced Java Programming NPTEL Java, OOP, Collections, Multithreading`
  - `June 2025 - August 2025  January 2026 - March 2026`
  - `nptel.ac.in/cert/abc`
- Link annotations (`tools/batch1/annots.cjs`):
  `["mailto:…","tel:…","https://www.google.com/maps/…","https://acme.example.com/cert/123","https://acme.example.com/cert/123","https://nptel.ac.in/cert/abc","https://nptel.ac.in/cert/abc"]`
  → both new URLs are clickable. Chrome emits two annotation rectangles per link on this run (text run + icon span); both target the same URL, so clicks behave correctly.

### Backend model round-trip (real Jackson, compiled classes)

```
READ_URL=https://nptel.ac.in/cert/abc
WRITE_HAS_URL=true
LEGACY_OK=Old Internship|null
```

→ `url` deserializes, re-serializes (so it persists to MongoDB) and older entries without the field stay valid.

## 7. Build results

| Command | Result |
|---|---|
| `npx vite build` (frontend) | **PASS** — built in 5.08s, exit 0. New bundles `ResumePreview-DAy3_fAl.js`, `ResumeEditor-B8zUJWjQ.js` |
| `./mvnw -o -DskipTests compile` (backend) | **PASS** — exit 0 |

## 8. Screenshots and artifacts

| Artifact | What it shows |
|---|---|
| `tools/batch1/out/preview-batch1.png` | Resume preview: INTERNSHIPS with `acme.example.com/cert/123 ↗`, then TRAINING with name, NPTEL, dates, skills, `nptel.ac.in/cert/abc ↗` |
| `tools/batch1/out/editor-batch1.png` | Editor at 1680×1100 with the Training form and live preview |
| `tools/batch1/out/export-batch1.html` | Exact HTML POSTed to the export endpoint |
| `tools/batch1/out/batch1.pdf` | Generated PDF used for text/annotation checks |
| `tools/batch1/out/verify-results.json` | Machine-readable results for all 37 checks |

## 9. Limitations (explicit)

- **No live backend/MongoDB in this environment.** The local Spring service is not running with a seeded account and the known credentials fail, so the harness drives the real UI with stubbed HTTP responses. Save/reload is therefore verified as a **client contract** (payload shape + rehydration), and backend persistence is verified separately at the model level (Jackson round-trip + `setCustomSections` wholesale copy + successful compile). A signed-in manual pass against a real DB is still advisable.
- The real Spring + Mongo path was **not** exercised end-to-end (no account/DB).
- PDF verification used the free plan; premium export differs only by the watermark footer.
- Multi-page PDF with a long Training section was not generated; Training uses the same `.rp-item` blocks and `page-break-inside: avoid` behaviour as Internships.
- ATS *scoring* was not changed or re-baselined; only ATS *text extraction* from the PDF was checked. Training is not added to `hasInternship` logic (no score change was requested, and changing it would alter existing scores).
- Duplicate URI annotations per link (two per anchor) were observed but are benign — both point to the same URL.
- Nothing was committed or pushed.

## 10. Definition of Done

Internship URLs and an independent Training section work across the editor form, bullet toggle, visibility/order control, save payload, reload rehydration, preview and PDF export (text + clickable links), with existing internship records and older resume documents still loading correctly. The one gap is a live authenticated database round-trip, which the environment could not provide.
