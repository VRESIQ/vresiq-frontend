# VRESIQ Frontend — Production Deployment Guide

This document describes how to deploy the VRESIQ React frontend to production environments like **Vercel**, **Netlify**, or standard Linux web servers.

---

## ⚡ Deployment Platforms

### Option A: Vercel (Recommended)
Vercel is the easiest and most performant hosting platform for Vite-based React single page applications.

1. Install the Vercel CLI or connect your Git repository directly in the Vercel dashboard.
2. Configure the project settings as follows:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
3. Configure the environment variables under project settings:
   - `VITE_API_BASE_URL` = `https://api.vresiq.app` (your production backend URL)
   - `VITE_RAZORPAY_KEY_ID` = `rzp_live_your_live_key`
   - `VITE_OPENROUTER_API_KEY` = `sk-or-v1-your_openrouter_api_key`
4. Push to branch `main` to trigger a clean production deployment.

> [!TIP]
> **Single Page Application Routing**: Ensure React Router works correctly on Vercel by creating a `vercel.json` file in the root of the project with rewrites:
> ```json
> {
>   "rewrites": [
>     { "source": "/(.*)", "destination": "/" }
>   ]
> }
> ```

---

### Option B: Netlify
Netlify provides simple, direct continuous integration hosting.

1. Connect your repository on Netlify.
2. Select the following settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Under **Site Configuration** > **Environment Variables**, add:
   - `VITE_API_BASE_URL`
   - `VITE_RAZORPAY_KEY_ID`
   - `VITE_OPENROUTER_API_KEY`
4. Trigger the deploy.

> [!TIP]
> **React Routing Support**: To prevent 404 errors on browser page refreshes, create a file named `_redirects` inside the `public/` directory containing:
> ```text
> /*    /index.html   200
> ```

---

### Option C: Docker & Nginx VPS
To host on self-managed virtual private servers (AWS EC2, DigitalOcean, Linode):

1. Write a clean Nginx server block to host static files from the `dist/` directory.
2. Example Nginx server config block:
   ```nginx
   server {
       listen 80;
       server_name vresiq.app www.vresiq.app;
       root /var/www/vresiq/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable caching for static assets
       location ~* \.(?:css|js|woff2?|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```
3. Compile locally (`npm run build`) and copy files to Nginx root, or set up Docker:
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

---

## 🔒 Post-Deployment Checks
- Check browser console logs for any mixed-content (HTTP vs HTTPS) block errors.
- Confirm all images load correctly from the backend Cloudinary assets.
- Verify that registration triggers email confirmation containing correct links to `vresiq.app`.
