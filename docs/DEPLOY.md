# Deploying PixelProof

> **Live:** [https://pixelproof.tanisheesh.in](https://pixelproof.tanisheesh.in) · **Host:** Vercel (Frontend) + Render (Backend API) · **Auto-deploy:** on push to `main`

For local development, see [SETUP.md](SETUP.md).

---

## 1. Architecture in production

| Piece | Runs on | Notes |
|---|---|---|
| Frontend Workbench | Vercel | Next.js 16 App Router (`frontend/` directory), includes automatic client-side DIP fallback |
| DIP Forensic API | Render | Python FastAPI service (`backend/` directory), stateless in-memory OpenCV/SciPy processing |
| DNS | GoDaddy | `pixelproof.tanisheesh.in` → CNAME to Vercel |

---

## 2. Environment variables

Set these in the host dashboard (never commit them). Names and sources are in [`.env.example`](../.env.example).

| Variable | Required | Where it's set |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Vercel → Project → Settings → Environment Variables (set to Render backend URL, e.g. `https://pixelproof-api.onrender.com`) |
| `CORS_ORIGINS` | ❌ | Render → Service → Environment (defaults to `*`, or set to `https://pixelproof.tanisheesh.in`) |

> After changing an env var, **redeploy**. Running deployments don't pick up new values.

---

## 3. First-time deploy

### Option A: Vercel (Frontend)

1. [vercel.com/new](https://vercel.com/new) → import `tanisheesh/PixelProof`
2. Framework preset: `Next.js` · Root directory: `frontend`
3. Add `NEXT_PUBLIC_API_URL` from section 2
4. Deploy. Every push to `main` now deploys to production, and every PR gets a preview URL.

### Option B: Render (Backend DIP Engine)

1. [dashboard.render.com](https://dashboard.render.com) → New → Web Service → connect `tanisheesh/PixelProof`
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add `CORS_ORIGINS` from section 2, then deploy.

### Option C: Docker (self-host backend)

```bash
cd backend
docker build -t pixelproof-backend .
docker run -d -p 8000:8000 pixelproof-backend
```

---

## 4. Custom domain

`pixelproof.tanisheesh.in` is wired with the setup toolkit:

```powershell
.\scripts\setup-subdomain.ps1 -Subdomain "pixelproof" -Platform Vercel -VercelProject "pixelproof"
```

Manual fallback: add the domain in the Vercel dashboard, then create a GoDaddy CNAME `pixelproof` → `cname.vercel-dns.com`. HTTPS certificates are issued automatically once DNS resolves (2–10 min).

---

## 5. Verify a deploy

- [ ] `https://pixelproof.tanisheesh.in` loads with no console errors
- [ ] `GET /api/health` on the backend returns `200 OK` with `"layers_active": 7`
- [ ] Selecting each of the 6 benchmark presets updates the split-screen heatmap, 7 layer cards, and DIP Math Drawer
- [ ] Opening the Live Tamper Sandbox, applying a Copy-Move or Splice edit, and clicking **Analyze Forgery** flags the tampered region

---

## 6. Rollback

| Host | How |
|---|---|
| Vercel | Dashboard → Deployments → pick the last good one → **Promote to Production** (or `vercel rollback`) |
| Render | Service → Events → last good deploy → **Rollback** |

After rolling back, note it in a commit or PR so the next push doesn't silently re-ship the broken version.

---

## 7. Monitoring & logs

- **Logs:** Vercel → Project → Logs / Render → Service → Logs
- **API Docs:** `<backend-url>/api-docs` (Swagger UI)
- **Dependencies:** Dependabot opens weekly update PRs and a maintenance report is emailed every week (see `.github/workflows/`)

---

## Known production limitations

- Render free tier cold-starts in ~30s after 15 minutes of inactivity. During cold start, the frontend automatically falls back to the in-browser Canvas DIP engine so the user experience never blocks or errors out.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hey%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
