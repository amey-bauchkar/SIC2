# MandiMitra — Zero-Conflict Collaboration Guide 🌾

This guide ensures all 4 team members can add features, experiment, and push code in parallel with **ZERO git merge conflicts**.

---

## 👥 1. Disjoint Feature Zones (No Overlapping Files)

Every member works in their dedicated directory. When you stay inside your zone, Git merges will always be **100% automatic**:

| Team Member | Your Safe Working Zone | What You Build Here |
|---|---|---|
| **Amay** | `src/backend/`<br>`src/core/`<br>`src/data-pipeline/` | Backend REST endpoints, AI/ML models, forecasting algorithms, data pipeline, and `/data/processed` ingestion. |
| **Janhvi** | `src/frontend/styles/`<br>`src/frontend/components/`<br>`src/frontend/shell/` | CSS design tokens (`tokens.css`), App layout, shared UI primitives (`DecisionCard`, `QualityBadge`, `StatCard`), router, and global animations. |
| **Tanmay** | `src/frontend/features/entry/`<br>`src/frontend/features/decision/`<br>`src/frontend/features/evidence/` | Commodity & location entry flow, primary decision card view, and granular "Why?" breakdown screen. |
| **Purva** | `src/frontend/features/markets/`<br>`src/frontend/features/settings/`<br>`src/frontend/features/backtest/` | Candidate mandis shortlist, interactive cost & radius settings, and empirical backtest validation screen. |

---

## 🚀 2. How to Add Any New Feature Without Resistance

1. **Add new files freely inside your folder**:
   - Need a helper, a new sub-view, or an interactive component? Create a new file directly in your folder (e.g. `src/frontend/features/markets/DistrictFilter.ts` or `src/core/ml-model.ts`).
   - You never need permission to add or modify files in your zone.

2. **Connecting new frontend features**:
   - The router supports dynamic registration: `router.registerRoute('/your-path', renderYourView)`.
   - The reactive store is available everywhere: `import { store } from '../../state/store';`.
   - The API client is available everywhere: `import { apiClient } from '../../api-client';`.
   - Shared UI atoms are available: `renderDecisionCard()`, `renderQualityBadge()`, `renderStatCard()`.

3. **Connecting new backend endpoints**:
   - Add new controllers in `src/backend/controllers.ts` or add new files in `src/backend/`.
   - Mount them in `src/backend/server.ts`.

---

## 🔄 3. Git Workflow (Conflict Prevention)

1. **Always work on your own branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/<your-name>-<feature>
   ```

2. **Commit and push your branch**:
   ```bash
   git add .
   git commit -m "feat(module): your clear message"
   git push -u origin feat/<your-name>-<feature>
   ```

3. **Merge into `main`**:
   - Create a Pull Request on GitHub or merge locally:
     ```bash
     git checkout main
     git pull origin main
     git merge feat/<your-name>-<feature>
     git push origin main
     ```
   - Since your files are completely separated by directory, **there are no merge conflicts**.

---

## 🔒 4. Shared Ground Rules

- **Do NOT touch files in other teammates' feature folders.** If you need a change in a shared file (like `src/contracts/` or `tokens.css`), coordinate with the owner.
- **Do NOT touch or delete the `/data` folder.** It is used by the parallel data track.
- **Always keep real-data integrity.** Never commit fake data as project data.
