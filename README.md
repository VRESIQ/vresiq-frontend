# VResIQ Frontend

[![Root Docs](https://img.shields.io/badge/Root%20Docs-Read%20me-111827?style=for-the-badge)](../README.md)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?style=for-the-badge)](../vresiq-backend/README.md)
[![License](https://img.shields.io/badge/License-MIT-111827?style=for-the-badge)](../LICENSE)

React + Vite client for VResIQ, the ATS-aware resume builder.

## What It Does

- Provides the landing page, auth flow, dashboard, and resume editor
- Renders live resume previews with ATS-aware customization controls
- Connects to the backend API for persistence, export, and email sharing
- Includes visual regression tooling for layout and PDF checks

## Tech Stack

| Area | Stack |
| --- | --- |
| UI | React, Vite |
| Networking | Axios |
| Routing | React Router |
| QA | Playwright visual regression |
| Styling | CSS |

## Screenshots

| View | Image |
| --- | --- |
| Landing page | [homepage.png](./homepage.png) |
| Resume editor | [editor-audit.png](./editor-audit.png) |
| Print mode | [print-mode.png](./print-mode.png) |

## Setup

```bash
npm install
npm run dev
```

## Environment

Create a `.env` file in this directory.

```env
VITE_API_URL=http://localhost:8081
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

## Visual Regression

```bash
npm run visual:test
npm run visual:update-baseline
```

More detail lives in [tools/visual-regression/README.md](./tools/visual-regression/README.md).

