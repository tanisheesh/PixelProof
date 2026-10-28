# Contributing to PixelProof

Thanks for taking the time to contribute! Bug reports, fixes, docs improvements and feature ideas are all welcome.

---

## Before you start

- **Found a bug?** Open a [bug report](../../issues/new?template=bug_report.yml). Search existing issues first.
- **Have an idea?** Open a [feature request](../../issues/new?template=feature_request.yml) before writing code, so we can agree on the approach.
- **Found a security issue?** Don't open a public issue. Follow [SECURITY.md](SECURITY.md).
- Small fixes (typos, docs, obvious bugs) can go straight to a pull request.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Local setup

Full instructions are in [docs/SETUP.md](docs/SETUP.md). Short version:

```bash
git clone https://github.com/tanisheesh/PixelProof
cd PixelProof

# Backend (Python FastAPI DIP Engine)
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (Next.js Workbench)
cd ../frontend && npm install
npm run dev
```

---

## Workflow

1. **Fork** the repo and create a branch from `main`:

   | Branch prefix | Use for |
   |---|---|
   | `feat/` | new feature, e.g. `feat/prnu-sensor-fingerprint` |
   | `fix/` | bug fix, e.g. `fix/ela-chroma-scaling` |
   | `docs/` | documentation only |
   | `chore/` | tooling, config, dependencies |
   | `refactor/` | code change with no behaviour change |

2. **Make your change.** Keep it focused, one feature or fix per PR.
3. **Check it locally** before pushing:

   ```bash
   cd backend && pytest -v
   cd ../frontend && npm run lint && npm run typecheck && npm run build
   ```

4. **Open a pull request** against `main`. The PR template will guide you.

---

## Commit messages

Commits follow an emoji-prefixed format:

```
<emoji> [#issue] [scope:] <message in present tense, lowercase>
```

| Emoji | Type | Example |
|---|---|---|
| ✨ | New feature | `✨ #12 add wavelet db4 noise estimator` |
| 🐛 | Bug fix | `🐛 dip: clamp zero-variance wiener denominator` |
| 🎊 | Improvement | `🎊 speed up 16x16 dct block sorting` |
| ♻️ | Refactor | `♻️ extract morphological fusion into module` |
| 📚 | Docs | `📚 add deploy guide` |
| 🧪 | Tests | `🧪 cover copy-move shift vector clustering` |
| 🔨 | Chore / config | `🔨 bump node to 22 in ci` |
| 👆 | Dependency update | `👆 upgrade next to 16.2` |
| 🔒 | Security | `🔒 enforce 15mb upload size limit` |
| 💀 | Code deletion | `💀 remove unused legacy helper` |

Breaking changes add a line `🚨 BREAKING CHANGE: <what breaks>` in the commit body.

---

## Code style

- Run the formatter/linter before committing. CI runs the same checks.
- Follow the existing file structure and patterns.
- TypeScript: `camelCase` variables and functions, `PascalCase` components. Python: `snake_case` files, functions and variables, `PascalCase` classes.
- No secrets in code.
- Update docs when behaviour or setup changes.

---

## Pull request checklist

- [ ] Branch is up to date with `main`
- [ ] Lint, typecheck, build and tests pass locally
- [ ] Commits follow the format above
- [ ] Docs / `CHANGELOG.md` updated if needed
- [ ] PR description explains **what** and **why**

PRs are reviewed as soon as possible. Feedback is about the code, never the person.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

<h3>Krish Gohel</h3>

<a href="https://github.com/krish-codess"><img src="https://img.shields.io/badge/GitHub-krish--codess-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:krishnakulgohel544@gmail.com"><img src="https://img.shields.io/badge/Email-krishnakulgohel544%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
