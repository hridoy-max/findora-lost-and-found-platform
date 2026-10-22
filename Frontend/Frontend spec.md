# Findora Frontend Specification

> Source of truth for the Findora frontend UI, behavior, and build stages. Read it completely once (Stage 1), then re-read the sections that belong to each stage. Inspect the existing repository first and do not overwrite working files. Do not add features, pages, or dependencies that are not listed here without asking.
>
> **The backend is already built and is the authority on data.** The frontend never invents endpoints, fields, statuses, or rules. When this file and the running backend disagree, the running backend wins: open `http://localhost:8000/openapi.json`, confirm the real shape, log it in `api_conflict.md`, and report it.

## 0. Reading order and precedence

1. `CLAUDE.md` (rules and workflow), then this file, then `api_conflict.md`, then `API_DOCUMENTATION.md`.
2. Data and behavior: live `/openapi.json` > `backend/backend_spec.md` > `API_DOCUMENTATION.md` > this file.
3. UI, UX, routes, tokens, stages: this file.
4. Tooling (plugins and MCP) rules: sections 20 and 21. Known mismatches and decisions: `api_conflict.md` (the IDs like C-05 below refer to it).
5. Ready-to-paste prompts for every situation are in section 22.
6. Claude Code is launched from `frontend/`. The backend spec is read through `../backend/backend_spec.md` (read only), or use `/openapi.json` (T-09).

## 1. Overview

Findora is a Lost & Found community platform. This frontend lets visitors search reports, lets signed-in users report lost or found items, claim found items with private proof, exchange contact details after approval, and record the handover. Admins manage users, categories, items, and claims.

| Item | Choice |
|---|---|
| Framework | React 18+ with Vite (SPA) |
| Language | JavaScript (JSX) with JSDoc typedefs for API shapes |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), design tokens in `@theme` |
| Routing | `react-router-dom` (`BrowserRouter` is fine) |
| Server state | `@tanstack/react-query` |
| HTTP | `axios` (one instance, interceptors for auth) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Icons | `lucide-react` |
| Charts (admin only) | `recharts` |
| Toasts | `sonner` |
| Dates | `date-fns` |
| Fonts | `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/public-sans` (self-hosted) |
| Tests | Vitest, React Testing Library, MSW |
| Image hosting | Cloudinary unsigned upload from the browser (the backend has no upload endpoint) |

**Pre-approved dev tooling** (T-07): `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `@vitest/coverage-v8`, `eslint`, `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals`, `prettier`.

Do not add anything else without asking. Do not use Redux, Zustand, UI kits (MUI, Chakra, shadcn, Radix), CSS-in-JS, `clsx`, `tailwind-merge`, `class-variance-authority`, `framer-motion`, or a CSS framework other than Tailwind.

### Scope

Included: auth screens, password recovery, public browsing and search, item reporting and management, claims and review, contact exchange, handover records, user dashboard, profile, admin panel (dashboard, users, items, categories, claims), responsive layout, accessibility, tests, deployment.

Excluded (do not build): chat or messaging, in-app notifications, payments, AI matching, a map view, social login, dark mode (unless asked later), server-side rendering, any backend change.

## 2. Rules

1. All API calls go through `src/api/*`. Components never call `axios` or `fetch` directly.
2. Server data lives in React Query. Do not copy server data into `useState` or a global store. Auth state is the one exception (`AuthContext`).
3. **Client-side guards are UX only.** Hiding a button never replaces the server check. Always handle `401`, `403`, `404`, `409`, `422`, `429` from the server even when the UI "should not allow" the action.
4. Never trust or send a role, `user_id`, `reviewer_id`, `returned_by`, or `received_by` from the client. The backend derives them.
5. Never log tokens, passwords, or reset links to the console.
6. Never render raw error objects, stack traces, or SQL. Show the message from `getErrorMessage()` (section 6.4).
7. Every list or detail screen has four states: loading (skeleton), error (with retry), empty (with a next action), and data.
8. Every mutation button is disabled and shows a spinner while pending (prevents double submits, which the backend answers with `409`).
9. No `localStorage` access outside `src/api/tokens.js`. No `import.meta.env` outside `src/config.js`.
10. Forms validate on the client with the same rules as the backend (section 8) and still display server `422` and `409` messages.
11. Mobile first. Every page works at 360px wide. No horizontal page scroll; wide tables scroll inside their own container.
12. Accessibility floor: semantic HTML, labels on every input, visible keyboard focus, `aria-live` for toasts and form errors, color is never the only carrier of status (badges include text), `prefers-reduced-motion` respected.
13. Do not claim a build, test, or screen works unless you ran it. Report changed files, commands run, and anything left manual after each stage.
14. Look up current docs through Context7 before using a fast-moving library (section 20). Do not rely on memory for API details.
15. Generated UI code (21st or otherwise) is a draft. It must be adapted to this spec before it enters the repo (section 20.3).
16. Commit locally after each working stage. Do not push or open pull requests unless asked.

## 3. Directory Structure

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── .env                         # never committed
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md
├── frontend_spec.md
├── API_DOCUMENTATION.md                  # copy of the backend API documentation
├── api_conflict.md              # living conflict and decision log
├── docs/
│   ├── plans/                   # compound-engineering plans (frontend-stage-N-...)
│   └── solutions/               # compound-engineering lessons
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                 # providers: QueryClient, Router, AuthProvider, Toaster
    ├── App.jsx                  # route table
    ├── index.css                # @import "tailwindcss"; @theme tokens; base styles
    ├── config.js                # reads import.meta.env, single place
    ├── api/
    │   ├── client.js            # axios instance + auth/refresh interceptors
    │   ├── tokens.js            # the only file that touches localStorage
    │   ├── errors.js            # getErrorMessage(), getFieldErrors()
    │   ├── auth.js
    │   ├── users.js
    │   ├── categories.js
    │   ├── items.js
    │   ├── claims.js
    │   ├── returns.js
    │   ├── admin.js
    │   ├── uploads.js           # Cloudinary upload (plain axios, no auth header)
    │   └── types.js             # JSDoc typedefs for API shapes
    ├── context/
    │   └── AuthContext.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useDebounce.js
    │   ├── useListParams.js     # URL-synced page/filter/sort state
    │   └── queries/             # useItems, useItem, useMyClaims, ... (one file per domain)
    ├── routes/
    │   ├── ProtectedRoute.jsx
    │   ├── AdminRoute.jsx
    │   └── GuestRoute.jsx
    ├── components/
    │   ├── ui/                  # Button, Input, Textarea, Select, Checkbox, Badge, Modal,
    │   │                        # ConfirmDialog, Spinner, Skeleton, EmptyState, ErrorState,
    │   │                        # Pagination, FormField, PageHeader
    │   ├── layout/              # AppLayout, Navbar, MobileMenu, Footer, AdminLayout, AdminSidebar
    │   ├── items/               # ItemCard, ItemGrid, ItemFilters, ItemForm, ImageUploader,
    │   │                        # StatusBadge, TypeBadge, ItemActions
    │   ├── claims/              # ClaimForm, ClaimListForReporter, ClaimCard, ClaimReviewDialog,
    │   │                        # ContactCard, ReturnRecordCard, RecordReturnDialog
    │   └── admin/               # DataTable, StatCard, ItemsByCategoryChart, ItemsOverTimeChart,
    │                            # ClaimsByStatusChart, UserFormDialog, CategoryFormDialog
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── BrowseItemsPage.jsx
    │   ├── ItemDetailPage.jsx
    │   ├── ReportItemPage.jsx
    │   ├── EditItemPage.jsx
    │   ├── MyItemsPage.jsx
    │   ├── MyClaimsPage.jsx
    │   ├── ClaimDetailPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── ProfilePage.jsx
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── ForgotPasswordPage.jsx
    │   ├── ResetPasswordPage.jsx
    │   ├── NotFoundPage.jsx
    │   └── admin/
    │       ├── AdminDashboardPage.jsx
    │       ├── AdminUsersPage.jsx
    │       ├── AdminUserDetailPage.jsx
    │       ├── AdminItemsPage.jsx
    │       ├── AdminCategoriesPage.jsx
    │       └── AdminClaimsPage.jsx
    ├── schemas/                 # zod schemas mirroring backend validation
    │   ├── auth.js
    │   ├── item.js
    │   ├── claim.js
    │   └── admin.js
    ├── utils/
    │   ├── constants.js         # enums, labels, sort whitelists
    │   ├── format.js            # dates, relative time
    │   ├── cn.js                # className joiner (hand-written, no clsx)
    │   ├── normalizeList.js     # accepts an array or { data: [] }
    │   └── safeNext.js          # validates ?next= redirects
    └── test/
        ├── setup.js
        ├── server.js            # MSW handlers
        └── *.test.jsx
```

Responsibilities:

- `api/*`: one function per endpoint, returns `response.data`. No React in here.
- `hooks/queries/*`: React Query hooks wrapping `api/*`, owning query keys and invalidation.
- `pages/*`: compose components and hooks; no business rules beyond "which buttons to show".
- `components/*`: presentational, receive data through props.
- `schemas/*`: zod, one source for form validation messages.

## 4. Environment

### `.env.example`

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Findora

# Cloudinary unsigned upload (frontend uploads the image, then sends the https URL to the API)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

`.gitignore` must include `.env`, `node_modules/`, `dist/`, `coverage/`.

Rules:

- All env access goes through `src/config.js`.
- If `VITE_CLOUDINARY_*` are empty, `ImageUploader` falls back to a plain "Paste an https image link" input. The app must still work without Cloudinary.
- Backend `IMAGE_ALLOWED_HOSTS` may restrict image hosts (C-16). If the API returns `422` about `image_url`, show the message under the image field.
- Do not set `withCredentials` on axios. The backend uses the `Authorization` header and `allow_credentials=False`.

## 5. Design Direction

Follow the `frontend-design` plugin's guidance, inside the tokens below: make deliberate choices for this subject, avoid generic defaults.

**Subject:** a community lost & found board. **Audience:** ordinary people, often stressed because they lost something, plus helpful strangers who found something. **Primary job:** let someone find or report an item in under a minute, and make the claim and handover feel safe and clear.

**Tone:** calm, reassuring, plain language. Sentence case. No jokes about loss. Errors state what happened and how to fix it, without apologizing.

**One memorable element:** the item card is a claim tag: a rounded rectangle with a notched edge and a small status stub on one side (color plus text of the status). Everything else stays quiet and disciplined. This card is a custom design; do not replace it with a generated component.

### Tokens (put in `src/index.css` under `@theme`)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#172033` | Text, headings |
| `paper` | `#F7F8FA` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs |
| `line` | `#DDE1E8` | Borders, dividers |
| `cobalt` | `#2F54EB` | Primary actions, links, focus ring |
| `found` | `#0E8F7E` | `found` type, success |
| `lost` | `#C2570C` | `lost` type |
| `danger` | `#C2273D` | Destructive actions, errors |

Status badge colors (always with text, never color alone):

| Status | Look |
|---|---|
| `open` | cobalt outline |
| `claimed` | amber tint |
| `returned` | found (teal) filled |
| `closed` | grey |
| `pending` | amber tint |
| `approved` | found (teal) filled |
| `rejected` | danger tint |

**Type:** two clearly different families, loaded with `font-display: swap`. Headings: *Bricolage Grotesque* (characterful, tight). Body and UI: *Public Sans* (very legible). Body line length under 75 characters. Always give a real fallback stack (`system-ui, sans-serif`).

**Layout:** max content width `72rem`, left-aligned text, generous whitespace. Card grid: 1 column on mobile, 2 on `sm`, 3 on `lg`. One border radius scale (`md` for inputs and buttons, `xl` for cards), not one radius for everything.

**Avoid** (generic tells): all-caps tracked eyebrow labels, a gradient hero, identical shadowed cards everywhere, `→` appended to every button, fade-in on every section, hover lift on every card. Motion only answers a user action (dialog open, toast, button pending). Respect `prefers-reduced-motion`.

**Copy rules:**

- Buttons say what happens: "Submit claim", "Approve claim", "Record handover", "Save changes". Not "Submit" or "OK".
- An action keeps its name everywhere: the "Close report" button produces a toast "Report closed".
- Empty states invite an action: "No items match your search. Clear filters or report what you lost."
- Never say a logout "revoked" a token. Say "You've been signed out on this device."
- Reset-password request: show the server's message exactly as returned.

## 6. API Layer

### 6.1 Client (`api/client.js`)

- One axios instance, `baseURL = config.apiBaseUrl`, `timeout = 30000`, JSON only (no `FormData`).
- Request interceptor: attach `Authorization: Bearer <access>` if an access token exists.
- Free hosting sleeps when idle. If a request takes longer than 5 seconds, show a non-blocking banner: "Waking up the server, this can take up to a minute." Hide it when the request settles.

### 6.2 Tokens (`api/tokens.js`)

- Access token: **memory only** (module variable).
- Refresh token: `localStorage` key `findora.refresh`.
- Exports: `getAccess()`, `getRefresh()`, `setTokens({access_token, refresh_token})`, `clearTokens()`.
- Cross-tab: listen to the `storage` event; if the refresh token disappears in another tab, sign out here too.

### 6.3 Refresh flow (response interceptor) (C-05, C-06)

The backend returns `401` with `detail` `"Token expired"` or `"Invalid token"`, and also `401` `"Invalid email or password"` on login. A wrong current password on change-password may also be a `401` with a different detail.

```text
On a 401 from any request except /auth/login, /auth/register, /auth/refresh,
/auth/forgot-password, /auth/reset-password:

  detail == "Token expired" and request not already retried:
      refreshOnce()  → POST /auth/refresh {refresh_token}
      success: store both new tokens, retry the original request once
      failure: signOutAndRedirect()

  detail == "Invalid token" and request not already retried:
      (Can mean: password changed in another tab, or user deactivated.)
      if a refresh token is in storage: refreshOnce() once
          success: store tokens, retry the original request once
          failure: signOutAndRedirect()
      else: signOutAndRedirect()

  any other 401 detail (e.g. wrong current password):
      do NOT sign out. Reject normally; the caller shows getErrorMessage().

signOutAndRedirect(): clearTokens(), reset auth state, queryClient.clear(),
  redirect to /login?next=<current path> (skip if already on /login).
```

`refreshOnce()` is **single-flight**: parallel `401`s share one refresh promise. Each refresh returns a **new** refresh token. Always overwrite the stored one.

### 6.4 Error normalization (`api/errors.js`)

Backend errors are `{"detail": "string"}` or, for `422`, FastAPI's `{"detail": [{"loc": ["body","field"], "msg": "...", "type": "..."}]}`.

```js
getErrorMessage(err)  // → one user-facing string
getFieldErrors(err)   // → { fieldName: "message" } from 422 detail array (last loc segment)
```

Rules:

- string `detail` → show as is.
- array `detail` → join messages, and map to form fields with `getFieldErrors` + `setError`.
- no response (network) → "Can't reach the server. Check your connection and try again."
- `429` → "Too many attempts. Wait a minute and try again." Ignore the response body (C-15).
- `500` → "Something went wrong on our side. Try again in a moment."
- `403` with an inactive account → "This account is deactivated. Contact an administrator." (C-07)

### 6.5 Status code handling matrix

| Code | UI behavior |
|---|---|
| `400` | Reset-password only: show "Reset link is invalid or has expired" with a link to request a new one. |
| `401` | Refresh flow (6.3). On login, show "Invalid email or password" on the form. |
| `403` | Toast the server message. On a page that needs the role, render a "You don't have access" screen (not a redirect loop). |
| `404` | Detail pages render a NotFound state ("This report doesn't exist or was removed."). |
| `409` | Toast or inline the server message (duplicate email, already claimed, item has claims, last admin, ...). Refetch the affected queries because state may have changed. |
| `422` | Map to form fields; unknown fields go to a form-level alert. |
| `429` | Toast with retry hint. Disable the submit button for 10 seconds. |

## 7. Endpoint Reference

Base URL `config.apiBaseUrl` (`/api/v1`). Access: **P** public, **A** authenticated, **O** owner/reporter, **Ad** admin. Paginated lists return `{ data, total, page, page_size, total_pages }`.

> The endpoints below that `API_DOCUMENTATION.md` once omitted (`/users/me`, `/users/me/dashboard`, `/users/{id}`, `/categories/{id}`, `/items/{id}/claims`) are now documented (C-01). Always confirm each shape against `/openapi.json` before coding it.

### 7.1 Auth

| Method | Path | Access | Frontend use |
|---|---|---|---|
| POST | `/auth/register` | P | Register form. `201` returns `UserPublic` (no tokens), so then call login or redirect to `/login`. |
| POST | `/auth/login` | P | Login form. Returns `access_token`, `refresh_token`, `token_type`, `expires_in`, `user`. |
| POST | `/auth/refresh` | P | Used only by the interceptor and boot. |
| GET | `/auth/me` | A | Current user (`email`, `phone`, `role`). |
| POST | `/auth/logout` | A | Best-effort call, then clear tokens locally either way. |
| PATCH | `/auth/change-password` | A | Returns fresh `TokenResponse`. **Replace stored tokens** or the user is logged out on the next call. |
| POST | `/auth/forgot-password` | P | Always the same `200` message. |
| POST | `/auth/reset-password` | P | Body `{ token, new_password }`. All tokens die; send the user to `/login`. |

`/auth/login/oauth2` exists only for Swagger UI. Never use it.

### 7.2 Users

| Method | Path | Access | Frontend use |
|---|---|---|---|
| PATCH | `/users/me` | A | Profile form (`full_name`, `phone`, both optional). Returns `UserMe`. Send only changed fields. To clear the phone, send `null`, never `""` (C-19). Then refresh `me`. |
| GET | `/users/me/dashboard` | A | User dashboard page. Shape in 11.8. |
| GET | `/users/{user_id}` | P | `UserPublic`. Optional "member since" line, shown only if `created_at` is present (C-04). |

### 7.3 Categories

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | P | Active only, optional `search`. Shape differs between docs (C-02): always use `normalizeList(res)`. |
| GET | `/categories/{id}` | P | Active only. Rarely needed. |
| POST | `/categories` | Ad | Create. |
| PATCH | `/categories/{id}` | Ad | Update `name`, `description`, `is_active`. |
| DELETE | `/categories/{id}` | Ad | `204`, or `409` if referenced ("deactivate instead"). |
| GET | `/admin/categories` | Ad | Includes inactive plus `items_count`. Params: `search`, `is_active`, `sort_by` ∈ {`name`,`created_at`}. Also use `normalizeList`. |

### 7.4 Items

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/items` | P | Excludes `closed`. Params below. |
| GET | `/items/my-items` | A | Same params, **includes `closed`**. Always a fixed path; never build it from an ID. |
| GET | `/items/{id}` | P | `ItemResponse`. |
| POST | `/items` | A | `201`. Status starts `open`. |
| PATCH | `/items/{id}` | O/Ad | Owner only while `open`. Admin any except `returned`. Partial body (C-14). |
| PATCH | `/items/{id}/close` | O/Ad | Allowed from `open` or `claimed`. Not from `returned`. |
| DELETE | `/items/{id}` | O/Ad | `204`; `409` if the item has claims. |

List params for `GET /items` and `/items/my-items`:

| Param | Values |
|---|---|
| `search` | free text (title, description) or an exact UUID |
| `item_type` | `lost` \| `found` |
| `category_id` | UUID |
| `status` | `open` \| `claimed` \| `returned` (plus `closed` on my-items) |
| `start_date`, `end_date` | ISO8601, filter `event_date`; `start > end` is `422` |
| `sort_by` | `created_at` (default) \| `event_date` \| `title` |
| `order` | `desc` (default) \| `asc` |
| `page` | ≥ 1 |
| `page_size` | 1–100 (API default 10, UI default 12; always send it explicitly) |

`ItemResponse`: `id, title, description, item_type, status, location, event_date, image_url, category{id,name}, reporter{id,full_name}, created_at, updated_at`. It never contains email, phone, or proof, and has **no claims count** (C-09).

### 7.5 Claims

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/items/{item_id}/claims` | A | Body `{ownership_proof}` 10–2000 chars. `201`, status `pending`. |
| GET | `/claims/my-claims` | A | Params: `status`, `start_date`, `end_date`, `sort_by` ∈ {`created_at`,`status`}, `order`, `page`, `page_size`. |
| GET | `/items/{item_id}/claims` | O/Ad | **Required** for the reporter to review claims. Documented without its list params; assume the same as `/claims/my-claims` and confirm (C-01). `403` for anyone else. |
| GET | `/claims/{id}` | Claimant/Reporter/Ad | Proof and contact are conditional. |
| PATCH | `/claims/{id}/review` | Reporter/Ad | Body `{status: "approved"\|"rejected", review_note?}` (≤ 1000). |
| DELETE | `/claims/{id}` | Claimant | `204`; only while `pending`, else `409`. |

`ClaimResponse`: `id, status, ownership_proof?, review_note, reviewed_at, item{id,title,item_type,status}, claimant{id,full_name}, counterparty_contact?{full_name,email,phone?}, created_at, updated_at`.

- Treat `ownership_proof` and `counterparty_contact` as **optional**. Render them only if present.
- `counterparty_contact` appears only when `status === "approved"`, and only for the claimant and reporter. For the claimant it is the reporter's contact; for the reporter it is the claimant's.

### 7.6 Returns

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/claims/{claim_id}/return` | Reporter/Ad | Body `{notes?}` only. `201` → `ItemReturnResponse`. |
| GET | `/returns/{return_id}` | Claimant/Reporter/Ad | |
| GET | `/items/{item_id}/return` | Claimant/Reporter/Ad | `404` means "not returned yet", not an error screen. |

`ItemReturnResponse` fields are not listed in `API_DOCUMENTATION.md`. Expect `id, item_id, claim_id, returned_by, received_by, returned_at, notes`; confirm in `/openapi.json`. The two user fields are UUIDs, so the UI shows the date and notes, not IDs (C-11).

### 7.7 Admin (all `Ad`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | `total_users, active_users, total_lost_items, total_found_items, open_items, pending_claims, returned_items, items_by_category[{category,count}], items_over_time (per day, last 30 days), claims_by_status[{status,count}]`. Confirm the shape in `/openapi.json`. |
| GET | `/admin/users` | `search`, `role`, `is_active`, `start_date`, `end_date`, `sort_by` ∈ {`created_at`,`full_name`,`email`}, `order`, paging. |
| POST | `/admin/users` | `full_name, email, password, role?` only (C-13). Same validation as register. |
| GET | `/admin/users/{id}` | Safe fields only. |
| PATCH | `/admin/users/{id}/status` | Activate or deactivate. Body shape: `AdminUserStatusUpdate` in `/openapi.json`. |
| PATCH | `/admin/users/{id}/role` | Body: `AdminUserRoleUpdate`. |
| DELETE | `/admin/users/{id}` | `204`; `409` if the user has history or is the last active admin. |
| GET | `/admin/items` | Same as `/items` plus `user_id`; `status=closed` allowed; `sort_by` also allows `status`. |
| PATCH | `/admin/items/{id}/status` | **Only `open` ↔ `closed`** (`ItemStatusUpdate`). Also how an admin reopens. |
| DELETE | `/admin/items/{id}` | `204`; `409` if claims exist. |
| GET | `/admin/claims` | `search`, `status`, `item_id`, `claimant_id`, dates, `sort_by` ∈ {`created_at`,`status`}. |
| GET | `/admin/claims/pending` | Same without `status`. |

Last-admin guard: any `409` from status, role, or delete is shown verbatim in a toast and the row state is refetched.

## 8. Validation (zod schemas mirror the backend)

| Field | Rule |
|---|---|
| `full_name` | trimmed, 2–100 |
| `email` | valid email, ≤ 255; lowercase and trim before sending |
| `phone` | optional, only digits, `+`, spaces, `-`, ≤ 30. Send `undefined` (not `""`) when empty |
| `password` | min 8, at least one letter and one digit, **max 72 bytes in UTF-8** (`new TextEncoder().encode(v).length <= 72`) |
| `new_password` (change) | same rules, and must differ from `current_password` |
| `title` | 3–200 |
| `description` | min 10 |
| `item_type` | `lost` \| `found` |
| `category_id` | required, chosen from active categories |
| `location` | required, ≤ 255 |
| `event_date` | required, **not in the future** |
| `image_url` | optional, must start with `https://`, ≤ 500 |
| `ownership_proof` | 10–2000, show a live character counter |
| `review_note` | optional, ≤ 1000 |
| category `name` | 2–100 |

Rules:

- The backend rejects unknown fields (`extra="forbid"`). Send **only** the documented fields. For `PATCH /items/{id}`, send only the changed fields.
- `event_date`: use `<input type="datetime-local" max={now}>`. Convert to ISO UTC with `new Date(value).toISOString()`. Clamp to `min(picked, now - 60s)` before sending so a slightly fast device clock cannot cause a `422`.
- Date range filters: if `start_date > end_date`, block the request and show an inline message (the API would return `422`).
- Never silently truncate a password over 72 bytes. Show the validation error.

## 9. Auth State

`AuthContext` exposes `{ user, isAuthenticated, isAdmin, isLoading, login, register, logout, refreshMe, applyTokenResponse }`.

**Boot sequence:**

1. If no refresh token in storage → `isLoading=false`, anonymous.
2. Else `POST /auth/refresh`; on success store tokens, set `user` from the response, `isLoading=false`.
3. On failure → `clearTokens()`, anonymous.
4. While `isLoading`, render a full-page splash. Never flash the login page for a signed-in user.

**`applyTokenResponse(res)`:** stores both tokens and sets `user`. If `res.user.role` is `undefined`, call `GET /auth/me` once and use that user instead (C-04). This fallback is probably required, because `UserPublic` is also the public-profile schema and likely has no `role`.

**login:** call the API, `applyTokenResponse(res)`. Do not navigate from the login page; `GuestRoute` performs the redirect (section 10, S-01).

**register:** `201` returns a user without tokens. After success, call login with the same credentials; if auto-login fails, redirect to `/login` with a toast.

**logout:** best-effort `POST /auth/logout`, then `clearTokens()`, `queryClient.clear()`, navigate to `/`. Toast: "You've been signed out on this device."

**change password:** on `200` call `applyTokenResponse` with the returned tokens. If you skip this, every following request returns `401`.

**reset password:** on success toast "Password updated. Sign in with your new password." and go to `/login`.

`isAdmin = user?.role === "admin"`. This only toggles navigation and screens; the server enforces.

## 10. Routing

| Path | Page | Guard |
|---|---|---|
| `/` | `HomePage` | public |
| `/items` | `BrowseItemsPage` | public |
| `/items/:id` | `ItemDetailPage` | public |
| `/login` | `LoginPage` | `GuestRoute` |
| `/register` | `RegisterPage` | `GuestRoute` |
| `/forgot-password` | `ForgotPasswordPage` | `GuestRoute` |
| `/reset-password` | `ResetPasswordPage` (reads `?token=`) | public |
| `/report` | `ReportItemPage` (accepts `?type=lost\|found`) | `ProtectedRoute` |
| `/items/:id/edit` | `EditItemPage` | `ProtectedRoute` |
| `/my-items` | `MyItemsPage` | `ProtectedRoute` |
| `/my-claims` | `MyClaimsPage` | `ProtectedRoute` |
| `/claims/:id` | `ClaimDetailPage` | `ProtectedRoute` |
| `/dashboard` | `DashboardPage` | `ProtectedRoute` |
| `/profile` | `ProfilePage` (details + change password) | `ProtectedRoute` |
| `/admin` | `AdminDashboardPage` | `AdminRoute` |
| `/admin/users` | `AdminUsersPage` | `AdminRoute` |
| `/admin/users/:id` | `AdminUserDetailPage` | `AdminRoute` |
| `/admin/items` | `AdminItemsPage` | `AdminRoute` |
| `/admin/categories` | `AdminCategoriesPage` | `AdminRoute` |
| `/admin/claims` | `AdminClaimsPage` (tab for pending) | `AdminRoute` |
| `*` | `NotFoundPage` | public |

- `GuestRoute` (S-01): a signed-in user is redirected to `safeNext(location.search)`, which returns the `?next=` path if valid, else `/`. It does not simply send everyone to `/`.
- `safeNext` (S-02): accept only a string that starts with a single `/`, does not start with `//`, and contains no `://` or backslash. Otherwise return `/`. Admins are not forced to `/admin`.
- `ProtectedRoute`: anonymous → `/login?next=<path>`.
- `AdminRoute`: anonymous → login; non-admin → "You don't have access" screen.
- Routes are lazy-loaded (`React.lazy`) for admin pages at minimum.
- Navbar: logo, Browse, Report an item (primary button), then either Log in / Sign up or a user menu (Dashboard, My reports, My claims, Profile, Admin if admin, Sign out). Collapses to a menu on mobile.

## 11. Screens and Behavior

### 11.1 Home

Primary job: search or report fast. Top: a single search box (title, description, or ID) that navigates to `/items?search=...`, plus two clear actions: "I lost something" → `/report?type=lost` and "I found something" → `/report?type=found`. Below: the latest 6 items (`GET /items?page_size=6`). No marketing filler, no fake stats. Anonymous users clicking a report action pass through login and return via `?next=`.

### 11.2 Browse (`/items`)

- Filters: search (debounced 400 ms), type (All/Lost/Found), category, status, date range, sort, order.
- **All filter, sort, and page state lives in the URL** (`useListParams`), so refresh and sharing work. Changing any filter resets `page` to 1.
- Status filter options on this public page: Open, Claimed, Returned (the API never returns `closed` here).
- Results as `ItemGrid` of `ItemCard`s, with `Pagination` and a "Showing X–Y of Z" line.
- A page beyond the last returns `200` with empty data: detect `total > 0 && data.length === 0` and jump to the last page.
- Empty: "No items match your search" with "Clear filters" and a "Report what you lost" link.
- Keep previous data visible while fetching the next page (`placeholderData: keepPreviousData`).

`ItemCard` (the claim tag): image (or a neutral placeholder), type badge (Lost/Found), title, location, event date, category, status stub. The whole card is one link to `/items/:id`.

### 11.3 Item detail (`/items/:id`)

Shows image, title, type and status badges, description, location, event date, category, reporter name, posted date, and a small copyable "Report ID" line.

Viewer logic (computed from `useAuth()` and the item):

```text
isReporter = user && item.reporter.id === user.id
isAdmin    = user?.role === "admin"
```

| Viewer | Item state | Shown |
|---|---|---|
| Anyone | `lost` | "Found this item? Post a found report and the owner can contact you." with button → `/report?type=found`. **No claim form** (only `found` items can be claimed). |
| Anonymous | `found` + `open` | "Log in to claim this item" → `/login?next=/items/:id` |
| Signed-in non-reporter | `found` + `open` | `ClaimForm` (proof textarea, counter, "Submit claim") |
| Signed-in non-reporter | `found`, not `open` | "This item is no longer open for claims." plus "If you submitted a claim, you can find it in My claims." (C-08) |
| Reporter | `open` | Edit, Close report, Delete, plus the claims panel (found items) |
| Reporter | `claimed` | Close report, claims panel (approved claim, contact, "Record handover") |
| Reporter | `returned` | Read-only, return record card. No edit, close, or delete. |
| Reporter | `closed` | **Delete only** (server decides; `409` handled). No edit or close. (C-10) |
| Admin (not reporter) | any | Same moderation as the reporter where allowed (edit if not `returned`, close if `open` or `claimed`, delete if not `returned`), plus "Reopen" if `closed` via `PATCH /admin/items/{id}/status {status:"open"}` |

Notes:

- `ItemResponse` carries no claims count, so **Delete is shown for the reporter and admin on non-returned items**. The `409` ("Item has claims; close it instead") is handled by a toast plus a hint to use "Close report" (C-09).
- After a `409` on claim create (duplicate claim or not open), refetch the item and show the server message with a link to My claims.
- Claims panel for reporter and admin: `GET /items/{id}/claims`, a list of `ClaimCard`s with claimant name, date, status, and the proof (visible to authorized viewers). Pending claims have "Approve" and "Reject" (dialog with optional note). **Hide review actions on a claim whose claimant is the current user** (an admin cannot review their own claim).
- Approval confirmation text: "Approving this claim rejects all other pending claims for this item and marks it as claimed."
- An approved claim shows `ContactCard` (name, email as `mailto:`, phone as `tel:` if present) and, while the item is `claimed`, a "Record handover" button (dialog with optional notes).
- For `returned` items, fetch `GET /items/{id}/return` only when the viewer is the reporter, claimant, or admin; a `403` or `404` simply hides the card.
- Edit, close, delete, and reopen use `ConfirmDialog` for destructive actions.

### 11.4 Report item (`/report`) and Edit (`/items/:id/edit`)

One `ItemForm` for both. Fields in order: type (segmented control, preselected from `?type=`), title, category (active categories), description, location, date and time it was lost or found, photo (`ImageUploader`).

- `ImageUploader`: pick a file (jpg, png, webp, ≤ 5 MB), upload to Cloudinary unsigned (`POST https://api.cloudinary.com/v1_1/<cloud>/image/upload` with `upload_preset`), preview it, and store the returned `secure_url` in the form. Provide "Remove". Fall back to a pasted `https://` link when Cloudinary is not configured. This upload uses plain `axios` outside the API client so no auth header leaks to a third party.
- Edit: prefill, send only changed fields. Owners can edit only while `open`; if the item is not editable, show a read-only message and a link back (the server also returns an error). If `item_type` is not editable per `/openapi.json`, show it read-only (C-14).
- Empty category list (admin has none active): show "No categories are available yet" and disable submit.
- Success: toast "Report published" → navigate to `/items/:id`.
- Privacy hint near the description: "Don't include the secret details only the owner would know. Those are asked for when someone claims it."

### 11.5 My reports (`/my-items`)

`GET /items/my-items`, same filter UI as browse (status filter includes Closed). Each card shows the status stub and quick actions (Open, Edit if `open`, Close if `open` or `claimed`). A "N pending claims" badge is **not available** from `ItemResponse`; do not fake it. The dashboard gives pending-claim counts (11.8).

### 11.6 My claims (`/my-claims`)

List with filters (`status`, dates, sort). Each row: item title (link to `/items/:id`), claim status badge, date. Pending rows have "Withdraw claim" (confirm). Approved rows show "View contact details" → `/claims/:id`. Withdrawing a reviewed claim returns `409`: show the server message and refetch.

### 11.7 Claim detail (`/claims/:id`)

`isClaimant = claim.claimant.id === user.id`; otherwise the viewer is the reporter or an admin (the API returns `403` for anyone else; show the "no access" screen). The response has no reporter ID, so do not try to distinguish reporter from admin (C-12).

| Condition | Shown |
|---|---|
| Always | Item summary (link), claimant name, status, dates, review note |
| `ownership_proof` present | Proof block |
| `counterparty_contact` present | `ContactCard`: label "Reporter's contact" for the claimant, "Claimant's contact" otherwise |
| `pending` + `isClaimant` | "Withdraw claim" |
| `pending` + not claimant | "Approve claim" / "Reject claim" |
| `approved` + not claimant + `claim.item.status === "claimed"` | "Record handover" |
| `claim.item.status === "returned"` | `ReturnRecordCard` from `GET /items/{id}/return` |

Handover helper text: "Contact details are shared so you can arrange the handover. Findora has no chat."

### 11.8 Dashboard (`/dashboard`)

`GET /users/me/dashboard` returns `UserDashboard` (documented in `API_DOCUMENTATION.md`; confirm in `/openapi.json`):

```text
my_items_total              number
my_items_by_status          { open, claimed, returned, closed }   counts
my_items_by_type            { lost, found }                       counts
my_claims_by_status         { pending, approved, rejected }       counts
pending_claims_on_my_items  { count, recent: [ { id, claimant{id, full_name}, created_at } ] }   up to 5
recent_items                ItemResponse[]                        last 5 reports
```

Screen:

- Summary tiles for my reports (total, by status, by type) and my claims by status. **Default any missing key to `0`**; never assume every key is present (C-18).
- "Claims waiting on my items": the count plus up to 5 recent rows. Each row shows the claimant name and relative date and links to `/claims/:id`. The entries carry no item info, so show an item title only if `/openapi.json` has one (C-18).
- "My recent reports": `recent_items`, as compact item cards linking to `/items/:id`.
- Quick actions: Report an item, Browse.

### 11.9 Profile (`/profile`)

Two cards. Details: email (read-only), full name, phone → `PATCH /users/me`. Send only changed fields; to clear the phone send `phone: null`, never `""` (C-19). Change password: current, new, confirm → `PATCH /auth/change-password`, then `applyTokenResponse` (section 9). A wrong current password is shown as a form error and never signs the user out (C-05). Password inputs have a show/hide toggle and `autocomplete` attributes.

### 11.10 Auth screens

- **Login**: email, password, "Forgot password?" link. Generic error from server. Inactive → `403` message. Redirect handled by `GuestRoute` (honors `?next=`).
- **Register**: full name, email, phone (optional), password with a live rule checklist (8+ chars, letter, digit, ≤ 72 bytes). Duplicate email `409` shows under the email field. Do **not** send `role`.
- **Forgot password**: email only; show the server's generic success message even for unknown emails. Disable the button 10 s after submit (limit is 5 per minute).
- **Reset password**: read `token` from the URL. No token → "This reset link is incomplete" with a link to request a new one. Submit `{token, new_password}`. `400` → "Reset link is invalid or has expired" plus "Request a new link". Reset links work once.

### 11.11 Admin panel

`AdminLayout` with a sidebar (Dashboard, Users, Items, Categories, Claims), collapsing to a top menu on mobile.

- **Dashboard**: stat cards (`total_users`, `active_users`, `total_lost_items`, `total_found_items`, `open_items`, `pending_claims`, `returned_items`) and three charts (items by category: bar, items over time: line, claims by status: bar). Charts need text alternatives (a hidden data table or an `aria-label` summary).
- **Users**: table with search (name, email, ID), role, active, date filters, sorting, paging. Row actions: view, activate or deactivate, change role, delete (all with confirm). "Create user" dialog (`full_name`, `email`, `password`, `role`; C-13). A `409` (last active admin, user has history) shows the server message verbatim. Disable actions on your own row where deactivating or demoting yourself would be risky, but still rely on the server.
- **User detail**: safe fields only.
- **Items**: table with the item filters plus `user_id`; row actions: view, edit (not `returned`), toggle `open` ↔ `closed` (only these two; hide for `claimed` and `returned`), delete (confirm; `409` handled).
- **Categories**: table with `items_count`, search, active filter. Create and edit dialog (`name`, `description`, `is_active`). Delete only offered when `items_count === 0`; otherwise offer "Deactivate". `409` handled.
- **Claims**: tabs All / Pending, filters (`search`, `status`, `item_id`, `claimant_id`, dates), sorting, paging. Row links to `/claims/:id` for review.

`DataTable` is a small reusable component: columns config, loading skeleton rows, empty state, sortable headers (only whitelisted `sort_by` values), responsive horizontal scroll container.

## 12. Server State (React Query)

Defaults: `staleTime` 30 s, `retry` 1 (never retry `401`, `403`, `404`, `409`, `422`), `refetchOnWindowFocus` off for forms and on for lists. For the Admin Dashboard, set `refetchInterval: 60000`.

Query keys (always arrays, params last):

```text
["me"]                         ["categories", params]
["items", params]              ["admin","categories", params]
["items","mine", params]       ["item", id]
["item", id, "claims", params] ["item", id, "return"]
["claims","mine", params]      ["claim", id]
["user","dashboard"]           ["admin","dashboard"]
["admin","users", params]      ["admin","user", id]
["admin","items", params]      ["admin","claims", params]
```

Invalidation after mutations:

| Mutation | Invalidate |
|---|---|
| create item | `["items"]`, `["items","mine"]`, `["user","dashboard"]` |
| update, close, reopen item | `["item", id]`, `["items"]`, `["items","mine"]`, `["admin","items"]` |
| delete item | `["items"]`, `["items","mine"]`, `["admin","items"]`, `["user","dashboard"]` |
| create claim | `["claims","mine"]`, `["item", id]`, `["user","dashboard"]` |
| withdraw claim | `["claims","mine"]`, `["claim", id]`, `["item", itemId, "claims"]` |
| review claim | `["claim", id]`, `["item", itemId]`, `["item", itemId, "claims"]`, `["items"]`, `["admin","claims"]`, `["user","dashboard"]` |
| record return | `["item", itemId]`, `["item", itemId, "return"]`, `["claim", id]`, `["items"]` |
| category create, update, delete | `["categories"]`, `["admin","categories"]` |
| admin user or item changes | the matching `["admin", ...]` keys and `["admin","dashboard"]` |
| login, logout | clear the whole cache |

No optimistic updates in v1. Server transactions decide the final state.

## 13. Business Rule Cheat Sheet (for UI gating)

```text
Item:   open ──approve claim──▶ claimed ──record return──▶ returned (terminal)
        open | claimed ──close──▶ closed
        closed ──admin reopen──▶ open
Claim:  pending ──▶ approved | rejected   (both terminal; withdraw = delete while pending)
```

| Action | Allowed when |
|---|---|
| Edit item | owner and `open`; admin and not `returned` |
| Close item | owner or admin, and `open` or `claimed` |
| Reopen item | admin only, item `closed` |
| Delete item | owner or admin, no claims, not `returned` (server decides) |
| Create claim | signed in, item `found` and `open`, not the reporter, no earlier claim by me |
| Review claim | reporter or admin, claim `pending`, reviewer is **not** the claimant, item `open` for approval |
| Withdraw claim | claimant, claim `pending` |
| Record return | reporter or admin (never the claimant), claim `approved`, item `claimed` |

Approving a claim auto-rejects every other pending claim; the reporter's UI must refetch the claims list afterwards. Pending claims on a `closed` item stay pending but cannot be approved: if approval returns `409`, show the server message.

## 14. Utilities and UX Details

- **Dates:** the API sends UTC ISO strings. Display in the user's local time with `date-fns` (`d MMM yyyy, h:mm a`), with relative time ("2 days ago") for lists and the absolute time in a `title` attribute.
- **Search by ID:** the same search box accepts a UUID. Placeholder: "Search by title, description, or report ID".
- **Debounce:** 400 ms for search inputs; other filters apply immediately.
- **Pagination component:** prev and next plus page numbers (window of 5), disabled at bounds, `aria-current` on the active page, scroll to top on page change.
- **Skeletons:** card-shaped for grids, row-shaped for tables.
- **Toasts:** `sonner`, bottom-right on desktop, top on mobile; one message per action, reuse the button's verb ("Claim submitted", "Report closed", "Category deactivated").
- **Modal and ConfirmDialog (S-04):** build on the native `<dialog>` element with `showModal()` for the focus trap, `Esc`, and backdrop. Return focus to the opener on close. Confirm dialogs are used for delete, close, deactivate, role change, reject, withdraw, and approve (approve explains the auto-reject effect).
- **Images:** `loading="lazy"`, fixed aspect ratio box to avoid layout shift, `alt` = item title, graceful placeholder on load error.
- **Page titles:** set `document.title` per page ("Browse items · Findora").
- **External links** (`mailto`, `tel`) only on `counterparty_contact`.
- **Never** show a raw UUID as a primary label; show titles and names. Show IDs only in a small, copyable "Report ID" line (useful for ID search).

## 15. Testing

Use Vitest + React Testing Library + MSW (mock the API at the network layer; do not mock `axios`).

**API layer and auth**
- Request attaches the bearer token; refresh token stored in `localStorage`, access token not.
- On `401 "Token expired"`: one refresh call, the original request retried once with the new token; parallel `401`s trigger a **single** refresh.
- Refresh failure clears tokens and redirects to `/login?next=...`.
- On `401 "Invalid token"`: one refresh attempt with the stored refresh token; sign out only if it fails (C-06).
- `401 "Invalid email or password"` on login does **not** trigger refresh.
- A `401` with any other detail on change-password does **not** sign the user out (C-05).
- Change password replaces stored tokens with the returned ones.
- `applyTokenResponse` calls `/auth/me` when `user.role` is missing (C-04).
- `getErrorMessage` handles string detail, `422` array detail, network error, `429` (body ignored), `500`.
- `normalizeList` accepts an array and `{ data: [] }`.
- `safeNext` rejects `//evil.com`, `https://evil.com`, backslashes, and non-slash values (S-02).

**Routing and guards**
- Anonymous on a protected route → login with `next`; after login returns to the page (via `GuestRoute`, S-01).
- Non-admin on `/admin` sees the no-access screen; admin sees the panel.
- Signed-in user on `/login` is redirected away.

**Forms**
- Register: password rules (too short, no digit, no letter, over 72 bytes), `role` is never sent.
- Item form: future date blocked, non-https image URL blocked, description under 10 chars blocked, only changed fields sent on edit.
- Claim form: proof 10–2000, counter works.
- Server `422` messages map to the right fields.

**Screens**
- Browse: filters write to the URL, changing a filter resets page to 1, empty state, out-of-range page recovers.
- Item detail: the matrix in 11.3 (lost item shows no claim form; own item shows no claim form; found + open shows it; reporter sees the claims panel; closed shows Delete only; admin cannot review their own claim).
- Claim detail: contact card only when `counterparty_contact` exists; proof only when present; "Record handover" hidden for the claimant.
- Review flow: approve → claims list refetched.
- Dashboard: missing count keys render as `0`; recent claim rows link to `/claims/:id` (C-18).
- Auth: login and refresh responses with and without `user.role` both end with a correct `isAdmin` (C-04).
- Admin: users table actions call the right endpoints; `409` message shown; item moderation offers only open ↔ closed.

**Accessibility smoke:** every input has a label; dialogs trap focus; pages have one `h1`.

## 16. Implementation Order

Work in small stages. Each stage follows the recipe in section 21. Before moving on: `npm run lint`, `npm test`, `npm run build` all pass, and the stage report is written.

1. **Foundation:** inspect the repo. Vite + React, Tailwind v4, `.gitignore`, `.env.example`, `config.js`, design tokens and fonts in `index.css`, ESLint and Vitest setup, router shell, providers, folder structure, base `ui/` components (Button, Input, FormField, Badge, Modal, ConfirmDialog, Spinner, Skeleton, EmptyState, ErrorState, Pagination), `normalizeList`, `safeNext`. Fetch `/openapi.json`, write `api/types.js`, and update every `OPEN` entry in `api_conflict.md` that it answers (C-03, C-04, C-05, C-07, C-13, C-14, C-18, C-19).
2. **API client and auth:** `tokens.js`, `client.js` (interceptors, single-flight refresh, section 6.3), `errors.js`, `api/auth.js`, `AuthContext` with the boot sequence, guards, Login, Register, Forgot, Reset, Profile (change password). Tests for section 15 (API layer, guards, forms). Manual two-tab test for C-06.
3. **Layout and public browsing:** Navbar, footer, Home, Browse (URL-synced filters, pagination), `ItemCard`, Item detail (read-only part), categories hook with `normalizeList`.
4. **Reporting:** `ItemForm`, `ImageUploader`, Report, Edit, My reports, close, delete, and reopen actions with confirms. Verify C-14 and C-16.
5. **Claims:** `ClaimForm`, reporter claims panel, review dialogs, My claims, Claim detail, withdraw, `ContactCard`.
6. **Returns:** `RecordReturnDialog`, `ReturnRecordCard`, handover flow on item and claim pages. Verify C-11.
7. **Dashboards:** user dashboard, admin layout, admin dashboard with charts.
8. **Admin management:** users, user detail, items, categories, claims, all `409` paths. Verify C-07.
9. **Polish and release:** empty, error, and loading audit, accessibility pass, responsive check at 360 / 768 / 1280, page titles, full test run, README, deployment.

## 17. Deployment

Recommended: Vercel or Netlify (static SPA).

1. Build: `npm run build`, output `dist/`.
2. **SPA fallback is required** so refreshing `/items/123` or opening `/reset-password?token=...` does not 404.
   - Vercel: `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`
   - Netlify: `public/_redirects` containing `/*  /index.html  200`
3. Set `VITE_API_BASE_URL` to the live backend URL including `/api/v1` (HTTPS, no trailing slash).
4. Backend settings must match the deployed frontend: `CORS_ORIGINS` and `FRONTEND_URL` equal the deployed origin with no trailing slash, otherwise browser requests fail and reset links point to the wrong place.
5. Verify on the live URL: register, login, browse, create a report, claim from a second account, approve, record handover, password reset email link, admin panel.

`README.md` must contain: setup steps, run commands (`npm install`, `npm run dev`, `npm run build`, `npm test`), env variables, how to point at the backend, the live frontend URL, demo credentials (copied from the backend README), and these notes: the first request after idle can be slow on free hosting, logout clears tokens on this device only, and image upload needs Cloudinary settings (or paste an https link).

## 18. Definition of Done

- Every screen in section 11 exists and handles loading, error, empty, and data states.
- Every endpoint in section 7 that the UI needs is wrapped in `src/api/*`, or any omission is clearly reported.
- Token handling follows sections 6 and 9: access token in memory, single-flight refresh, tokens replaced after change password, no stale-token loops, no sign-out on unrelated `401`s.
- All role and state gating follows section 13, and every server rejection (`401`, `403`, `404`, `409`, `422`, `429`) shows a clear message instead of a broken screen.
- Lost items never show a claim form; found-item claim, review, contact exchange, and handover work end to end against the real backend.
- Filters, sort, and page are URL-synced and work together on every list screen.
- No endpoint, field, or enum is used that is not in the backend; no secrets or tokens logged.
- The app is usable at 360px, keyboard navigable, and passes the accessibility smoke tests.
- `npm run lint`, `npm test`, and `npm run build` succeed.
- Every `OPEN` entry in `api_conflict.md` is verified and updated.
- Every stage report lists each tool used (`compound-engineering`, `frontend-design`, `21st`, `context7`, `pyright-lsp`) or why it was skipped (20.8).
- The frontend is deployed, CORS works with the live backend, and the README lists the live URL.

## 19. Known Backend Mismatches

The living list is `api_conflict.md`. Summary of what drives the code today (`API_DOCUMENTATION.md` was partly updated on 2026-10-22, C-20):

1. `GET /categories` and `/admin/categories`: array or `Page` is still undocumented → `normalizeList` (C-02).
2. The five previously missing endpoints are now documented (C-01, resolved). The claims list for an item still lacks its param list.
3. Schemas still only named: `AdminDashboard`, `ItemReturnResponse`, `AdminUserCreate`, `AdminUserStatusUpdate`, `AdminUserRoleUpdate`, `ItemStatusUpdate`, `CategoryCreate`, `CategoryUpdate`, `CategoryAdminResponse`, `ItemUpdate`, `UserPublic`, `UserMe`, `TokenResponse` → read from `/openapi.json` (C-03). `UserDashboard` is defined (11.8, C-18).
4. Confirmed limits: `ItemResponse` has no claims count and no "my claim" flag, and `/claims/my-claims` has no `item_id` filter → Delete is attempted and `409` handled; no claim badge on cards (C-08, C-09).
5. `/auth/register` returns the user but no tokens → the client logs in right after.
6. `TokenResponse.user` probably has no `role` → `/auth/me` fallback is required (C-04).
7. Unverified behaviors: wrong current password status, `429` body, deactivated-token response, `404` on `/items/{id}/return` (C-05, C-07, C-15, C-11).

## 20. Tooling: plugins and MCP

Installed for this project: plugins `compound-engineering`, `frontend-design`, `21st` (7 skills), `pyright-lsp`; MCP servers `21st` and `context7`. Command and tool names can differ between versions. At the start of Stage 1, run `/help`, `/plugin`, and `/mcp`, confirm each tool is connected, and use the names that are actually installed. If one is missing, tell the user and continue without it.

### 20.1 Who does what

| Tool | Role in this project | Hard limits |
|---|---|---|
| `compound-engineering` | Plan → deepen → work → review → compound loop for every stage | No autonomous chains (`/lfg`, `/slfg`, `/lrj`) unless asked. No push or PR without asking |
| `frontend-design` | Composition, hierarchy, empty and error states, the claim-tag card | Section 5 tokens, fonts, tone, and "avoid" list always win |
| `21st` plugin + MCP | Explore (`21st-ui-explore`), draft (`21st-ui-build`), review (`21st-ui-review`), read-only registry lookup (`21st-registry`) | Draft only; adapt per 20.3. No installs, themes, design sync, or account changes unless asked (T-08) |
| `context7` MCP | Current library docs | Docs only; never chooses dependencies |
| `pyright-lsp` | Read-only lookup of backend schemas when `/openapi.json` is unclear (20.6) | Never edits backend, never used on frontend JavaScript |

### 20.2 Context7: when to look things up

Before writing code with any of these, query Context7 for the version in `package.json` and follow it over memory: TanStack Query (v5 API: `keepPreviousData`, object-style hooks), Tailwind CSS v4 (`@theme`, `@import "tailwindcss"`, the Vite plugin), React Router (version differences between v6 and v7 imports), react-hook-form, zod (v3 vs v4 differences) with `@hookform/resolvers`, Vitest, MSW (v2 handlers), recharts, sonner, date-fns, Vite. If Context7 and memory disagree, Context7 wins; if Context7 has nothing, say so and prefer the library's own docs.

### 20.3 Using 21st safely (T-01, T-02)

Use it in this order: **explore** (`21st-ui-explore`, look at similar patterns) → **build** (`21st-ui-build`, draft one component) → **review** (`21st-ui-review`, check the adapted result). Registry lookups (`21st-registry`) are read-only. The MCP tools under `mcp__plugin_21st_21st__` (components, templates) are for inspiration only.

Not allowed unless the user explicitly asks: installing registry components or running any 21st CLI command that writes files or adds dependencies (`21st-cli-use`), applying 21st themes (the tokens in section 5 are the theme), `21st-design-sync`, creating or editing bookmarks or other items in the user's 21st account, and video assets.

Where it fits: `DataTable`, `Pagination`, `StatCard`, the home search box, `EmptyState`, `Skeleton`, dialog layouts, the admin sidebar. Where it does not: `ItemCard` (custom claim tag), anything in `api/`, `hooks/`, `context/`, `routes/`, `schemas/`.

Adaptation checklist before a generated component is saved:

1. JSX with JSDoc props, not TSX.
2. Tailwind v4 classes using project tokens (`bg-surface`, `text-ink`, `border-line`, `text-cobalt`, `bg-danger`). No hard-coded hex values, no gradients, no stray shadows.
3. Radii follow the scale: `md` for inputs and buttons, `xl` for cards.
4. No new dependency. Remove Radix, `cva`, `clsx`, `tailwind-merge`, `framer-motion`. Use `utils/cn.js`.
5. No decorative motion. Respect `prefers-reduced-motion`.
6. Accessibility: labels, focus ring, semantic elements, `aria-live` where needed.
7. The component sits in the folder and file name listed in section 3.
8. Copy follows section 5 (sentence case, verbs that say what happens).

### 20.4 Using compound-engineering well

- Brainstorm: when a requirement is vague, run the brainstorm step before the plan. On first use, run the plugin's setup command if it has one, and `/agents` to see which reviewers are installed.
- Plans: one plan per stage, saved as `docs/plans/frontend-stage-N-<name>.md`. A plan lists the files to create, the endpoints touched, the `api_conflict.md` entries it depends on, the tests, and the manual checks.
- Deepen: required for Stages 2, 5, and 6 (tokens, claim review, handover). Ask the research to confirm against `/openapi.json`, not only the spec.
- Review: prefer security, race-condition, architecture, simplicity, and performance reviewers. Ignore reviewers for other stacks. Treat reviewer findings as input: fix what is real, explain what you skip.
- Compound: after a non-trivial bug or decision, save the lesson in `docs/solutions/` (for example the stale-token race from C-06).

### 20.5 Using frontend-design

Use it before writing any screen or component, and again in review. Give it a short brief from section 5: subject, audience, primary job, tone, tokens, and fonts. Ask it for decisions on hierarchy, spacing, layout, and the empty, error, loading, and pending states. It owns: the `ItemCard` claim tag, the home screen, claim and handover screens, dialogs, the admin shell, and dashboard hierarchy. Section 5 (tokens, fonts, tone, "avoid" list) always wins over its generic defaults (T-03). After each UI result, check it against the "avoid" list.

### 20.6 Using pyright-lsp (read only)

Backend Python only. Allowed use: read-only navigation of `../backend` (go to definition, hover) to confirm an exact Pydantic schema or route signature when `/openapi.json` is unclear, for example `UserDashboard`, `AdminDashboard`, `ItemReturnResponse`, `ItemUpdate`. It needs `claude --add-dir ../backend`. If the language server cannot start, read the file directly. Never edit backend files, never run backend code, never use it on frontend JavaScript (T-05).

### 20.7 When a tool is missing

If a plugin or MCP is not connected, say so, continue the stage without it, and record it in the stage report. Never claim a tool was used when it was not. If `21st` or `context7` is down, the stage can still finish, but the report must say which design or documentation checks were skipped.

### 20.8 Required tool use and evidence

Each stage report lists every tool (`compound-engineering`, `frontend-design`, `21st`, `context7`, `pyright-lsp`) with what it was used for, or why it was skipped. Using only one tool is not acceptable. The matrix in section 21 says what is required in each stage. No browser MCP is installed, so visual checks stay manual: the report ends with what the user should open and look at.

## 21. Per-stage recipe (Claude Code)

Run this loop for every stage in section 16.

1. **Prepare.** `/clear`. Turn on plan mode. Read `CLAUDE.md`, this stage's sections, and `api_conflict.md`. Fetch `/openapi.json` if the stage touches an `OPEN` entry.
2. **Plan.** Run the compound-engineering plan command with: "Stage N: <name> from frontend_spec.md section 16". Deepen the plan for Stages 2, 5, 6. Check it against the spec. Show the user a short summary and wait for approval.
3. **Look up docs.** For each library the stage touches, query Context7 (section 20.2).
4. **Design pass (UI stages 1, 3, 4, 5, 7, 8, 9).** Apply `frontend-design` for hierarchy and states. Use `21st-ui-explore` then `21st-ui-build` for inspiration or a draft of the listed pieces, then adapt (section 20.3).
5. **Build.** Run the work command on the approved plan. Small steps. After each step run the relevant tests. Never skip a failing test.
6. **Verify.** `npm run lint`, `npm test`, `npm run build`. Report real results.
7. **Review.** Run the review command. For UI stages also run `21st-ui-review` on the new components (tokens, accessibility, consistency). Fix real findings.
8. **Record.** Update `api_conflict.md` (verify `OPEN` entries, add new ones). Save lessons with the compound command when useful.
9. **Commit locally** with a message like `feat(frontend): stage N <name>`. Do not push.
10. **Report** in the stage report format from `CLAUDE.md`: changed files, commands run, plugins and MCP used, conflicts, and manual checks for the user.

Sub-steps: if a stage is too big for one session (Stage 1 usually is), split the plan into sub-steps such as 1a tooling and config, 1b tokens and base components, 1c API types from `/openapi.json`. The plan file is the memory: tick off finished steps, commit, `/clear`, and resume from the plan. Check `git status` before each stage.

### Tool matrix per stage

Libraries to look up in Context7 are for the version in `package.json`. "Design" means `frontend-design` before writing and in review. "21st" means `21st-ui-explore` then `21st-ui-build`, then `21st-ui-review` at the end.

| Stage | Context7 libraries | Design (`frontend-design`) | 21st | compound-engineering and extras |
|---|---|---|---|---|
| 1 Foundation | Vite, Tailwind v4 with `@tailwindcss/vite`, React Router, ESLint flat config and plugins, Vitest, jsdom, React Testing Library, fontsource | Tokens in `@theme`, type pairing, base component look | Required for Button, Input, Badge, Skeleton, EmptyState, ErrorState, Pagination. `Modal` uses native `<dialog>`; 21st only for look | Plan with sub-steps. Confirm tool inventory (`/plugin`, `/mcp`, `/agents`). Write `api/types.js` from `/openapi.json`; use `pyright-lsp` read only if a schema is unclear |
| 2 API client and auth | axios interceptors, TanStack Query setup, react-hook-form, zod, `@hookform/resolvers`, MSW v2, React Router (guards, search params) | Auth screens: calm layout, clear inline errors, password rule checklist | Optional (form layout, password field) | **Deepen plan.** Security and race reviewers. Two-tab manual test for C-06. `compound` lesson on the refresh race |
| 3 Layout and browsing | React Router `useSearchParams`, TanStack Query `keepPreviousData`, date-fns, lucide-react | Required: `ItemCard` claim tag, home screen, filters layout | Required for search box and card grid ideas. Never for `ItemCard` itself | Plan, review |
| 4 Reporting | react-hook-form with zod, TanStack Query mutations, Cloudinary unsigned upload (official docs if Context7 lacks it) | Required: form layout, `ImageUploader` states (empty, uploading, preview, error) | Optional (segmented control, uploader ideas) | Verify C-14 and C-16 against the live backend |
| 5 Claims | TanStack Query mutations and invalidation, react-hook-form, zod | Required: `ClaimCard`, review dialogs, `ContactCard` (trust and clarity) | Optional (cards, dialogs) | **Deepen plan.** Re-read section 13 and the 11.3 matrix before coding |
| 6 Returns | same as Stage 5 | Required: `RecordReturnDialog`, `ReturnRecordCard`, handover wording | Optional | **Deepen plan.** Test claimant and reporter views of a returned item. Verify C-11 |
| 7 Dashboards | recharts, TanStack Query `refetchInterval` | Required: dashboard hierarchy, `StatCard`, chart text alternatives | Required for `StatCard` and chart layout ideas | Read `UserDashboard` and `AdminDashboard` shapes from `/openapi.json` first |
| 8 Admin management | TanStack Query, react-hook-form, zod, React Router search params | Required: `DataTable`, admin sidebar, row actions and confirm flows | Required for `DataTable` and sidebar ideas | Test every `409` path on the live backend. Verify C-07 and C-13 |
| 9 Polish and release | Vitest, MSW, Vite build, Vercel or Netlify rewrite config | Final design review against the "avoid" list | `21st-ui-review` on the whole app | Full compound review. Responsive check at 360 / 768 / 1280. Accessibility pass. Compound lessons |

## 22. Ready prompts (paste into Claude Code)

**P1. First session (Stage 1)**

> Read CLAUDE.md, frontend/CLAUDE.md, frontend_spec.md (whole file once), and api_conflict.md. Run /plugin, /mcp, and /agents and tell me which tools are connected. Then, in plan mode, plan Stage 1 from frontend_spec.md section 16 using the compound-engineering plan command, split into sub-steps. Look up Vite, Tailwind v4, React Router, ESLint, and Vitest in Context7 first. Use frontend-design for the tokens and fonts. Show me the plan and wait for approval.

**P2. Start any later stage**

> /clear done. Start Stage N from frontend_spec.md section 16. Read the stage's sections, the tool matrix row for this stage in section 21, and api_conflict.md. Fetch /openapi.json for any OPEN entry the stage touches. Plan with compound-engineering (deepen if the matrix says so), look up the listed libraries in Context7, and show me the plan before coding.

**P3. Build a UI component**

> Build <ComponentName> from frontend_spec.md section 3. First use 21st-ui-explore to look at similar patterns, then ask frontend-design for the layout and states using the section 5 tokens. Draft with 21st-ui-build, then adapt it with the section 20.3 checklist: JSX, project tokens, no new dependency, no decorative motion. Check Context7 for any library API you use. Add loading, error, empty, and data states and tests. Run lint, tests, and build. Finish with 21st-ui-review.

**P4. Verify an OPEN conflict**

> Verify api_conflict.md entry <ID> against the live backend (curl /openapi.json or the endpoint). If the schema is still unclear, read the backend source read-only through pyright-lsp. Fill in Result, change Status, and adjust code and tests if the result differs from the assumption. Do not change the backend.

**P5. Close a stage**

> Run npm run lint, npm test, and npm run build. Run the compound-engineering review (security, race, architecture, simplicity, performance reviewers), plus 21st-ui-review if this stage built UI. Fix real findings and list the ones you skipped with a reason. Update api_conflict.md, save lessons with compound if useful, commit locally, and give the stage report from CLAUDE.md, including one line per tool.

**P6. Resume after /clear or an interruption**

> Resume Stage N. Read docs/plans/frontend-stage-N-*.md, see which steps are ticked, run git status and git diff --stat, and continue with the next unfinished step. Do not redo finished work.