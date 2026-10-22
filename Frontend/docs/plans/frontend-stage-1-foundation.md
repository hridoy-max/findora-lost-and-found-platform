# Stage 1: Foundation Plan

## Goal
Establish the core technical foundation, design tokens, and base UI components of the Findora frontend.

## 1. Tooling and Config
- [ ] Verify all installed plugins and MCP servers (`compound-engineering`, `frontend-design`, `21st`, `context7`, `pyright-lsp`).
- [ ] Configure `.env` based on `.env.example` (set `VITE_API_BASE_URL=http://localhost:8000/api/v1`).
- [ ] Create `src/config.js` to centralize `import.meta.env` access.
- [ ] Setup ESLint flat config and Vitest (`vitest.config.js`, `tests/setup.js`).

## 2. Design Tokens and Typography
- [ ] Setup `src/index.css` with `@import "tailwindcss";` and `@theme` tokens:
    - Colors: `ink`, `paper`, `surface`, `line`, `cobalt`, `found`, `lost`, `danger`.
    - Fonts: *Bricolage Grotesque* (headings), *Public Sans* (body).
- [ ] Implement the border radius scale (`md` for inputs/buttons, `xl` for cards).

## 3. Base UI Components
*All components must be plain JSX, use project tokens, and follow the accessibility floor.*
- [ ] `ui/Button`: Variants (primary, secondary, destructive), pending state with spinner.
- [ ] `ui/Input` & `ui/Textarea`: Focus rings, labels, error states.
- [ ] `ui/FormField`: Wrapper for label, input, and error message.
- [ ] `ui/Badge`: Type badges (lost/found) and status badges (open, claimed, returned, etc.).
- [ ] `ui/Modal` & `ui/ConfirmDialog`: Using native `<dialog>` with `showModal()`.
- [ ] `ui/Spinner` & `ui/Skeleton`: Base loading indicators.
- [ ] `ui/EmptyState` & `ui/ErrorState`: Standardized layouts for no-data/error.
- [ ] `ui/Pagination`: Prev/Next and page numbers.

## 4. Core Utilities and API Types
- [ ] Implement `utils/cn.js` (className joiner).
- [ ] Implement `utils/normalizeList.js` (handles array or `{ data: [] }`).
- [ ] Implement `utils/safeNext.js` (URL redirect validation).
- [ ] **API Types:** Create `src/api/types.js` with JSDoc typedefs based on `/openapi.json`:
    - `UserMe`, `UserPublic`, `TokenResponse`, `ItemResponse`, `CategoryResponse`, `Page[T]`, etc.

## 5. Application Shell
- [ ] Setup `src/main.jsx` with providers: `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, `Toaster`.
- [ ] Setup `src/App.jsx` with the basic route table and `NotFoundPage`.

## 6. Conflict Resolution
- [ ] Verify and update `api_conflict.md` entries:
    - C-03: Define all missing schemas in `types.js`.
    - C-04: Check `TokenResponse.user` for `role` (verified: it uses `UserMe` which HAS `role`).
    - C-07: Note `403` behavior for inactive accounts.
    - C-13: Verify `AdminUserCreate` fields (only `full_name`, `email`, `password`, `role`).
    - C-14: Verify `ItemUpdate` fields.
    - C-18: Check `UserDashboard` recent claims (verified: just IDs/names).
    - C-19: Verify `PATCH /users/me` phone clearing (`null`).

## Verification
- [ ] `npm run lint` passes.
- [ ] `npm test` passes (basic component tests).
- [ ] `npm run build` succeeds.
