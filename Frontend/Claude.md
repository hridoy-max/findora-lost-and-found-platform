# Findora frontend

React SPA for the Findora Lost & Found platform. The backend is finished. Your job is to build the frontend against it, one stage at a time, and keep quality professional.

## Repo layout

```text
findora/
├── CLAUDE.md                  # this file, loaded every session
├── backend/                   # FastAPI + PostgreSQL. DONE. Do not modify from a frontend session.
│   ├── CLAUDE.md
│   └── backend_spec.md        # backend specification (rename here if your file differs)
└── frontend/                  # React + Vite SPA. ACTIVE WORK.
    ├── CLAUDE.md              # frontend rules and workflow (loaded when working in frontend/)
    ├── frontend_spec.md       # frontend source of truth (UI, behavior, stages)
    ├── API_DOCUMENTATION.md            # backend API documentation (partly verified; see api_conflict.md C-20)
    └── api_conflict.md        # living log of mismatches and decisions
    └── .claude/settings.json  # optional deny rules: no reading .env, no editing ../backend
```

## Read before you write code

Do these at the start of every stage, in order:

1. This file.
2. The sections of `frontend_spec.md` that belong to the stage (section 16 lists the stages; sections 20 and 21 describe tooling and workflow).
3. `api_conflict.md`. Every entry marked `DECIDED` is a rule. Every entry marked `OPEN` must be verified before you build on it.
4. The live API shape: `curl http://localhost:8000/openapi.json`. If the backend is not running, ask the user to start it. Do not guess shapes.
5. When a rule or edge case is unclear: the backend spec at `../backend/backend_spec.md` (read only). If access is blocked, tell the user to allow it or relaunch with `claude --add-dir ../backend`.

`frontend_spec.md` is long. Read the whole file once in Stage 1, then re-read only the relevant sections for later stages.

## Stack

React 18+ and Vite, JavaScript (JSX) with JSDoc typedefs, Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `@theme`), `react-router-dom`, `@tanstack/react-query`, `axios`, `react-hook-form` + `zod` + `@hookform/resolvers`, `lucide-react`, `recharts` (admin only), `sonner`, `date-fns`. Tests: Vitest, React Testing Library, MSW.

No Redux, Zustand, MUI, Chakra, shadcn, CSS-in-JS, or other CSS frameworks. No new runtime dependency without asking. Pre-approved dev tooling is listed in `frontend_spec.md` section 1.

## Commands (created in Stage 1)

```bash
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # must pass before a stage is done
npm run lint       # ESLint, must pass
npm test           # Vitest, must pass
```

## Rules that matter most

Full list is in `frontend_spec.md` section 2. The ones that cause the most damage when forgotten:

- All HTTP goes through `src/api/*`. Components never call `axios` or `fetch` directly.
- Server data lives in React Query. Auth state is the only exception (`AuthContext`).
- `localStorage` is touched only in `src/api/tokens.js`. Access token in memory, refresh token in `localStorage`.
- All `import.meta.env` access goes through `src/config.js`.
- Never send `role`, `user_id`, `reviewer_id`, `returned_by`, or `received_by`. The backend rejects unknown fields (`extra="forbid"`), so send only documented fields.
- Client-side guards are UX only. Always handle `401`, `403`, `404`, `409`, `422`, `429` from the server.
- Every list or detail screen has four states: loading (skeleton), error (with retry), empty (with next action), data.
- Every mutation button is disabled and shows a spinner while pending.
- Mobile first, works at 360px. Labels on every input, visible focus, status never shown by color alone.
- Never show a raw UUID as a primary label. Never render raw error objects.
- Look up library docs in Context7 before writing code that uses them. Use `frontend-design` for UI decisions. Do not rely on memory for library APIs.

## Tooling: how to use each plugin and MCP

Confirm installed names with `/help`, `/plugin`, and `/mcp` before relying on any name below. If a tool is missing or not connected, say so, continue without it, and note it in the stage report. Never pretend a tool was used.

### Required tool use

| Tool | Required when |
|---|---|
| `context7` | Every stage, for each library the stage uses for the first time (per-stage list: `frontend_spec.md` section 21) |
| `frontend-design` | Every stage that adds screens or components (stages 1 to 9), before writing them and again in review |
| `21st` explore, build, review | UI-heavy stages: 1 (base primitives), 3, 7, 8, 9. Optional for forms and dialogs in 2, 4, 5, 6 |
| `compound-engineering` | Every stage: plan, work, review, compound. Deepen on stages 2, 5, 6 |
| `pyright-lsp` | Only to read backend schemas when `/openapi.json` is unclear |

The stage report must list each tool used, or give a reason it was skipped.

### compound-engineering (plugin)

Drives the stage loop. Typical commands (some versions prefix them as `/workflows:` and newer ones as `/ce:`):

| Step | Command | Notes |
|---|---|---|
| Plan | `plan` | Input: "Stage N: <name> from frontend_spec.md section 16". Plan files go to `docs/plans/`, named `frontend-stage-N-...` |
| Deepen | `deepen-plan` | Required for Stage 2 (auth, tokens), Stage 5 (claims), Stage 6 (returns). Optional elsewhere |
| Build | `work` | Execute the approved plan. Small steps, verify after each |
| Review | `review` | Multi-agent review before the stage is called done |
| Learn | `compound` | Save non-trivial lessons to `docs/solutions/` |

Also use when available: a `brainstorm` step when a requirement is vague (before `plan`), and the plugin's setup command once on first use if it has one. Run `/agents` to list the reviewers that are actually installed.

Review agents to prefer for this project (if installed): security review for token handling, a race-condition or frontend-races reviewer for the single-flight refresh and mutations, architecture review, code-simplicity review, performance review. Ignore Rails-, Python-, and TypeScript-specific reviewers. Triage the findings: fix real problems, and write one line for each finding you skip, saying why.

Do not run fully autonomous chains (`/lfg`, `/slfg`, `/lrj`) unless the user explicitly asks. Every stage ends with a human check. If a command wants to push or open a pull request, stop and ask.

### frontend-design (plugin)

Use it **before** writing any screen or component, and again in review. Give it a short brief taken from `frontend_spec.md` section 5: subject (community lost & found board), audience (stressed people who lost something, helpful strangers), primary job (find or report in under a minute, make claim and handover feel safe), tone (calm, plain, sentence case), and the tokens and fonts. Ask it for decisions on hierarchy, spacing, layout, and the empty, error, loading, and pending states.

It owns these design calls: the item card (claim tag with notched edge and status stub), the home screen, claim and handover screens (trust and clarity), dialogs, the admin shell, and dashboard hierarchy.

The tokens, fonts, tone, and "avoid" list in section 5 always win over generic plugin defaults. If its advice conflicts with them, follow the spec and log it in `api_conflict.md` (T-03). Check each UI result against the "avoid" list: no gradient hero, no all-caps tracked eyebrows, no identical shadowed cards, no arrow on every button, no fade-in everywhere.

### 21st (plugin skills + MCP)

Use for inspiration, first drafts, and review of UI pieces (`DataTable`, `Pagination`, `StatCard`, search box, dialogs, skeletons, empty states). Order: explore, then build, then review.

| Skill | Use in this project |
|---|---|
| `21st:21st-ui-explore` | **Step 1.** Look at existing components and patterns before drafting anything |
| `21st:21st-ui-build` | **Step 2.** Draft one component at a time, then adapt it (checklist below) |
| `21st:21st-ui-review` | **Step 3.** Review finished UI for consistency, accessibility, and token use. Use it in the stage review for UI stages |
| `21st:21st-registry` | Read-only lookup in the component registry for ideas. Do not install registry components |
| `21st:21st-cli-use` | Reference only. Do not run any 21st CLI command that installs components, writes files, or adds dependencies without the user's approval |
| `21st:21st-design-sync` | Off by default. Use only if the user explicitly asks to sync designs |
| `21st:21st-ai` | Off by default. Not used for code decisions |

The MCP tools live under `mcp__plugin_21st_21st__` (components, templates, themes, bookmarks, video assets). Use the components and templates tools for inspiration only. Do **not** apply 21st themes (the spec tokens are the theme). Do **not** create or change bookmarks or other items in the user's 21st account, and do not use video assets, unless the user asks.

Generated output is a draft. Before it enters the repo you must:

- Convert it to **JSX** (not TSX) and Tailwind v4.
- Replace its colors, radii, and fonts with the project tokens (`ink`, `paper`, `surface`, `line`, `cobalt`, `found`, `lost`, `danger`).
- Remove any new dependency it pulls in (Radix, `class-variance-authority`, `clsx`, `tailwind-merge`, `framer-motion`, and similar). Use `utils/cn.js` and plain Tailwind.
- Remove decorative motion. Motion only answers a user action, and `prefers-reduced-motion` is respected.
- Fit it into the component inventory in `frontend_spec.md` section 3. Do not create components outside the list without asking.

Never use 21st for the data layer, routing, auth, or API code. Never use a 21st component as is for `ItemCard`; that card is a custom design.

### context7 (MCP)

Training data is stale for fast-moving libraries. Before writing code that uses one, look up the current docs through Context7 (find the library, then query the topic) for the version in `package.json`: TanStack Query, Tailwind v4, React Router, react-hook-form, zod, `@hookform/resolvers`, Vitest, MSW, axios, recharts, sonner, date-fns, Vite, ESLint. Context7 wins over memory. If it has nothing, say so and use the library's official docs.

Known traps to check: TanStack Query v5 API (`placeholderData: keepPreviousData`), Tailwind v4 (`@theme`, no `tailwind.config.js`), React Router v6 vs v7 imports, zod v3 vs v4 with `@hookform/resolvers`, MSW v2 handlers. The per-stage library list is in `frontend_spec.md` section 21.

Context7 is for reading docs only. It never justifies adding a library.

### pyright-lsp (plugin)

Backend Python only. Allowed use: **read-only** navigation of `../backend` (definitions, hover) to confirm an exact Pydantic schema or route signature when `/openapi.json` is unclear, for example `UserDashboard`, `AdminDashboard`, `ItemReturnResponse`, `ItemUpdate`. This needs `claude --add-dir ../backend`. If the language server cannot start, read the file directly. Never edit backend files, never run backend code, never use it on frontend JavaScript.

## Stage workflow

Follow `frontend_spec.md` section 21 for the full per-stage recipe. Short version:

1. `/clear`, plan mode on. Check `git status` (the repo must be initialized and clean) before starting.
2. Plan the stage, deepen if flagged, review the plan against the spec and `api_conflict.md`. If the stage is too big for one session (Stage 1 usually is), split it into sub-steps inside the plan, such as 1a tooling and config, 1b tokens and base components, 1c API types from `/openapi.json`.
3. Look up library docs in Context7. Do the design pass with `frontend-design`, then `21st` explore and build where the table says so.
4. Build in small steps. After each step run the relevant tests. Tick the step off in the plan file.
5. Before calling the stage done: `npm run lint`, `npm test`, `npm run build` all pass.
6. Run the multi-agent review, plus `21st-ui-review` on UI stages. Fix real findings, note the rest.
7. Update `api_conflict.md` with anything new. Commit locally.
8. Reply with the stage report (below).

Context management: the plan file is the memory. If the session gets long, tick off finished steps, run `/compact` or commit and `/clear`, then resume from the plan file. Ready-to-paste prompts for starting, resuming, building a component, verifying a conflict, and closing a stage are in `frontend_spec.md` section 22.

## Stage report format

End every stage with exactly these parts:

- **Changed files:** list.
- **Commands run:** each command and whether it passed. Say "not run" if you did not run it.
- **Plugins and MCP used:** one line per tool (`compound-engineering`, `frontend-design`, `21st`, `context7`, `pyright-lsp`): what it was used for, or why it was skipped. Name the libraries looked up in Context7.
- **Conflicts:** new or changed entries in `api_conflict.md`.
- **Manual checks for the user:** what to open in the browser and what to look for. You cannot see the screen, so do not claim it looks right.

## When you find a conflict

A conflict is any mismatch between the spec, `API_DOCUMENTATION.md`, the backend spec, and the live `/openapi.json`, or between a tool's default output and a spec rule.

1. Stop broad changes. Do not silently work around it.
2. Check `api_conflict.md`. If an entry is `DECIDED`, follow it.
3. If it is new, add an entry using the template at the bottom of that file, mark it `OPEN`, and tell the user in one short message with your recommended decision.
4. Continue only with work that does not depend on the answer.

## Do not

- Add features, pages, or dependencies not listed in the spec.
- Build excluded scope: chat, notifications, payments, AI matching, map view, social login, dark mode, SSR, any backend change.
- Use `localStorage`, `sessionStorage`, or `import.meta.env` outside the files named above.
- Log tokens, passwords, or reset links. Commit `.env`.
- Rewrite working files wholesale. Inspect first, then make the smallest change that works.
- Skip tests to make a stage "pass".