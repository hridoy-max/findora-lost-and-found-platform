/**
 * @typedef {Object} UserPublic
 * @property {string} id - UUID
 * @property {string} full_name
 * @property {string} role - "user" | "admin"
 * @property {string} created_at - ISO8601
 */

/**
 * @typedef {Object} UserMe
 * @extends UserPublic
 * @property {string} email
 * @property {string|null} phone
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} TokenResponse
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {UserMe} user
 */

/**
 * @typedef {Object} CategoryResponse
 * @property {string} id - UUID
 * @property {string} name
 * @property {string|null} description
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} ItemResponse
 * @property {string} id - UUID
 * @property {string} title
 * @property {string} description
 * @property {string} item_type - "lost" | "found"
 * @property {string} status - "open" | "claimed" | "returned" | "closed"
 * @property {string} location
 * @property {string} event_date - ISO8601
 * @property {string|null} image_url
 * @property {CategoryResponse} category
 * @property {UserPublic} reporter
 * @property {string} created_at - ISO8601
 * @property {string} updated_at - ISO8601
 */

/**
 * @typedef {Object} ClaimResponse
 * @property {string} id - UUID
 * @property {string} item_id - UUID
 * @property {string} claimant_id - UUID
 * @property {string} status - "pending" | "approved" | "rejected"
 * @property {string} created_at - ISO8601
 * @property {string} updated_at - ISO8601
 * @property {ItemResponse} item
 * @property {UserPublic} claimant
 * @property {string|null} ownership_proof
 * @property {string|null} review_note
 * @property {Object|null} counterparty_contact
 * @property {string} [counterparty_contact.full_name]
 * @property {string} [counterparty_contact.email]
 * @property {string} [counterparty_contact.phone]
 */

/**
 * @typedef {Object} ItemReturnResponse
 * @property {string} id - UUID
 * @property {string} item_id - UUID
 * @property {string} claim_id - UUID
 * @property {string} returned_by - UUID
 * @property {string} received_by - UUID
 * @property {string} returned_at - ISO8601
 * @property {string|null} notes
 */

/**
 * @typedef {Object} UserDashboard
 * @property {number} my_items_total
 * @property {Object.<string, number>} my_items_by_status
 * @property {Object.<string, number>} my_items_by_type
 * @property {Object.<string, number>} my_claims_by_status
 * @property {Object} pending_claims_on_my_items
 * @property {number} pending_claims_on_my_items.count
 * @property {Array<{id: string, claimant: UserPublic, created_at: string}>} pending_claims_on_my_items.recent
 * @property {ItemResponse[]} recent_items
 */

/**
 * @template T
 * @typedef {Object} Page
 * @property {T[]} data
 * @property {number} total
 * @property {number} page
 * @property {number} page_size
 * @property {number} total_pages
 */
