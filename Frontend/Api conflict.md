# Findora: API and tooling conflicts

Living log of every mismatch between the frontend spec, `API_DOCUMENTATION.md`, the backend spec, the live `/openapi.json`, and the installed tools. It also records the decision taken for each one.

## How to use this file (Claude Code)

- Read it at the start of every stage. `DECIDED` entries are rules. `OPEN` entries must be verified against `/openapi.json` (or the running backend) before you build on them.
- When you verify an `OPEN` entry, update it: fill in **Result**, change **Status**, and adjust the code and tests if the result differs from the assumption.
- Never fix a backend problem from here. Mark it `NEEDS BACKEND` and tell the user.
- Add new entries at the bottom of the right section using the template at the end.

**Status values:** `OPEN` (assumption, must verify) · `DECIDED` (follow the decision) · `NEEDS BACKEND` (frontend works around it, user may change the backend) · `RESOLVED` (verified, no action left).
**Priority:** High (breaks a flow or logs users out), Medium (wrong UI), Low (polish).

## Summary

| ID | Topic | Priority | Status |
|---|---|---|---|
| C-01 | Endpoints missing from `API_DOCUMENTATION.md` | High | RESOLVED |
| C-02 | Category lists: array or `Page` | Medium | DECIDED |
| C-03 | Schemas not specified in `API_DOCUMENTATION.md` (only `UserDashboard` defined so far) | High | OPEN |
| C-04 | Does the login/refresh `user` include `role`? (probably not) | High | OPEN |
| C-05 | Unknown 401 detail must not sign the user out | High | DECIDED |
| C-06 | Stale access token after a password change in another tab | Medium | DECIDED |
| C-07 | Inactive account during a session | Low | OPEN |
| C-08 | No "I already claimed this" flag (confirmed) | Medium | NEEDS BACKEND |
| C-09 | No claims count on `ItemResponse` (confirmed) | Medium | DECIDED |
| C-10 | Reporter actions on a `closed` item | Low | DECIDED |
| C-11 | Return record has user IDs only | Low | OPEN |
| C-12 | Claim detail cannot tell reporter from admin | Low | DECIDED |
| C-13 | `AdminUserCreate` fields (phone?) | Medium | OPEN |
| C-14 | Which fields `PATCH /items/{id}` accepts | Medium | OPEN |
| C-15 | `429` body is not `{detail}` | Medium | DECIDED |
| C-16 | `IMAGE_ALLOWED_HOSTS` and Cloudinary | Medium | OPEN |
| C-17 | File names | Low | DECIDED |
| C-18 | `UserDashboard` recent claims have no item info | Medium | OPEN |
| C-19 | Clearing the phone with `PATCH /users/me` | Low | OPEN |
| C-20 | "Verified" line is stronger than the document's content | Medium | DECIDED |
| T-01 | 21st output vs "no UI kits, no new dependencies" | High | DECIDED |
| T-02 | 21st output is TSX and often Tailwind v3 | Medium | DECIDED |
| T-03 | `frontend-design` vs spec design tokens | Medium | DECIDED |
| T-04 | compound-engineering defaults vs this project | Medium | DECIDED |
| T-05 | `pyright-lsp` is Python only (read-only backend lookups allowed) | Low | DECIDED |
| T-06 | Context7 vs "no new dependencies" | Low | DECIDED |
| T-07 | Test and lint packages not named in the spec | Medium | DECIDED |
| T-08 | 21st skills, themes, CLI, and design-sync side effects | High | DECIDED |
| T-09 | Where Claude Code is launched | Medium | DECIDED |
| S-01 | `GuestRoute` redirect races with `?next=` | High | DECIDED |
| S-02 | `?next=` must be validated | High | DECIDED |
| S-03 | Garbled route-order note in spec 7.4 | Low | DECIDED |
| S-04 | Modal focus trap | Medium | DECIDED |

---

## A. API and backend conflicts

### C-01 · Endpoints missing from `API_DOCUMENTATION.md`
- **Source:** `API_DOCUMENTATION.md` vs backend spec sections 6.2, 6.3, 6.5.
- **Issue (was):** five endpoints were not documented.
- **Result (document updated 2026-10-22):** all five are now documented: `PATCH /users/me` (returns `UserMe`), `GET /users/me/dashboard` (`UserDashboard`), `GET /users/{user_id}` (`UserPublic`, `404`), `GET /categories/{category_id}` (`CategoryResponse`, `404` when missing or inactive), `GET /items/{item_id}/claims` (`Page[ClaimResponse]`, `403` for anyone but the reporter or an admin).
- **Still missing in the document:** `GET /items/{item_id}/claims` lists no query params and no `404`.
- **Decision:** implement all five. Assume the claims list takes the same params as `/claims/my-claims` (`status`, `start_date`, `end_date`, `sort_by`, `order`, `page`, `page_size`). Confirm in Stage 5 from `/openapi.json`.
- **Status:** RESOLVED

### C-02 · Category lists: array or `Page`
- **Source:** `API_DOCUMENTATION.md` says `GET /categories` returns `Page[CategoryResponse]`. The backend spec says a plain list. `GET /admin/categories` has `sort_by` and `search` params but its response shape is not stated.
- **Decision:** One helper, `normalizeList(res)`, accepts an array or `{ data: [] }`. Use it for `GET /categories` **and** `GET /admin/categories`. Never read `.data` directly on either.
- **Verify:** Check both shapes in `/openapi.json`. Keep the helper either way.

### C-03 · Schemas not specified in `API_DOCUMENTATION.md`
- **Source:** `API_DOCUMENTATION.md` names schemas without defining them.
- **Result (document updated 2026-10-22):** only `UserDashboard` is now defined (see 11.8 in the spec and C-18). Still undefined: `AdminDashboard`, `ItemReturnResponse`, `AdminUserCreate`, `AdminUserStatusUpdate`, `AdminUserRoleUpdate`, `ItemStatusUpdate`, `CategoryCreate`, `CategoryUpdate`, `CategoryAdminResponse` (with `items_count`), `ItemUpdate`, `UserPublic`, `UserMe`, `TokenResponse`.
- **Decision:** do not guess. In Stage 1 read the real shapes from `/openapi.json`, write JSDoc typedefs in `src/api/types.js`, and record every difference here. Use `pyright-lsp` read-only on `../backend/schemas.py` if the OpenAPI schema is unclear.
- **Status:** OPEN (partly resolved)

### C-04 · Does the login/refresh `user` include `role`?
- **Source:** `API_DOCUMENTATION.md` says `TokenResponse` carries `UserPublic`, and `GET /auth/me` returns `UserMe` (with `role`). The backend spec says login returns "the safe user (includes `role`)".
- **New evidence (2026-10-22):** the document also says `GET /users/{user_id}` returns `UserPublic`, and the backend spec says that public profile exposes only `id`, `full_name`, `created_at`. If it is the same schema, `UserPublic` has no `role`, so the login and refresh `user` object probably has none either.
- **Risk:** without `role`, `isAdmin` is false for admins and the admin area is unreachable.
- **Decision:** the `GET /auth/me` fallback inside `applyTokenResponse` is required, not just a guard. Test both shapes with MSW (with `role` and without). Show a "member since" line on public profiles only if `created_at` is present.
- **Verify:** check `TokenResponse.user` in `/openapi.json` in Stage 1 and record it here.
- **Status:** OPEN

### C-05 · Unknown 401 detail must not sign the user out
- **Source:** Frontend spec 6.3 originally cleared tokens on any 401 whose `detail` was not "Token expired". Backend spec 5.6 says the current password is verified on change-password but gives no status code for a wrong one.
- **Risk:** If a wrong current password returns `401`, the user would be signed out while fixing a typo.
- **Decision:** Force sign-out only for `"Token expired"` (after a failed refresh) and `"Invalid token"` (after a failed refresh, see C-06). Any other `401` detail is a normal error shown with `getErrorMessage()`. Spec 6.3 is rewritten accordingly. Add a test.
- **Verify:** Send a wrong `current_password` to the live backend and record the status and `detail` here.
- **Result:** _pending_

### C-06 · Stale access token after a password change in another tab
- **Source:** Backend spec 5.1 (`pwf`): changing the password kills all old tokens. The refresh token lives in shared `localStorage`, the access token lives per tab.
- **Risk:** Tab A changes the password and stores new tokens. Tab B still holds the old access token, gets `401 "Invalid token"`, calls `clearTokens()`, which wipes the shared refresh token and signs tab A out too.
- **Decision:** On `"Invalid token"`, first try one `refreshOnce()` with the refresh token currently in storage (it may be the newer one). Only if that fails, sign out. Spec 6.3 encodes this.
- **Verify:** Manual two-tab test in Stage 2: change the password in tab A, trigger a request in tab B.

### C-07 · Inactive account during a session
- **Source:** Backend spec 5.1 and 6.9: inactive users are rejected on every protected request, and `403` covers inactive accounts. The exact status and `detail` for an already-signed-in user who gets deactivated are not stated.
- **Decision (provisional):** If any authenticated request returns `403` and `detail` mentions the account being inactive or deactivated, sign out and show "This account is deactivated. Contact an administrator." Otherwise a `403` is a plain permission toast.
- **Verify:** Deactivate a demo user from the admin panel, then use their open session. Record the real response here.
- **Result:** _pending_

### C-08 · No "I already claimed this" flag
- **Source:** `API_DOCUMENTATION.md` "Known Limitations" (2026-10-22) confirms `ItemResponse` has no flag for the viewer's own claim, and `/claims/my-claims` has no `item_id` filter.
- **Impact:** the item page cannot know the viewer already submitted a claim, so it cannot hide the claim form in advance.
- **Decision:** show `ClaimForm` to any eligible viewer. On `409` show the server message and a link to "My claims". For a signed-in non-reporter viewing a non-open found item, add a line: "If you submitted a claim, you can find it in My claims."
- **Backend suggestion (optional):** add `my_claim_id` to `ItemResponse` for signed-in viewers, or an `item_id` filter on `my-claims`.
- **Status:** NEEDS BACKEND (confirmed limitation)

### C-09 · No claims count on `ItemResponse`
- **Source:** confirmed in `API_DOCUMENTATION.md` "Known Limitations" (2026-10-22).
- **Decision:** Delete is offered to reporter and admin on every non-`returned` item. A `409` ("Item has claims; close it instead") shows a toast with a hint to use "Close report". No "N pending claims" badge on cards. The user dashboard provides pending-claim counts.
- **Status:** DECIDED (confirmed limitation)

### C-10 · Reporter actions on a `closed` item
- **Source:** Frontend spec 11.3 said a closed item has no actions for the reporter. The backend allows deleting an item that has no claims, and closed is not terminal for deletion.
- **Decision:** On a `closed` item the reporter sees **Delete** only (server decides, `409` handled). No Edit and no Close. Admin also sees **Reopen**.

### C-11 · Return record has user IDs only
- **Source:** Expected `ItemReturnResponse` fields: `id, item_id, claim_id, returned_by, received_by, returned_at, notes`. The last two are UUIDs.
- **Decision:** `ReturnRecordCard` shows "Handed over on <date>" and the notes. It never shows raw UUIDs as labels. If `/openapi.json` shows nested names, show them.
- **Result:** _pending_

### C-12 · Claim detail cannot tell reporter from admin
- **Source:** `ClaimResponse.item` has only `id, title, item_type, status`, with no reporter ID.
- **Decision:** Viewer is the claimant if `claim.claimant.id === user.id`. Otherwise treat the viewer as reporter or admin. Contact label: "Reporter's contact" for the claimant, "Claimant's contact" for anyone else. An admin who is neither party receives no contact data, so nothing renders. The server enforces access.

### C-13 · `AdminUserCreate` fields (phone?)
- **Source:** `POST /auth/register` accepts `phone`. The backend spec lists `full_name, email, password, role?` for `POST /admin/users`, with no `phone`.
- **Decision:** The admin create dialog sends only `full_name`, `email`, `password`, `role`. Add `phone` only if `/openapi.json` lists it. Unknown fields return `422`.
- **Result:** _pending_

### C-14 · Which fields `PATCH /items/{id}` accepts
- **Source:** `API_DOCUMENTATION.md` says "Partial `ItemCreate` fields". It is not stated whether `item_type` and `category_id` can change.
- **Decision:** Send only changed fields. Check `ItemUpdate` in `/openapi.json` in Stage 4. If `item_type` is not editable, render it read-only on the edit form.
- **Result:** _pending_

### C-15 · `429` body is not `{detail}`
- **Source:** Backend uses `slowapi`. Its default handler returns an `error`-style body, not FastAPI's `detail`.
- **Decision:** For `429`, ignore the body and show the fixed message from spec 6.4. Disable the submit button for 10 seconds.

### C-16 · `IMAGE_ALLOWED_HOSTS` and Cloudinary
- **Source:** Backend may restrict `image_url` hosts. The frontend uploads to Cloudinary and sends back the `secure_url` (host `res.cloudinary.com`).
- **Decision:** If the API returns `422` about `image_url`, show it under the image field and tell the user to add `res.cloudinary.com` to `IMAGE_ALLOWED_HOSTS` (or leave it empty).
- **Verify:** First Cloudinary upload in Stage 4.

### C-17 · File names
- **Decision:** the API document is named `API_DOCUMENTATION.md` and lives in `frontend/` (copy it from the backend folder). Canonical names inside `frontend/`: `CLAUDE.md`, `frontend_spec.md`, `API_DOCUMENTATION.md`, `api_conflict.md`. The backend spec is referenced as `backend/backend_spec.md`; rename it or update the references if your file differs.
- **Status:** DECIDED

### C-18 · `UserDashboard` recent claims have no item info
- **Source:** `API_DOCUMENTATION.md` `UserDashboard` example: `pending_claims_on_my_items.recent[]` entries are `{ id, claimant{id, full_name}, created_at }`. Spec 11.8 expected a link to the item.
- **Impact:** the row cannot show which item the claim is for, or link to the item.
- **Decision:** each row shows the claimant name and relative date and links to `/claims/{id}` (claim detail, open to the reporter). If the real schema in `/openapi.json` has an `item` object, also show its title. Count maps (`my_items_by_status`, `my_items_by_type`, `my_claims_by_status`) may omit zero keys: default every missing key to `0`.
- **Verify:** compare with the real `UserDashboard` in `/openapi.json` (Stage 7).
- **Status:** OPEN

### C-19 · Clearing the phone number with `PATCH /users/me`
- **Source:** `API_DOCUMENTATION.md` lists `phone` as optional but does not say how to clear it.
- **Decision (provisional):** send only changed fields. To clear the phone, send `phone: null`; never `""`. If the server answers `422`, show its message and record the result here.
- **Verify:** Stage 2, profile form, against the live backend.
- **Status:** OPEN

### C-20 · The "Verified" line in `API_DOCUMENTATION.md` is stronger than its content
- **Source:** the header says "Verified against the backend on 2026-10-22", but the document has no result for the wrong current password, the `429` response, the deactivated-token case, or `GET /items/{id}/return` with no return, and it has no "Unverified" markers. Most schemas are still only named.
- **Decision:** treat the document as partly updated. Every `OPEN` entry in this file still needs a check against `/openapi.json` or the live backend in Stage 1. If the Claude Code report from that update exists, add its findings here.
- **Status:** DECIDED

---

## B. Tooling conflicts

### T-01 · 21st output vs "no UI kits, no new dependencies"
- **Issue:** 21st components are usually built on shadcn-style parts (Radix, `class-variance-authority`, `clsx`, `tailwind-merge`, often `framer-motion`). The spec forbids shadcn and new dependencies.
- **Decision:** 21st is allowed as **inspiration and first draft only**. Adapt every output: JSX, project tokens, no new dependency, no decorative motion, fits the component inventory. Never ship raw generated code. See `frontend/CLAUDE.md`.

### T-02 · 21st output is TSX and often Tailwind v3
- **Decision:** Convert to JSX with JSDoc. Replace v3-only config assumptions (`tailwind.config.js`, `@apply` patterns, arbitrary theme lookups) with Tailwind v4 `@theme` tokens. Check Tailwind v4 syntax through Context7.

### T-03 · `frontend-design` vs spec design tokens
- **Decision:** The spec section 5 (tokens, two font families, tone, "avoid" list, claim-tag card) always wins. Use the plugin for composition, spacing, hierarchy, and empty/error states inside those tokens.

### T-04 · compound-engineering defaults vs this project
- **Issues:** Many bundled review agents target Rails, Python, or TypeScript. Some versions create worktrees, push branches, or open pull requests. Autonomous chains (`/lfg`, `/slfg`, `/lrj`) skip human checks.
- **Decision:** Use the plan, deepen, work, review, and compound commands only. Prefer security, race-condition, architecture, simplicity, and performance reviewers. Ignore language-specific reviewers for other stacks. No pushes or PRs without asking. No autonomous chains unless the user asks. Plans go to `docs/plans/`, lessons to `docs/solutions/`.

### T-05 · `pyright-lsp` is Python only
- **Issue:** It is a Python language server and the frontend is JavaScript, so it cannot help with frontend code.
- **Decision:** It is used for one thing: read-only navigation of `../backend` (definitions, hover) to confirm a Pydantic schema or route signature when `/openapi.json` is unclear (see C-03). Needs `claude --add-dir ../backend`. If the server cannot start, read the file directly. Never edit backend files. Frontend editor intelligence comes from ESLint and JSDoc types.

### T-06 · Context7 vs "no new dependencies"
- **Decision:** Context7 reads docs. It never decides which library to add. Library choices come from the spec only.

### T-07 · Test and lint packages not named in the spec
- **Issue:** The spec requires Vitest, React Testing Library, and MSW, which also need supporting packages. Asking about each one wastes time.
- **Decision:** Pre-approved **devDependencies**: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `@vitest/coverage-v8`, `eslint`, `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals`, `prettier`. Pre-approved runtime: `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/public-sans` (self-hosted fonts). Anything else needs approval.

### T-08 · 21st skills, themes, CLI, and design-sync side effects
- **Source:** installed skills `21st-ai`, `21st-cli-use`, `21st-design-sync`, `21st-registry`, `21st-ui-build`, `21st-ui-explore`, `21st-ui-review`, and MCP tools under `mcp__plugin_21st_21st__` (components, templates, themes, bookmarks, video assets).
- **Issue:** Some of these can write files, install components, add dependencies, apply a theme, or change the user's 21st account. That conflicts with "no UI kits, no new dependencies, spec tokens are the theme".
- **Decision:** Allowed: `21st-ui-explore` (look), `21st-ui-build` (draft, then adapt), `21st-ui-review` (review), `21st-registry` (read-only lookup), and the components and templates MCP tools for inspiration. Not allowed without the user's explicit request: installing registry components, any CLI command that writes files or adds dependencies, applying themes, `21st-design-sync`, bookmarks, video assets. See `CLAUDE.md` and `frontend_spec.md` section 20.3.

### T-09 · Where Claude Code is launched
- **Issue:** Tools might be installed in one folder only, and the backend spec sits outside `frontend/`.
- **Finding:** The plugin and MCP list shows them under "User", so they are user-scope and available from any folder.
- **Decision:** Launch from `frontend/` for frontend work. Read the backend spec through `../backend/backend_spec.md` (allow read access or use `--add-dir ../backend`), otherwise use `/openapi.json`. If a tool is missing, check `/plugin` and `/mcp`, then launch from the folder where it was installed or reinstall at user scope. Never edit `backend/` from a frontend session.

---

## C. Spec-internal issues (resolved in this version of the spec)

### S-01 · `GuestRoute` redirect races with `?next=`
- **Issue:** After a successful login `isAuthenticated` flips to true. `GuestRoute` then redirects signed-in users to `/` immediately, before the login page can navigate to `?next=`. Users returning from a protected page would land on the home page.
- **Decision:** `GuestRoute` reads `?next=`, validates it (S-02), and redirects there, else `/`. The login page does not navigate by itself.

### S-02 · `?next=` must be validated
- **Decision:** Accept only a string that starts with a single `/`, does not start with `//`, and contains no `://` or backslash. Otherwise use `/`. Put this in one helper `safeNext(search)` and test it.

### S-03 · Garbled route-order note in spec 7.4
- **Decision:** Removed. Route order is a backend concern. The frontend only needs to call `/items/my-items` as a fixed path and never build it from an ID.

### S-04 · Modal focus trap
- **Issue:** Spec requires focus trap, focus return, and `Esc`, but bans UI kits, so there is no Radix `Dialog`.
- **Decision:** Build `Modal` on the native `<dialog>` element with `showModal()`. It provides the focus trap, `Esc`, and the backdrop. Return focus to the opener on close, style `::backdrop`, and respect `prefers-reduced-motion`.

---

## Template for new entries

```markdown
### X-NN · Short title
- **Source:** where the two statements live (file and section, or endpoint).
- **Issue:** what disagrees, in one or two sentences.
- **Risk / Impact:** what breaks if ignored.
- **Decision:** what the frontend does now.
- **Verify:** how to confirm (endpoint, command, manual test).
- **Result:** what was observed (fill in after verifying).
- **Status:** OPEN | DECIDED | NEEDS BACKEND | RESOLVED
```