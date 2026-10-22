# Findora API Documentation
Verified against the backend on 2026-10-22

This document provides the complete API specification for the Findora Lost & Found platform. Frontend developers should use this as the primary guide for integrating with the backend.

## Known Limitations
- `ItemResponse` does not include a claims count.
- `ItemResponse` does not include a flag indicating if the current viewer has submitted a claim.
- `/claims/my-claims` does not support filtering by `item_id`.

## 1. Introduction

### Base URL
`http://<backend-host>:<port>/api/v1` (e.g., `http://localhost:8000/api/v1`)

### Authentication
Findora uses **Stateless JWT (JSON Web Tokens)**.
- **Method**: Bearer Authentication.
- **Header**: `Authorization: Bearer <access_token>`
- **Token Types**: The API distinguishes between `access`, `refresh`, and `reset` tokens. Each endpoint only accepts its specific token type.
- **Invalidation**: Changing or resetting a password immediately invalidates all existing tokens for that user.

### Global Error Codes
All errors return a JSON body: `{"detail": "Error message"}`.

| Code | Meaning | Description |
|---|---|---|
| `400` | Bad Request | Invalid request (e.g., invalid reset token). |
| `401` | Unauthorized | Missing, invalid, or expired token. |
| `403` | Forbidden | Authenticated but lacks permission (or account is inactive). |
| `404` | Not Found | The requested resource does not exist. |
| `409` | Conflict | State conflict (e.g., duplicate email, item already returned). |
| `422` | Unprocessable Entity | Validation error (e.g., password too short, invalid enum value). |
| `429` | Too Many Requests | Rate limit exceeded. |

---

## 2. User Journeys

### 🔑 Auth Flow
**Register $\rightarrow$ Login $\rightarrow$ Profile $\rightarrow$ Password Reset**

#### Register
`POST /auth/register` | **Public**
- **Purpose**: Create a new user account.
- **Request Body**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `full_name` | string | Yes | 2-100 chars, trimmed |
  | `email` | string | Yes | Valid email, $\le$ 255 chars |
  | `password` | string | Yes | 8+ chars, $\ge$ 1 letter & 1 digit, $\le$ 72 bytes |
  | `phone` | string | No | Digits, `+`, spaces, dashes, $\le$ 30 chars |
- **Response (`201`)**: `UserPublic` schema.
- **Errors**: `409` if email exists; `422` if validation fails.

#### Login
`POST /auth/login` | **Public**
- **Purpose**: Authenticate and receive tokens.
- **Request Body**:
  | Field | Type | Required |
  |---|---|---|
  | `email` | string | Yes |
  | `password` | string | Yes |
- **Response (`200`)**: `TokenResponse` (includes `access_token`, `refresh_token`, `expires_in`, and `UserPublic`).
- **Errors**: `401` for invalid credentials; `403` for inactive accounts.

#### OAuth2 Login (Swagger UI)
`POST /auth/login/oauth2` | **Public**
- **Purpose**: Provide OAuth2 compatibility for Swagger UI.
- **Request Body**: Form data (`username` as email, `password`).
- **Response (`200`)**: `TokenResponse`.


#### Current User (Me)
`GET /auth/me` | **Authenticated**
- **Purpose**: Get current user's full profile.
- **Response (`200`)**: `UserMe` schema (includes `email`, `phone`, `role`).

#### Update Profile
`PATCH /users/me` | **Authenticated**
- **Purpose**: Update own profile details.
- **Request Body**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `full_name` | string | No | 2-100 chars, trimmed |
  | `phone` | string | No | Digits, `+`, spaces, dashes, $\le$ 30 chars |
- **Response (`200`)**: `UserMe` schema.

#### User Dashboard
`GET /users/me/dashboard` | **Authenticated**
- **Purpose**: Get a summary of the user's activity.
- **Response (`200`)**: `UserDashboard` schema.

#### User Profile
`GET /users/{user_id}` | **Public**
- **Purpose**: View a public profile of another user.
- **Response (`200`)**: `UserPublic` schema.
- **Errors**: `404` if user not found.

#### Refresh Token
`POST /auth/refresh` | **Public (Refresh Token)**
- **Purpose**: Get new access/refresh tokens without re-logging.
- **Request Body**: `{ "refresh_token": "string" }`
- **Response (`200`)**: `TokenResponse`.
- **Errors**: `401` if token expired or invalid.

#### Logout
`POST /auth/logout` | **Authenticated**
- **Purpose**: Signals logout (Client must delete tokens).
- **Response (`200`)**: `MessageResponse`.

#### Change Password
`PATCH /auth/change-password` | **Authenticated**
- **Purpose**: Update password.
- **Request Body**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `current_password` | string | Yes | Must match current hash |
  | `new_password` | string | Yes | Same rules as registration; must differ from current |
- **Response (`200`)**: `TokenResponse` (Fresh tokens are issued because `pwf` changes).

#### Forgot Password
`POST /auth/forgot-password` | **Public**
- **Purpose**: Request a password reset link.
- **Request Body**: `{ "email": "string" }`
- **Response (`200`)**: `MessageResponse` (Always returns the same message for security).

#### Reset Password
`POST /auth/reset-password` | **Public (Reset Token)**
- **Purpose**: Set a new password using the email link token.
- **Request Body**:
  | Field | Type | Required |
  |---|---|---|
  | `token` | string | Yes |
  | `new_password` | string | Yes |
- **Response (`200`)**: `MessageResponse`.
- **Errors**: `400` if token is invalid or expired.

---

### 🔍 Discovery Flow
**Public Search $\rightarrow$ Item Details**

#### Search Items
`GET /items` | **Public**
- **Purpose**: Browse lost and found items. **Excludes `closed` items**.
- **Query Parameters**:
  | Param | Type | Default | Description |
  |---|---|---|---|
  | `search` | string | - | Search title, description, or exact ID |
  | `item_type` | enum | - | `lost` or `found` |
  | `category_id`| UUID | - | Filter by category |
  | `status` | enum | - | `open`, `claimed`, `returned` |
  | `start_date` | ISO8601| - | Filter `event_date` $\ge$ start |
  | `end_date` | ISO8601| - | Filter `event_date` $\le$ end |
  | `sort_by` | string | `created_at`| `created_at`, `event_date`, `title` |
  | `order` | string | `desc` | `asc` or `desc` |
  | `page` | int | 1 | Page number |
  | `page_size` | int | 10 | Items per page (1-100) |
- **Response (`200`)**: `Page[ItemResponse]`.
- **Errors**: `422` if `start_date > end_date` or invalid `sort_by`.

#### Item Details
`GET /items/{item_id}` | **Public**
- **Purpose**: Get full details of a specific item.
- **Response (`200`)**: `ItemResponse`.
- **Errors**: `404` if not found.

---

### 📝 Reporting Flow
**Category Selection $\rightarrow$ Create Item $\rightarrow$ Manage My Items**

#### List Categories
`GET /categories` | **Public**
- **Purpose**: Get a list of active categories for item reporting.
- **Query Params**: `search` (optional).
- **Response (`200`)**: `Page[CategoryResponse]`.

#### Category Details
`GET /categories/{category_id}` | **Public**
- **Purpose**: View details of a specific category.
- **Response (`200`)**: `CategoryResponse`.
- **Errors**: `404` if not found or inactive.

#### Create Item Report
`POST /items` | **Authenticated**
- **Purpose**: Report a lost or found item.
- **Request Body**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `title` | string | Yes | 3-200 chars |
  | `description` | string | Yes | Min 10 chars |
  | `item_type` | enum | Yes | `lost` or `found` |
  | `category_id` | UUID | Yes | Must exist and be active |
  | `location` | string | Yes | $\le$ 255 chars |
  | `event_date` | ISO8601| Yes | **Must not be in the future** |
  | `image_url` | string | No | **Must be HTTPS**, $\le$ 500 chars |
- **Response (`201`)**: `ItemResponse` (Status starts as `open`).
- **Errors**: `422` for validation; `404` for inactive category.

#### My Items
`GET /items/my-items` | **Authenticated**
- **Purpose**: List all reports created by the current user. **Includes `closed` items**.
- **Query Params**: Same as `GET /items`.
- **Response (`200`)**: `Page[ItemResponse]`.

#### Update Item
`PATCH /items/{item_id}` | **Owner / Admin**
- **Purpose**: Edit item details.
- **Constraints**:
  - Owner can only edit if `status == 'open'`.
  - Admin can edit any item except those with `status == 'returned'`.
- **Request Body**: Partial `ItemCreate` fields.
- **Response (`200`)**: `ItemResponse`.

#### Close Item
`PATCH /items/{item_id}/close` | **Owner / Admin**
- **Purpose**: Mark an item as closed.
- **Response (`200`)**: `ItemResponse` (Status becomes `closed`).

#### Delete Item
`DELETE /items/{item_id}` | **Owner / Admin**
- **Purpose**: Remove a report.
- **Constraint**: **Only allowed if the item has no claims**.
- **Response (`204`)**: No content.
- **Errors**: `409` if item has claims.

---

### 🤝 Claiming Flow
**Submit Claim $\rightarrow$ Admin Review $\rightarrow$ Contact Exchange**

#### Submit Claim
`POST /items/{item_id}/claims` | **Authenticated**
- **Purpose**: Claim a found item.
- **Constraints**:
  - Item must be `found` and `open`.
  - Claimant must not be the reporter.
  - Only one claim per user per item.
- **Request Body**: `{ "ownership_proof": "string" }` (10-2000 chars).
- **Response (`201`)**: `ClaimResponse` (Status: `pending`).
- **Errors**: `409` if claiming a `lost` item, duplicate claim, or non-open item.

#### My Claims
`GET /claims/my-claims` | **Authenticated**
- **Purpose**: List all claims submitted by the current user.
- **Query Params**: `status`, `start_date`, `end_date`, `sort_by` (`created_at`, `status`), `order`, `page`, `page_size`.
- **Response (`200`)**: `Page[ClaimResponse]`.

#### Item Claims
`GET /items/{item_id}/claims` | **Item Reporter / Admin**
- **Purpose**: List all claims submitted for a specific item.
- **Response (`200`)**: `Page[ClaimResponse]`.
- **Errors**: `403` if the viewer is not the reporter or admin.

#### Claim Details
`GET /claims/{claim_id}` | **Claimant / Reporter / Admin**
- **Purpose**: View claim details and ownership proof.
- **Response (`200`)**: `ClaimResponse`.
- **Privacy**: `ownership_proof` and `counterparty_contact` are only visible to authorized roles. `counterparty_contact` appears only when `status == 'approved'`.

#### Review Claim
`PATCH /claims/{claim_id}/review` | **Reporter / Admin**
- **Purpose**: Approve or reject a claim.
- **Constraints**:
  - Reviewer must not be the claimant.
  - Only `pending` $\rightarrow$ `approved` or `rejected`.
  - Approval requires item to be `open`.
- **Request Body**:
  | Field | Type | Required | Constraints |
  |---|---|---|---|
  | `status` | enum | Yes | `approved` or `rejected` |
  | `review_note` | string | No | $\le$ 1000 chars |
- **Effect of Approval**:
  1. Claim status $\rightarrow$ `approved`.
  2. Item status $\rightarrow$ `claimed`.
  3. All other pending claims for this item $\rightarrow$ `rejected`.
- **Response (`200`)**: `ClaimResponse`.

#### Withdraw Claim
`DELETE /claims/{claim_id}` | **Claimant**
- **Purpose**: Cancel a pending claim.
- **Constraint**: Only allowed while `status == 'pending'`.
- **Response (`204`)**: No content.
- **Errors**: `409` if claim is already reviewed.

---

### 📦 Return Flow
**Record Handover $\rightarrow$ View Return Record**

#### Record Return
`POST /claims/{claim_id}/return` | **Reporter / Admin**
- **Purpose**: Confirm the item has been handed over.
- **Constraints**:
  - Claim must be `approved`.
  - Item must be `claimed`.
  - Only the reporter or admin can record this.
- **Request Body**: `{ "notes": "string" }` (Optional).
- **Effect**: Atomically creates a return record and sets item status to `returned`.
- **Response (`201`)**: `ItemReturnResponse`.

#### Get Return Record
`GET /returns/{return_id}` | **Claimant / Reporter / Admin**
- **Purpose**: View the handover record.
- **Response (`200`)**: `ItemReturnResponse`.

#### Get Item Return
`GET /items/{item_id}/return` | **Claimant / Reporter / Admin**
- **Purpose**: Check if a specific item has been returned.
- **Response (`200`)**: `ItemReturnResponse`.

---

### 🛠️ Admin Control Panel
**User Management, Moderation, and Dashboard**

#### Admin Dashboard
`GET /admin/dashboard` | **Admin**
- **Purpose**: System-wide analytics.
- **Response (`200`)**: `AdminDashboard` (counts for users, items, claims, and chart data).

#### User Management
- `GET /admin/users`: List all users (paginated, filters for `role`, `is_active`).
- `POST /admin/users`: Create user (can specify `role`).
- `GET /admin/users/{user_id}`: View user details.
- `PATCH /admin/users/{user_id}/status`: Activate/Deactivate.
- `PATCH /admin/users/{user_id}/role`: Change role.
- `DELETE /admin/users/{user_id}`: Delete user (only if no history).
- **Constraint**: Cannot deactivate/delete/demote the **last active admin**.

#### Item Moderation
- `GET /admin/items`: List all items (including `closed` and `returned`).
- `PATCH /admin/items/{item_id}/status`: Moderate status (**Only `open` $\leftrightarrow$ `closed`**).
- `DELETE /admin/items/{item_id}`: Delete item if it has no claims.

#### Category Management
- `GET /admin/categories`: List all categories (including inactive) with `items_count`.
- `POST /categories`: Create category.
- `PATCH /categories/{category_id}`: Update name/description/active status.
- `DELETE /categories/{category_id}`: Delete if unreferenced.

#### Claim Moderation
- `GET /admin/claims`: List all claims.
- `GET /admin/claims/pending`: List only pending claims.

---

## 3. Schema Glossary

### `UserDashboard`
```json
{
  "my_items_total": 12,
  "my_items_by_status": {
    "open": 5,
    "claimed": 2,
    "returned": 4,
    "closed": 1
  },
  "my_items_by_type": {
    "lost": 7,
    "found": 5
  },
  "my_claims_by_status": {
    "pending": 1,
    "approved": 2,
    "rejected": 0
  },
  "pending_claims_on_my_items": {
    "count": 3,
    "recent": [
      {
        "id": "uuid",
        "claimant": { "id": "uuid", "full_name": "Jane Doe" },
        "created_at": "2026-10-20T10:00:00Z"
      }
    ]
  },
  "recent_items": [
    {
      "id": "uuid",
      "title": "iPhone 13",
      "item_type": "found",
      "status": "open",
      "location": "Central Park",
      "event_date": "2026-10-01T10:00:00Z",
      "image_url": "https://...",
      "category": { "id": "uuid", "name": "Electronics" },
      "reporter": { "id": "uuid", "full_name": "John Doe" },
      "created_at": "2026-10-01T12:00:00Z",
      "updated_at": "2026-10-01T12:00:00Z"
    }
  ]
}
```

### `Page[T]`
Standard wrapper for all list endpoints.
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

### `ItemResponse`
```json
{
  "id": "uuid",
  "title": "iPhone 13",
  "description": "Blue iPhone 13 with a cracked screen",
  "item_type": "found",
  "status": "open",
  "location": "Central Park, NY",
  "event_date": "2026-10-01T10:00:00Z",
  "image_url": "https://example.com/image.jpg",
  "category": { "id": "uuid", "name": "Electronics" },
  "reporter": { "id": "uuid", "full_name": "John Doe" },
  "created_at": "2026-10-01T12:00:00Z",
  "updated_at": "2026-10-01T12:00:00Z"
}
```

### `ClaimResponse`
```json
{
  "id": "uuid",
  "status": "approved",
  "ownership_proof": "I have the original box and receipt",
  "review_note": "Proof verified",
  "reviewed_at": "2026-10-02T10:00:00Z",
  "item": {
    "id": "uuid",
    "title": "iPhone 13",
    "item_type": "found",
    "status": "claimed"
  },
  "claimant": {
    "id": "uuid",
    "full_name": "Jane Smith"
  },
  "counterparty_contact": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+123456789"
  },
  "created_at": "2026-10-01T15:00:00Z",
  "updated_at": "2026-10-02T10:00:00Z"
}
```
*Note: `ownership_proof` and `counterparty_contact` are conditionally included based on the user's role.*
