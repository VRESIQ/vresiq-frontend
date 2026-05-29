# VRESIQ Frontend — Project Structure

This document outlines the directory layout, module roles, and codebase architecture of the VRESIQ React frontend application.

---

## 📂 Logical Directory Tree

```text
vresiq-frontend/
├── public/                 # Static assets copied directly to the build root
│   ├── robots.txt          # Crawling guidelines (linked to vresiq sitemap)
│   └── sitemap.xml         # XML Sitemap for vresiq.app domain indexing
├── src/
│   ├── api/                # Axios API services to communicate with the Spring Boot backend
│   │   └── index.js        # Auth, Resume, Payment, and Verify API functions
│   ├── components/         # Reusable presentation and functional React components
│   │   ├── AiRewriteModal.jsx  # AI Rewrite Wizard modal (Tone selection)
│   │   ├── NavLogo.jsx         # Branding logo (Italic VRESIQ mark)
│   │   ├── ResumePreview.jsx   # Vector-perfect template renderer with watermark
│   │   └── ThemeToggle.jsx     # Light/Dark mode switcher button
│   ├── context/            # React Contexts for global state management
│   │   └── AuthContext.jsx # Global JWT Authentication state and user profile manager
│   ├── hooks/              # Custom React Hooks
│   │   ├── useRazorpay.js  # Embedded script loader & payment orchestrator
│   │   └── useTheme.js     # local-storage and system theme sync hook
│   ├── pages/              # Primary route-level page components
│   │   ├── AdminDashboard.jsx  # Admin-only user management & analytics panel
│   │   ├── Dashboard.jsx   # Main user workspace to view and create resumes
│   │   ├── Home.jsx        # Landing page with interactive 3D elements
│   │   ├── Login.jsx       # Auth login page
│   │   └── VerifyEmail.jsx # Verification landing page
│   ├── utils/              # Client-side utility helpers
│   │   ├── fonts.js        # Google fonts loader & CSS variables generator
│   │   └── inputSanitizers.js # Input filters for secure XSS-free fields
│   ├── App.jsx             # Main router configuration & layout structure
│   └── main.jsx            # Entry point initializing ReactDOM and global styles
├── .env                    # Local configuration file (GIT-IGNORED)
├── .env.example            # Environment template for developers
├── .gitignore              # Ignores .env, node_modules, dist, and OS cache
├── package.json            # Project dependencies and npm scripts
└── vite.config.js          # Vite optimization & compiler configuration
```

---

## 🏗️ Architecture Design

### 🔑 Authentication Flow
The application uses **JWT Authentication**. Upon successful login or registration, the JWT token is saved in the memory state of the `AuthContext` and stored securely, ensuring all outgoing requests are authorized using standard HTTP interceptors.

### 🎨 Design System
Styling is completely driven by a customized HSL-based CSS variables layout inside `brand.css` (inside styles) and localized pages stylesheets:
- Theme colors dynamically map HSL values on dark mode toggle `[data-theme="dark"]`.
- Components share clean variables for typography (`var(--font-family)`), borders, and radius definitions.

### 📁 PDF Generation Model
Instead of low-quality server canvas renders, VRESIQ generates PDFs directly in the browser via `html2pdf.js`, forcing print-media scaling variables to output clean vector text sheets matching the desktop layouts 1:1.
