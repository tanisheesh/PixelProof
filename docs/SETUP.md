# Local Setup — PixelProof

> **Just want to try it?** Use the live demo at [https://pixelproof.tanisheesh.in](https://pixelproof.tanisheesh.in) — no setup needed.
> This guide is for running PixelProof locally or self-hosting it.

---

## Prerequisites

- Node.js 20+ and npm
- Python 3.12+ and `pip`

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/PixelProof
cd PixelProof
```

### Install Backend (Python FastAPI DIP Engine — no `venv` needed)

```bash
cd backend
pip install -r requirements.txt
```

### Install Frontend (Next.js Workbench)

```bash
cd ../frontend
npm install
```

---

## 2. Run locally (Zero `.env` configuration needed)

PixelProof requires **no environment variables, no API keys, and no database setup**.

Start the FastAPI DIP backend in one terminal (runs on port `8000` with Swagger docs at `http://localhost:8000/api-docs`):

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Start the Next.js frontend in a second terminal:

```bash
cd frontend
npm run dev
```

PixelProof will be running at `http://localhost:3000`.

---

## 3. Run tests & academic benchmark evaluation

```bash
# Run unit & API integration tests across all 7 DIP layers
cd backend
pytest -v

# Run the 6-case forensic benchmark evaluation table
python scripts/evaluate_benchmark.py
```

---

## 4. Deploy to production

See [DEPLOY.md](DEPLOY.md) for production deployment, custom domain and rollback steps.

---

## Known local-only limitations

- If you run only the Next.js frontend without starting the Python FastAPI server on port `8000`, the workbench automatically switches to the **Client Canvas DIP** engine so all UI features remain interactive.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hey%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
