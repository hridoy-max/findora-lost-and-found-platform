# Findora Frontend Implementation Guide

This document serves as the exhaustive mapping between the Findora Backend API and the React Frontend UI. It ensures that every backend endpoint has a corresponding UI trigger, location, and effect.

## 1. Tech Stack & Architecture

- **Framework**: React (Vite)
- **State Management**: React Context / Zustand (for Auth & Global UI state)
- **API Client**: Axios (with interceptors for JWT injection and 401 refresh logic)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod (for client-side validation)

### Folder Structure
```text
src/
├── api/               # Axios instance and endpoint definitions
│   ├── auth.service.ts
│   ├── item.service.ts
│   └── ...
├── components/         # Reusable UI components
│   ├── common/        # Buttons, Inputs, Modals
│   ├── layout/       # Navbar, Sidebar, Footer
│   └── items/         # ItemCard, ItemFilter, etc.
├── pages/             # Route-level components
│   ├── auth/          # Login, Register, ResetPassword
│   ├── items/         # Browse, ItemDetails, CreateItem
│   ├── claims/        # MyClaims, ClaimDetails, ReviewClaim
│   ├── user/          # Profile, Dashboard
│   └── admin/         # AdminDashboard, UserMgmt, CategoryMgmt
├── hooks/             # Custom hooks (e.g., useAuth, usePagination)
├── context/           # AuthContext
└── utils/             # Formatters, Validators, Constants
```

## 2. API-to-UI Mapping Table

### 2.1 Auth Mapping (10 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `POST /auth/register` | `/register` Page | Form Submit | Redirect to `/login`; show success toast | `user.full_name` (welcome msg) |
| `POST /auth/login` | `/login` Page | Form Submit | Store tokens; Redirect to `/dashboard`; set UserContext | `access_token`, `user.role` (routing) |
| `POST /auth/refresh` | Global Interceptor | 401 Response | Silent token update; retry original request | `access_token`, `refresh_token` |
| `GET /auth/me` | App Load / `/profile` | Page Load | Populate UserContext; show user info in Navbar | `full_name`, `email`, `role` |
| `POST /auth/logout` | Navbar / Profile | Click "Logout" | Clear tokens; Redirect to `/login` | N/A |
| `PATCH /auth/change-password`| `/profile` (Password Section) | Form Submit | Show success toast; update local tokens | `access_token` (new tokens) |
| `POST /auth/forgot-password`| `/forgot-password` Page | Form Submit | Show "Email sent" message; Redirect to `/login` | N/A |
| `POST /auth/reset-password`| `/reset-password` Page | Form Submit | Show success toast; Redirect to `/login` | N/A |
| `GET /users/me/dashboard` | `/dashboard` Page | Page Load | Render stat cards and recent items list | `my_items_total`, `recent_items` |
| `PATCH /users/me` | `/profile` Page | "Save Changes" click | Update profile info in UI; show success toast | `full_name`, `phone` |

### 2.2 Discovery & Item Mapping (15 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `GET /items` | `/browse` Page | Page Load / Filter change | Update items grid; update pagination | `data` (ItemResponse list) |
| `GET /items/{id}` | `/items/{id}` Page | Click Item Card | Render detailed item view | `title`, `description`, `image_url` |
| `POST /items` | `/items/create` Page | Form Submit | Redirect to `/items/{id}`; show success toast | `id` (for redirect) |
| `PATCH /items/{id}` | `/items/{id}` (Owner) | "Save Edit" click | Update item details in view; show success toast | `updated_at` |
| `DELETE /items/{id}` | `/items/{id}` (Owner) | Click "Delete" $\rightarrow$ Confirm | Redirect to `/browse`; show success toast | N/A |
| `PATCH /items/{id}/close` | `/items/{id}` (Owner) | Click "Close Item" | Update status badge to "Closed" | `status: "closed"` |
| `GET /items/my-items` | `/my-items` Page | Page Load / Filter change | Update personal items list | `data` (ItemResponse list) |
| `GET /categories` | `/browse` (Filter Dropdown) | Page Load / Dropdown open | Populate category filter list | `name`, `id` |
| `GET /categories/{id}` | `/categories/{id}` Page | Click Category Link | Filter `/browse` by this category | `name` |
| `GET /users/{id}` | `/profile/{id}` Page | Visit User Profile | Render public profile info | `full_name`, `created_at` |
| `PATCH /admin/items/{id}/status`| `/admin/items` (Item Row) | Status Dropdown change | Update status in admin table | `status` |
| `DELETE /admin/items/{id}` | `/admin/items` (Item Row) | Click "Delete" $\rightarrow$ Confirm | Remove item from admin table | N/A |
| `GET /admin/items` | `/admin/items` Page | Page Load / Filter change | Update admin items table | `data` (ItemResponse list) |
| `GET /admin/categories` | `/admin/categories` Page | Page Load | Render category management table | `name`, `items_count` |
| `GET /items/{id}/return` | `/returns/{id}` (Return view) | Page Load | Render return details | `returned_at`, `notes` |

### 2.3 Claiming Mapping (8 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `POST /items/{id}/claims` | `/items/{id}` (Found item) | "Claim Item" Form Submit | Show success toast; redirect to `/my-claims` | N/A |
| `GET /claims/my-claims` | `/my-claims` Page | Page Load / Filter change | Update claims list | `data` (ClaimResponse list) |
| `GET /claims/{id}` | `/claims/{id}` Page | Click Claim Card | Render claim details; show contact if approved | `ownership_proof`, `counterparty_contact` |
| `GET /items/{id}/claims` | `/items/{id}` (Reporter) | "View Claims" Tab click | Update claims list for specific item | `data` (ClaimResponse list) |
| `PATCH /claims/{id}/review` | `/claims/{id}` (Reporter) | "Approve/Reject" click | Update status badge; update item status | `status`, `review_note` |
| `DELETE /claims/{id}` | `/claims/{id}` (Claimant) | "Withdraw Claim" click | Remove from `/my-claims`; show success toast | N/A |
| `GET /admin/claims` | `/admin/claims` Page | Page Load | Render all claims table | `data` (ClaimResponse list) |
| `GET /admin/claims/pending` | `/admin/claims/pending` | Page Load | Render pending claims table | `data` (ClaimResponse list) |

### 2.4 Return Mapping (3 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `POST /claims/{id}/return` | `/claims/{id}` (Reporter) | "Record Handover" submit | Redirect to `/returns/{id}`; show success toast | `id` (Return ID) |
| `GET /returns/{id}` | `/returns/{id}` Page | Page Load | Render return receipt/details | `returned_at`, `received_by` |
| `GET /items/{id}/return` | `/items/{id}` (Return tab) | Tab click | Render return info if exists | `return_details` |

### 2.5 User/Admin Mapping (12 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `GET /admin/dashboard` | `/admin/dashboard` Page | Page Load | Render KPIs and Charts (Recharts) | `total_users`, `items_over_time` |
| `GET /admin/users` | `/admin/users` Page | Page Load / Search | Update user management table | `data` (UserPublic list) |
| `POST /admin/users` | `/admin/users/create` | Form Submit | Add user to table; show success toast | `id` |
| `GET /admin/users/{id}` | `/admin/users/{id}` Page | Click User Row | Render detailed admin user view | `full_name`, `email`, `role` |
| `PATCH /admin/users/{id}/status`| `/admin/users/{id}` | Toggle "Active" switch | Update status badge; show success toast | `is_active` |
| `PATCH /admin/users/{id}/role` | `/admin/users/{id}` | Role Dropdown change | Update role badge; show success toast | `role` |
| `DELETE /admin/users/{id}` | `/admin/users/{id}` | Click "Delete" $\rightarrow$ Confirm | Redirect to `/admin/users`; success toast | N/A |
| `POST /categories` | `/admin/categories/create` | Form Submit | Add category to table; success toast | `id` |
| `PATCH /categories/{id}` | `/admin/categories/{id}` | "Save Edit" click | Update category in table; success toast | `name`, `description` |
| `DELETE /categories/{id}` | `/admin/categories/{id}` | Click "Delete" $\rightarrow$ Confirm | Remove from table; success toast | N/A |
| `GET /admin/categories` | `/admin/categories` Page | Page Load | Render category list with item counts | `items_count` |
| `GET /admin/claims/pending` | `/admin/claims/pending` | Page Load | Update pending claims list | `data` |

### 2.6 Health Mapping (2 endpoints)

| Endpoint | UI Location | Trigger | UI Effect | Data Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `GET /` | Root / Status Page | Page Load | Render "API Online" status message | `message` |
| `GET /health` | Admin / Health Page | Page Load | Render "Database: Connected" checkmark | `status: "ok"` |

## 3. Implementation Roadmap

1. **Phase 1: Infrastructure**: Setup Axios interceptors $\rightarrow$ AuthContext $\rightarrow$ Basic Layout (Navbar/Sidebar).
2. **Phase 2: Auth Flows**: Login $\rightarrow$ Register $\rightarrow$ Forgot/Reset Password $\rightarrow$ Profile Update.
3. **Phase 3: Discovery**: Item Browsing $\rightarrow$ Search/Filters $\rightarrow$ Item Detail View.
4. **Phase 4: Reporting**: Create Item Form $\rightarrow$ My Items Management $\rightarrow$ Edit/Close.
5. **Phase 5: Claims**: Submit Claim $\rightarrow$ My Claims List $\rightarrow$ Claim Review (Reporter) $\rightarrow$ Claim Details (Contact info).
6. **Phase 6: Returns**: Record Handover $\rightarrow$ Return Details View.
7. **Phase 7: Admin**: Dashboard Charts $\rightarrow$ User Management $\rightarrow$ Category Management $\rightarrow$ Item Moderation.
8. **Phase 8: Polish**: Global Error Handling $\rightarrow$ Loading Skeletons $\rightarrow$ Toast Notifications $\rightarrow$ Responsive Design.
