<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/10-xlcXpdBwHEm3JqWBZw3n--zoVHVorL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` (not committed) based on `.env.example` and set `GEMINI_API_KEY`
3. Run the app (frontend + local API):
   `npm run dev`

## Deploy on Vercel

1. Import this repository in Vercel
2. Set the following Environment Variables (Project Settings -> Environment Variables):
   - `GEMINI_API_KEY`
3. Build & Output:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

The serverless endpoints are available under:
- `/api/health`
- `/api/create-payment`
- `/api/gemini/generate`
