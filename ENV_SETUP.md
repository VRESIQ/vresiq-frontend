# VRESIQ Frontend — Environment Setup Guide

This document covers all details regarding the frontend environment configuration parameters, security considerations, and local credentials.

---

## 🔑 Environment Variables Overview

Vite uses prefix-based environment variables. Only variables prefixed with `VITE_` are exposed to the browser. Do not include raw admin passwords or database credentials here.

| Variable Name | Required | Default/Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:8081` | The root REST API URL pointing to the Spring Boot backend server. |
| `VITE_RAZORPAY_KEY_ID` | **Yes** | `rzp_test_your_key` | Public Razorpay key ID for payment processing overlay. Use `rzp_live_` prefix for production. |
| `VITE_OPENROUTER_API_KEY` | **Yes** | `sk-or-v1-your_key` | OpenRouter chat completions API key used for the AI Resume Bullets rewrite wizard. |

---

## 🛠️ Step-by-Step Local Configuration

1. **Locate Example File**:
   Locate `resume-builder-frontend/.env.example` inside the frontend directory. This contains clean placeholder templates.

2. **Clone Configuration**:
   Create a new local copy of the file named `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Provide Valid Keys**:
   - **Backend API**: If running backend locally, use `http://localhost:8081`.
   - **Razorpay Keys**: Obtain these keys from your Razorpay Dashboard in Test Mode.
   - **OpenRouter Keys**: Create a standard developer token on `openrouter.ai`.

4. **Verify Safety**:
   Ensure `.env` is **never** added to your staging area:
   ```bash
   git status
   ```
   The `.env` file should be completely hidden/ignored under the untracked file list (governed by `.gitignore`).

---

## 🔒 Security Best Practices
- **Never Check In `.env`**: The gitignored files list is your primary line of defense. Ensure `.env` is present in the local `.gitignore` at all times.
- **Production Tokens**: Never share production-ready `rzp_live_` credentials in messaging apps or public forums. 
- **Rotation**: In case of a token leak, immediately deactivate the compromised token from the respective dashboard (Razorpay or OpenRouter) and issue a replacement.
