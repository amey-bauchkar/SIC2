# MandiMitra — Team Collaboration & Engineering Protocol

## 1. Team Ownership Boundaries

| Team Member | Role | Primary Physical Ownership | Strictly Prohibited Modifications |
|---|---|---|---|
| **Amay** | Team Lead / Backend & AI | `/src/backend`, `/src/core`, `/src/data-pipeline`, `/src/contracts`, `/data/processed` integration, root backend scripts | Modifying frontend feature screens or CSS design tokens without Janhvi's consent. |
| **Janhvi** | Frontend Lead | `/src/frontend/shell`, `/src/frontend/components/shared`, `/src/frontend/styles`, `/src/frontend/state`, root frontend layout | Modifying backend controllers, ML engines, or feature logic inside Tanmay/Purva's directories. |
| **Tanmay** | Frontend Feature Engineer | `/src/frontend/features/entry`, `/src/frontend/features/decision`, `/src/frontend/features/evidence` | Modifying `/src/frontend/components/shared`, `/src/frontend/styles/tokens.css`, or Purva's feature screens. |
| **Purva** | Frontend Feature Engineer | `/src/frontend/features/markets`, `/src/frontend/features/settings`, `/src/frontend/features/backtest` | Modifying `/src/frontend/components/shared`, `/src/frontend/styles/tokens.css`, or Tanmay's feature screens. |

---

## 2. Shared-File Ownership & Protection

1. **Contract Immutability**: All files in `/src/contracts/` are strictly owned by **Amay**. No frontend engineer may alter interface definitions, request schemas, or response shapes unilaterally.
2. **Design Tokens & Shell**: All files in `/src/frontend/styles/` and `/src/frontend/components/shared/` are strictly owned by **Janhvi**. If Tanmay or Purva require a new reusable variant or token, they must submit a token request to Janhvi rather than inlining overrides.
3. **Data Directory Protection**: The `/data` directory (raw and processed) is strictly managed by the data track and integrated solely by **Amay**. **NEVER touch, move, delete, or restructure `/data`.**

---

## 3. Git Collaboration & Branching Protocol

1. **Branch Naming Standard**:
   - `feat/amay-core-engine`
   - `feat/janhvi-design-system`
   - `feat/tanmay-decision-flow`
   - `feat/purva-markets-backtest`
2. **No Direct Pushes to `main`**: All features merge into `main` via PR after passing smoke tests and contract verification.
3. **Frequent Micro-Commits**: Commit working increments locally. Avoid large, untraceable PR dumps.
4. **Rebase vs. Merge**: Pull changes with `git pull --rebase origin main` before opening a pull request to keep history linear. Do not execute destructive force-pushes (`git push --force`) on shared branches.

---

## 4. Contract Protection & Change Procedure

If an API contract or domain schema requires modification:
1. **Immediate Implementation Halt**: Any feature actively developing against the target contract must pause.
2. **Trigger Contract Change Event**: The requester documents:
   - Affected producers (Backend controller, Mock fixtures)
   - Affected consumers (Tanmay's / Purva's feature components)
   - Detailed justification for the schema diff.
3. **Canonical Schema Update**: Amay updates `/src/contracts/*.ts` and development mock fixtures.
4. **Resumption**: Implementation resumes only after all four members confirm synchronization.

---

## 5. Conflict Prevention & Isolation

- **Directory-Based Sandboxing**: Each member works inside their dedicated folder. There are ZERO shared feature files.
- **Mock-First Development**: Frontend developers use typed development fixtures (`/src/frontend/fixtures`) adhering 100% to `/src/contracts` until API integration checkpoints. No developer is blocked waiting for backend endpoints to be deployed.

---

## 6. Scope Freeze & Change Management

The scope defined in `docs/solution.md` is **FROZEN**.
- **No Rogue Features**: Capabilities marked as `DEFERRED` (e.g., auth, notifications, live OSRM, deep learning) must NOT be implemented.
- **Change Request Approval**: Any scope alteration requires Team Lead (Amay) sign-off, explicitly naming what scope is being added, what is being removed in exchange, and the justification.

---

## 7. Real-Data Policy

- **Zero Synthetic Projects**: The final running application must consume real prices from `data.gov.in` and pre-cleaned historical Agmarknet/CEDA data.
- **Mock Quarantine**: Mock data is permissible ONLY inside `/src/frontend/fixtures/` and unit test files for isolated contract testing before backend hookup. Mock data must never be presented as real market intelligence.
- **Mandatory Attribution**: All visualizations displaying CEDA data must present the required citation and logo: *"CEDA Agri Market Data (CEDA-AMD), 2000-2023. Centre for Economic Data & Analysis, Ashoka University"*.

---

## 8. AI Coding Agent Directives

Every automated agent or pair-programmer operating in this repository must:
- Stay strictly within the assigned file boundaries of the team member.
- Refuse to invent non-existent APIs, libraries, or data fields.
- Respect all frozen contracts in `/src/contracts/`.
- Never modify files owned by other members to bypass a dependency bottleneck.
