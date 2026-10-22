import { apiClient } from './client';

/**
 * @typedef {import('./types').ClaimResponse} ClaimResponse
 * @typedef {import('./types').PageClaimResponse} PageClaimResponse
 */

/**
 * Submit a claim for a found item.
 * @param {string} itemId
 * @param {{ ownership_proof: string }} data
 * @returns {Promise<ClaimResponse>}
 */
export const submitClaim = async (itemId, data) => {
  const response = await apiClient.post(`/items/${itemId}/claims`, data);
  return response.data;
};

/**
 * List all claims submitted by the current user.
 * @param {Object} [params]
 * @returns {Promise<PageClaimResponse>}
 */
export const getMyClaims = async (params = {}) => {
  const response = await apiClient.get('/claims/my-claims', { params });
  return response.data;
};

/**
 * List all claims for a specific item.
 * @param {string} itemId
 * @param {Object} [params]
 * @returns {Promise<PageClaimResponse>}
 */
export const getItemClaims = async (itemId, params = {}) => {
  const response = await apiClient.get(`/items/${itemId}/claims`, { params });
  return response.data;
};

/**
 * Get full details of a specific claim.
 * @param {string} claimId
 * @returns {Promise<ClaimResponse>}
 */
export const getClaimById = async (claimId) => {
  const response = await apiClient.get(`/claims/${claimId}`);
  return response.data;
};

/**
 * Review a claim (approve or reject).
 * @param {string} claimId
 * @param {{ status: 'approved' | 'rejected', review_note?: string }} data
 * @returns {Promise<ClaimResponse>}
 */
export const reviewClaim = async (claimId, data) => {
  const response = await apiClient.patch(`/claims/${claimId}/review`, data);
  return response.data;
};

/**
 * Withdraw a pending claim.
 * @param {string} claimId
 */
export const withdrawClaim = async (claimId) => {
  await apiClient.delete(`/claims/${claimId}`);
};
