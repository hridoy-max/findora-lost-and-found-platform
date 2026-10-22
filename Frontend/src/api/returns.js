import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: `${config.apiBaseUrl}/item-returns`,
});

/**
 * Record a handover for a specific claim.
 * @param {string} claimId - UUID of the claim.
 * @param {Object} data - Request body { notes?: string }.
 * @returns {Promise<Object>} ItemReturnResponse.
 */
export const recordReturn = async (claimId, data = {}) => {
  const response = await api.post(`/claims/${claimId}/return`, data);
  return response.data;
};

/**
 * Fetch a specific return record by ID.
 * @param {string} returnId - UUID of the return record.
 * @returns {Promise<Object>} ItemReturnResponse.
 */
export const getReturnById = async (returnId) => {
  const response = await api.get(`/returns/${returnId}`);
  return response.data;
};

/**
 * Check if a specific item has been returned.
 * @param {string} itemId - UUID of the item.
 * @returns {Promise<Object>} ItemReturnResponse.
 */
export const getItemReturn = async (itemId) => {
  const response = await api.get(`/items/${itemId}/return`);
  return response.data;
};
