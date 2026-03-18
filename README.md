# TB Screening Form

Custom web form with proper multi-select dropdowns that submits to KoboToolbox.
API token is hidden server-side via Netlify Functions.

## Deploy to Netlify

### Step 1: Push to GitHub
```bash
cd tb-screening-form
git init
git add .
git commit -m "TB screening form"
git remote add origin https://github.com/YOUR_USERNAME/tb-screening-form.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up (free) with GitHub
2. Click "Add new site" → "Import an existing project"
3. Select your GitHub repo `tb-screening-form`
4. Build settings are auto-detected from `netlify.toml` — just click Deploy

### Step 3: Add secrets as environment variables
1. In Netlify dashboard → Site settings → Environment variables
2. Add these:
   - `KOBO_API_TOKEN` = your KoboToolbox API token (from Account Settings → Security)
   - `KOBO_ASSET_UID` = your form's asset UID (from the project URL)
   - `KOBO_SERVER` = `https://kf.kobotoolbox.org` (or `https://kobo.humanitarianresponse.info`)
3. Redeploy the site

### Step 4: Share the URL
Your form is live at `https://your-site-name.netlify.app`
Share this URL with anyone — works on desktop and mobile with proper dropdowns.
