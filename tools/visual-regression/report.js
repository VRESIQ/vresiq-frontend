import fs from 'fs';
import path from 'path';

/**
 * Generates JSON, HTML, CSV, and Coverage markdown reports summarizing visual diff audits
 */
export function generateReports(results, outputDir, durationMs) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = total - passed;
  const avgDiff = total > 0 ? (results.reduce((sum, r) => sum + r.diffPercentage, 0) / total) : 0;
  
  const summary = {
    generatedAt: new Date().toISOString(),
    executionTimeMs: durationMs,
    executionTimeSec: (durationMs / 1000).toFixed(1) + 's',
    totalCases: total,
    passed,
    failed,
    passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '100%',
    averageDiffPercentage: avgDiff.toFixed(4) + '%',
    results
  };

  // 1. Write JSON Report
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(summary, null, 2), 'utf-8');

  // 2. Write CSV Report
  let csvContent = "Template,Case ID,Font,Accent,Density,Hyperlinks,Photo,Content Profile,Diff %,Status\n";
  results.forEach(r => {
    csvContent += `"${r.template}","${r.caseId}","${r.config.fontPairing}","${r.config.accentColor}","${r.config.highDensity}","${r.config.linkStyle}","${r.config.photo}","${r.config.contentProfile.type}",${r.diffPercentage.toFixed(4)},"${r.status}"\n`;
  });
  fs.writeFileSync(path.join(outputDir, 'report.csv'), csvContent, 'utf-8');

  // 3. Write Coverage Report
  const coverageMarkdown = `
# Rendering Pipeline Coverage Report

This report explains the combinatorial test matrix used by the VResIQ Visual Regression Framework.

## Matrix Overview
We utilize a combinatorial pairwise coverage layout designed to exercise every major rendering configuration parameter with minimum redundancy. 

- **Total Templates Audited**: 25
- **Header Styles Covered**: Minimal, Card, Full Bleed
- **Typography Families Covered**: Default + 5 Selectable Typography Configurations
- **Accent Customizations Covered**: Default + 5 Vibrant Styling Accents
- **Spacing Densities Covered**: Default vs High Density (ON/OFF)
- **URL Embed Styling Covered**: Professional Hyperlinks vs Standard Underlined URLs
- **Layout Photo Embeds Covered**: Circle avatar framing vs No Photo rendering
- **Content Profiles Checked**: 6 distinct content payloads (from very short single-page to large multi-page profiles with missing/extended sections)

## Design Case Strategy
For every template, we run 3 target configurations:
1. **Case A (Baseline / Standard)**: Sets default template font/accent parameters, a variable header style (Minimal/Card/Full Bleed), and standard content depth to establish standard template behavior.
2. **Case B (Alternative Typography & Style)**: Switches custom font, overrides accent colors to vibrant options, forces High Density, toggles Standard URL underlining, and loads a short single-page profile to verify container bounds.
3. **Case C (Extended Portfolio / Edge Cases)**: Tests robust multi-page content layouts, long email/LinkedIn URLs, custom accents, and profile avatar variations to audit text wrapping and header alignment.
`;
  fs.writeFileSync(path.join(outputDir, 'coverage.md'), coverageMarkdown, 'utf-8');

  // 4. Write HTML Report
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VResIQ - Automated Validation Report</title>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d0f12;
      color: #e5e7eb;
      margin: 0;
      padding: 24px;
    }
    .header {
      background: linear-gradient(135deg, #1f2937, #111827);
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #374151;
      margin-bottom: 24px;
    }
    h1 { margin: 0 0 12px; color: #ffffff; font-size: 1.8rem; }
    .meta { font-size: 0.9rem; color: #9ca3af; margin-bottom: 20px; }
    .stats { display: flex; gap: 16px; margin-bottom: 20px; }
    .card {
      background: #1f2937;
      padding: 16px 24px;
      border-radius: 8px;
      border: 1px solid #374151;
      flex: 1;
      text-align: center;
    }
    .card h3 { margin: 0 0 8px; color: #9ca3af; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .card .val { font-size: 2rem; font-weight: 700; color: #ffffff; }
    .card.pass .val { color: #34d399; }
    .card.fail .val { color: #f87171; }
    .table-container {
      background: #111827;
      border-radius: 8px;
      border: 1px solid #374151;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 16px; border-bottom: 1px solid #374151; }
    th { background: #1f2937; font-weight: 600; color: #ffffff; }
    tr:hover { background: #1f2937; }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.pass { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
    .badge.fail { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
    .detail-btn {
      background: #3b82f6;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .detail-btn:hover { background: #2563eb; }
    .compare-container {
      display: none;
      margin-top: 24px;
      background: #111827;
      border-radius: 8px;
      border: 1px solid #374151;
      padding: 24px;
    }
    .compare-images {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    .image-box {
      flex: 1;
      text-align: center;
      background: #1f2937;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #374151;
    }
    .image-box h4 { margin: 0 0 12px; color: #ffffff; }
    .image-box img { max-width: 100%; border-radius: 4px; border: 1px solid #4b5563; background: #ffffff; }
  </style>
</head>
<body>
  <div class="header">
    <h1>VResIQ Visual Regression & PDF Parity Validation</h1>
    <div class="meta">Generated: ${summary.generatedAt} | Duration: ${summary.executionTimeSec}</div>
    <div class="stats">
      <div class="card">
        <h3>Total Checked</h3>
        <div class="val">${summary.totalCases}</div>
      </div>
      <div class="card pass">
        <h3>Passed</h3>
        <div class="val">${summary.passed}</div>
      </div>
      <div class="card fail">
        <h3>Failed</h3>
        <div class="val">${summary.failed}</div>
      </div>
      <div class="card">
        <h3>Average Diff</h3>
        <div class="val">${summary.averageDiffPercentage}</div>
      </div>
    </div>
  </div>

  <h2>Scenario Audit Log</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Template</th>
          <th>Case</th>
          <th>Font</th>
          <th>Accent</th>
          <th>Density</th>
          <th>Diff %</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((r, idx) => `
          <tr>
            <td><strong>${r.template}</strong></td>
            <td><code style="color: #60a5fa;">${r.caseId}</code></td>
            <td><code>${r.config.fontPairing}</code></td>
            <td><span style="display:inline-block;width:10px;height:10px;background:${r.config.accentColor};border-radius:50%;margin-right:4px;"></span><code>${r.config.accentColor}</code></td>
            <td><code>${r.config.highDensity}</code></td>
            <td>${r.diffPercentage.toFixed(3)}%</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td><button class="detail-btn" onclick="showCompare('${idx}')">View Comparison</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div id="compare-section" class="compare-container">
    <h3 id="compare-title">Comparison</h3>
    <div class="compare-images">
      <div class="image-box">
        <h4>Baseline / Live Preview</h4>
        <img id="img-preview" src="" alt="Preview">
      </div>
      <div class="image-box">
        <h4>Rendered PDF</h4>
        <img id="img-pdf" src="" alt="PDF Page">
      </div>
      <div class="image-box">
        <h4>Visual Diff (magenta indicates deviations)</h4>
        <img id="img-diff" src="" alt="Visual Diff">
      </div>
    </div>
  </div>

  <script>
    const cases = ${JSON.stringify(results)};
    function showCompare(idx) {
      const c = cases[idx];
      document.getElementById('compare-section').style.display = 'block';
      document.getElementById('compare-title').innerText = 'Comparison: ' + c.template + ' (' + c.caseId + ')';
      document.getElementById('img-preview').src = c.previewImage;
      document.getElementById('img-pdf').src = c.pdfImage;
      document.getElementById('img-diff').src = c.diffImage;
      
      // Scroll to view
      document.getElementById('compare-section').scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>
  `;
  fs.writeFileSync(path.join(outputDir, 'report.html'), htmlContent, 'utf-8');
}
