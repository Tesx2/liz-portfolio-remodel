# Liz Kendi — Portfolio & Studio CMS

A high-performance portfolio and Cloudflare R2 media management system for graphic design and motion graphic artist Liz Kendi.

---

## 1. Setting Up the Admin Password Hash in Netlify

### Step 1: Generate your bcrypt hash locally
Run the `hash-password` script with your desired password (minimum 10 characters):

```bash
npm run hash-password "your_secure_password"
```

The script will output a 60-character bcrypt hash (cost 12) starting with `$2a$`, `$2b$`, or `$2y$`.

### Step 2: Set `ADMIN_PASSWORD_HASH` in Netlify
1. Log in to your **Netlify Dashboard** and select your project (`lizkendiportfolio`).
2. Go to **Site configuration** > **Environment variables**.
3. Under Environment variables, add or edit **`ADMIN_PASSWORD_HASH`**:
   - **Key**: `ADMIN_PASSWORD_HASH`
   - **Value**: Paste the exact 60-character hash (without quotes or leading/trailing spaces).
   - **Deploy contexts**: Ensure **All deploy contexts** (Production, Deploy Previews, Branch deploys) is selected.
   - **Scopes**: Builds, Functions, Runtime.
4. Click **Save**.

### Step 3: Trigger a Redeploy
Netlify Functions load environment variables at build/deploy time.
1. In Netlify, go to the **Deploys** tab (Hammer 🔨 icon on the left).
2. Click the **Trigger deploy** dropdown button in the top right.
3. Select **Clear cache and deploy site**.
4. Once deployed, log in to the admin panel using your chosen password.

---

## 2. Environment Variables Checklist

Ensure these variables are configured in Netlify:

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD_HASH` | 60-character bcrypt hash (cost 12) |
| `JWT_SECRET` | Random string with at least 32 characters |
| `PUBLIC_MEDIA_BASE_URL` | Public custom domain for Cloudflare R2 bucket (e.g. `https://media.yourdomain.com`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token Secret Access Key |
| `R2_BUCKET` | Cloudflare R2 bucket name (`portfolio-media`) |
| `NETLIFY_BUILD_HOOK_URL` | (Optional) Build hook for 1-click production re-renders |

---

## 3. Local Development

```bash
npm install
npm run dev
npm run build
```
