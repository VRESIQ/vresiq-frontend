# VResIQ — Frontend Web Application

[![Live Demo](https://img.shields.io/badge/%F0%9F%8C%90_Live-Website-blue?style=for-the-badge)](https://vresiq.app)
[![Backend Repository](https://img.shields.io/badge/%E2%9A%99_Backend-Repository-orange?style=for-the-badge)](https://github.com/vresiq/vresiq-backend)
[![License](https://img.shields.io/badge/%F0%9F%93%9C_License-MIT-green?style=for-the-badge)](https://github.com/vresiq/vresiq-frontend/blob/main/LICENSE)

The React-based single page application (SPA) client for VResIQ SaaS, built using Vite, HSL-tailored CSS variables, and Playwright Visual testing.

---

## Core Client Features

- **Interactive Workspace**: Drag-and-drop templates, real-time styling updates, and collapsible panels.
- **25 Standard Templates**: Styled with custom CSS grids to keep document parsing ATS-compliant.
- **Styling Customizations**: Standard vs professional link styles, 3 header modes, HSL default template colors, and high-density line margins.
- **ATS Checker Dashboard**: Live scoring feedback displaying warnings for layout risks, section order, keyword lists, and name formatting.

---

## Tech Stack

* **Core**: React SPA, Vite (build engine)
* **API Requests**: Axios HTTP Client (configured with interceptors to manage access token refresh rotations)
* **Testing**: Playwright visual regression framework
* **Styling**: Vanilla CSS

---

## Project Structure

```
vresiq-frontend/
  src/
    components/
      common/          # Buttons, toggles, form fields
      ResumePreview/   # Custom rendering layouts for templates
      Decoratives/     # Custom color and styles config panels
    pages/
      Dashboard.jsx    # User dashboard list
      ResumeEditor.jsx # Unified editor environment
    utils/
      fonts.js         # Single source of truth for typography
      atsScorer.js     # Client-side ATS validator
  tools/
    visual-regression/ # Visual validation and baseline framework
```

---

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Launch dev environment**:
   ```bash
   npm run dev
   ```
3. **Execute visual audit test framework**:
   ```bash
   npm run visual:test
   ```

---

## Environment Variables

Configure a `.env` file in the root:
```env
VITE_API_URL=http://localhost:8081
VITE_RAZORPAY_KEY_ID=rzp_test_...
```
