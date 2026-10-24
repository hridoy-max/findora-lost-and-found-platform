# Findora

Lost & Found community platform. Visitors search reports. Signed-in users report lost or found items, claim found items with private proof, exchange contact details after approval, and record the handover. Admins manage users, categories, items and claims.

**Status:** the backend is finished and tested. All current work is the **frontend**, built stage by stage with Claude Code.

## Repo layout

```text
findora/
├── CLAUDE.md                  # this file, loaded every session
├── backend/                   # FastAPI + PostgreSQL. DONE. Do not modify from a frontend session.
│   ├── CLAUDE.md
    ├── API_DOCUMENTATION.md            # backend API 
│   (rename here if your file differs)
└── frontend/                  # React + Vite SPA. ACTIVE WORK.
    ├── CLAUDE.md              # frontend rules and workflow (loaded when working in frontend/)
    ├── frontend_spec.md       # frontend source of truth (UI, behavior, stages)
    ├── API_DOCUMENTATION.md            # backend API documentation (partly verified; see api_conflict.md C-20)
    └── api_conflict.md        # living log of mismatches and decisions
    └── .claude/settings.json  # optional deny rules: no reading .env, no editing ../backend
```

## Stack at a glance

| Layer | Choice |
|---|---|
| Backend | Python, FastAPI, PostgreSQL, SQLAlchemy 2.0, Alembic, stateless JWT (access, refresh, reset) |
| Frontend | React 18+ and Vite (SPA), JavaScript + JSDoc, Tailwind CSS v4, React Router, TanStack Query, axios, react-hook-form + zod |
| Tests | Backend: pytest on PostgreSQL. Frontend: Vitest, React Testing Library, MSW |
| API | `http://localhost:8000/api/v1`, interactive docs at `/docs`, machine-readable at `/openapi.json` |

## Source of truth (highest wins)

1. **Data, fields, enums, status codes, business rules:** the running backend (`/openapi.json`), then `backend/backend_spec.md`, then `frontend/API_DOCUMENTATION.md`.
2. **UI, UX, screens, routes, design tokens, stages:** `frontend/frontend_spec.md`.
3. **Known mismatches and decisions made about them:** `frontend/api_conflict.md`.

If two sources disagree, do not guess and do not silently work around it. Log it in `frontend/api_conflict.md`, tell the user, then follow the decision recorded there.

## How work is done

The frontend is built in 9 stages (see `frontend/frontend_spec.md` section 16). Every stage follows the same loop, using the installed plugins (details in `frontend/CLAUDE.md`):

1. Fresh session (`/clear`), start in plan mode.
2. Plan the stage with the compound-engineering plan command. Save the plan under `docs/plans/` of the folder you launched from (for the frontend: `frontend/docs/plans/`).
3. Review the plan against the spec and `api_conflict.md`. Deepen it for risky stages (2, 5, 6).
4. Build the plan with the compound-engineering work command, in small verified steps.
5. Verify: lint, tests, `npm run build`. Report what actually ran.
6. Run the multi-agent review command. Fix real findings.
7. Record lessons with the compound command. Update `api_conflict.md`. Commit locally.

## Tooling installed for this project

| Tool | Kind | Used for | Not used for |
|---|---|---|---|
| `compound-engineering` | Plugin (commands + review agents) | Plan, work, review, and learn cycle for every stage | Fully autonomous chains (`/lfg`, `/slfg`, `/lrj`): do not run them here unless the user asks |
| `frontend-design` | Plugin (skill) | Deliberate visual choices inside the spec's design tokens | Overriding the tokens, fonts, or tone in the spec |
| `21st` | Plugin (skills: `21st-ui-explore`, `21st-ui-build`, `21st-ui-review`, `21st-registry`, plus `21st-cli-use`, `21st-design-sync`, `21st-ai`) + MCP (`mcp__plugin_21st_21st__*`) | Explore, draft, and review UI pieces, then adapt them to this project | Pasting generated code as is, applying 21st themes, installing registry components, syncing designs. The spec bans UI kits and new dependencies |
| `context7` | MCP | Current docs for React Query, Tailwind v4, react-hook-form, zod, React Router, Vitest, MSW, recharts, and so on | Choosing new libraries to add |
| `pyright-lsp` | Plugin (Python language server) | Read-only lookup of backend schemas and routes when `/openapi.json` is unclear | Editing backend files, or anything in frontend JavaScript |

Command and skill names can differ between plugin versions. Run `/help` and `/plugin` once per machine to confirm the exact names, and use what is actually installed.

## Which tool for which job

| Situation | Use |
|---|---|
| Starting a stage or a feature with several moving parts | compound-engineering: brainstorm if the requirement is vague, then plan, then deepen for stages 2, 5, 6 |
| About to write code with a library (React Query, Tailwind v4, react-hook-form, zod, React Router, Vitest, MSW, recharts, sonner, date-fns, Vite, axios) | `context7`, before writing |
| Deciding how a screen, state, dialog, or card should look and read | `frontend-design`, inside the spec section 5 tokens |
| Need ideas or a first draft for a UI piece from the component list | `21st`: `21st-ui-explore`, then `21st-ui-build`, then adapt |
| A UI piece is finished | `21st-ui-review`, then the compound review |
| Need the exact shape of an API request or response | live `/openapi.json` first. If unclear, read `backend/schemas.py` and the routes through `pyright-lsp` (read only) |
| Stage is finished | compound review, then compound lessons |
| Two sources disagree | `frontend/api_conflict.md` |

Every stage report must say which of these tools were used and why any were skipped. Using only one tool (for example only 21st) is not enough.

## Global rules

- Never modify `backend/` from a frontend session. If the backend looks wrong, log it in `frontend/api_conflict.md` and tell the user.
- Never invent endpoints, fields, enums, or status codes. Confirm shapes against `/openapi.json`.
- Never commit secrets. `.env` is never committed. Never log tokens, passwords, or reset links.
- Do not claim a build, test, or screen works unless you ran it. Report changed files, commands run, and anything left for the user to check by hand.
- Commit locally after each working stage. Do not push, force-push, or open pull requests unless the user asks.
- Ask before adding a dependency that is not pre-approved in `frontend/frontend_spec.md` section 1.

## Running things

```bash
# backend (already built; the user starts it)
cd backend && uvicorn app:app --reload        # http://localhost:8000/docs

# frontend (created in Stage 1)
cd frontend && npm install && npm run dev     # http://localhost:5173
```

## Where to launch Claude Code

**Frontend work: start Claude Code from `frontend/`.** The root `CLAUDE.md` still loads (parent folders are read), and `frontend/CLAUDE.md` loads too. This keeps the session focused and lowers the risk of touching `backend/`. Plans and lessons then land in `frontend/docs/plans/` and `frontend/docs/solutions/`.

- **Plugins and MCP:** they are installed at user scope, so they work from any folder. If a tool is missing in a session, run `/plugin` and `/mcp`. A tool installed at project or local scope in one folder will not appear when launched from another. Fix it by launching from that folder or reinstalling with `--scope user`.
- **Reading the backend spec from `frontend/`:** it lives at `../backend/backend_spec.md`. Reading outside the launch folder needs permission. Either allow read-only access when asked, or start with `claude --add-dir ../backend`. If neither is possible, use the live `/openapi.json` and `API_DOCUMENTATION.md`.
- **Launching from the repo root** is fine for work that spans both folders, but never edit `backend/` from a frontend session.