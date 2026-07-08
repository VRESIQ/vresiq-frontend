# Production-Grade Visual Regression & PDF Parity Validation Suite

VResIQ's layout regression testing module performs automated, combinatorial visual verification across the entire resume rendering engine.

---

## Capabilities & Scope

The validation suite targets:
1. **Templates**: All 25 supported layouts.
2. **Styling customizer combinations**: Toggles through all header styles (Minimal, Card, Full Bleed), standard vs professional links, high-density spacing states, and profile photo shapes.
3. **Typography**: Tests both default settings and custom font injections.
4. **Colorization**: Evaluates native accent default colors against custom palette configurations.
5. **Content depth**: Generates 6 mock profiles (very short single-page, standard resumes, robust multi-page CVs, credentials with zero experience, missing summaries, etc.) to stress-test container bounds.

---

## Installation & Setup

1. **Install Playwright Browser binaries**:
   ```bash
   npx playwright install chromium
   ```
2. **Build the production client package**:
   ```bash
   npm run build
   ```
3. **Start the local preview server**:
   ```bash
   npm run preview
   ```

---

## CLI Script Reference

- **`npm run visual:test`**: Run the visual regression audit. Captures the current Preview and PDF, comparing them to approved baselines.
- **`npm run visual:update-baseline`**: Capture and save current Preview and PDF renderings as approved design baselines.
- **`npm run visual:report`**: Logs report location. Reports compile automatically during test execution.

---

## Folder Structure

```
tools/
  visual-regression/
    config.js             # Testing thresholds and combinatorial smart-matrix configurations
    content-generator.js  # Stress-test profile mock JSON generator
    audit.js              # Playwright browser automation suite and data mocker
    screenshot.js         # Port-independent preview capture and PDF-to-PNG rendering via PDF.js
    export-pdf.js         # Playwright letter-sized PDF exporter
    compare.js            # HTML5 canvas visual comparator
    report.js             # HTML, JSON, and CSV report compilers
    baselines/            # Approved golden design baseline screenshots (created via --update-baseline)
      [template_name]/
        case_a_preview.png
        case_a_pdf.png
```

---

## Baseline Management

When changing a template's default style, typography margins, or color profiles, baselines will show diff mismatches. To update and approve these changes as the new gold standard:
1. Fire up the preview server (`npm run preview`).
2. Run the update script:
   ```bash
   npm run visual:update-baseline
   ```
This updates the reference files in the `baselines/` directory.

---

## Interpreting Reports
Following execution, reports are compiled in `./audit-output/`:
- **`report.html`**: Interactive validation dashboard highlighting pass/fail rates, execution speed, average diff mismatches, and side-by-side comparison overlays.
- **`report.json`**: Machine-readable statistics for CI/CD checks.
- **`report.csv`**: Tabular dataset detailing template configurations and diff percentages.
- **`coverage.md`**: Coverage log indicating design cases mapped to each template rendering path.
