
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
