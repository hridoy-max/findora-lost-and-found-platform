# Stage 2: API Client and Auth Plan

## Goal
Implement the secure HTTP communication layer and the complete authentication flow, including token management and session persistence.

## 1. Token Management (`src/api/tokens.js`)
- [ ] Implement `getAccess()`: returns the in-memory access token.
- [ ] Implement `getRefresh()`: returns the refresh token from `localStorage` (`findora.refresh`).
- [ ] Implement `setTokens({access_token, refresh_token})`: updates both memory and storage.
- [ ] Implement `clearTokens()`: wipes both memory and storage.
- [ ] Implement cross-tab synchronization: listen to `storage` event to sign out all tabs if the refresh token is cleared.

## 2. API Client (`src/api/client.js`)
- [ ] Create Axios instance with `baseURL` from `config.js` and 30s timeout.
- [ ] **Request Interceptor:** Automatically attach `Authorization: Bearer <access_token>` if available.
- [ ] **Response Interceptor (The Refresh Flow):**
    - Handle `401` errors.
    - If `detail === "Token expired"`, trigger `refreshOnce()`.
    - If `detail === "Invalid token"`, attempt one refresh if a refresh token exists.
    - Implement **single-flight refresh**: parallel 401s must share one refresh promise.
    - On refresh success: update tokens and retry the original request.
    - On refresh failure: call `signOutAndRedirect()`.
- [ ] Implement the "Waking up server" banner for requests taking > 5s.

## 3. Error Normalization (`src/api/errors.js`)
- [ ] Implement `getErrorMessage(err)`:
    - String `detail` $\rightarrow$ as is.
    - Array `detail` (422) $\rightarrow$ join messages.
    - Network error $\rightarrow$ "Can't reach the server...".
    - `429` $\rightarrow$ "Too many attempts...".
    - `500` $\rightarrow$ "Something went wrong...".
    - `403` (inactive) $\rightarrow$ "This account is deactivated...".
- [ ] Implement `getFieldErrors(err)`: Maps FastAPI's 422 `loc` array to field names.

## 4. Auth API (`src/api/auth.js`)
- [ ] Implement wrappers for:
    - `register(data)` $\rightarrow$ `POST /auth/register`.
    - `login(data)` $\rightarrow$ `POST /auth/login`.
    - `refresh(token)` $\rightarrow$ `POST /auth/refresh`.
    - `me()` $\rightarrow$ `GET /auth/me`.
    - `logout()` $\rightarrow$ `POST /auth/logout`.
    - `changePassword(data)` $\rightarrow$ `PATCH /auth/change-password`.
    - `forgotPassword(email)` $\rightarrow$ `POST /auth/forgot-password`.
    - `resetPassword(data)` $\rightarrow$ `POST /auth/reset-password`.

## 5. Auth Context (`src/context/AuthContext.jsx`)
- [ ] Implement `AuthProvider` with state: `{ user, isAuthenticated, isAdmin, isLoading }`.
- [ ] **Boot Sequence:**
    - Check `localStorage` for refresh token.
    - If present $\rightarrow$ `POST /auth/refresh` $\rightarrow$ set user $\rightarrow$ `isLoading=false`.
    - If absent/fail $\rightarrow$ `isLoading=false`, anonymous.
- [ ] Implement `applyTokenResponse(res)`: store tokens, set user, and perform `/auth/me` fallback if `role` is missing.
- [ ] Implement `login`, `register`, `logout`, and `refreshMe` methods.

## 6. Routing Guards & Auth Screens
- [ ] `routes/ProtectedRoute.jsx`: Redirect anonymous users to `/login?next=<path>`.
- [ ] `routes/GuestRoute.jsx`: Redirect signed-in users via `safeNext`.
- [ ] **Screens:**
    - `LoginPage`: Form with email/password, generic error handling.
    - `RegisterPage`: Form with live password rule checklist.
    - `ForgotPasswordPage`: Email input, success message.
    - `ResetPasswordPage`: Token-based password update.
    - `ProfilePage`: Detail view and "Change Password" form.

## 7. Verification
- [ ] **API Layer:** Test request/response shapes against `/openapi.json`.
- [ ] **Auth Flow:** Manual test of registration $\rightarrow$ login $\rightarrow$ session persistence.
- [ ] **Refresh Race:** Manual two-tab test (Password change in Tab A, request in Tab B).
- [ ] **Guards:** Verify `GuestRoute` and `ProtectedRoute` redirects.
- [ ] `npm run lint`, `npm test`, `npm run build` pass.
