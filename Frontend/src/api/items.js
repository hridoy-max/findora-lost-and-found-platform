import { apiClient } from './client';
import { config } from '../config';

/**
 * @typedef {import('./types').ItemResponse} ItemResponse
 * @typedef {import('./types').PageItemResponse} PageItemResponse
 */

/**
 * Browse lost and found items.
 * @returns {Promise<PageItemResponse>}
 */
export const getItems = async (params = {}) => {
  const response = await apiClient.get('/items', { params });
  return response.data;
};

/**
 * Get full details of a specific item.
 * @param {string} itemId
 * @returns {Promise<ItemResponse>}
 */
export const getItemById = async (itemId) => {
  const response = await apiClient.get(`/items/${itemId}`);
  return response.data;
};

/**
 * List all reports created by the current user.
 * @returns {Promise<PageItemResponse>}
 */
export const getMyItems = async (params = {}) => {
  const response = await apiClient.get('/items/my-items', { params });
  return response.data;
};

/**
 * Create a new item report.
 * @param {Object} data
 * @returns {Promise<ItemResponse>}
 */
export const createItem = async (data) => {
  const response = await apiClient.post('/items', data);
  return response.data;
};

/**
 * Update item details.
 * @param {string} itemId
 * @param {Partial<ItemResponse>} data
 * @returns {Promise<ItemResponse>}
 */
export const updateItem = async (itemId, data) => {
  const response = await apiClient.patch(`/items/${itemId}`, data);
  return response.data;
};

/**
 * Mark an item as closed.
 * @param {string} itemId
 * @returns {Promise<ItemResponse>}
 */
export const closeItem = async (itemId) => {
  const response = await apiClient.patch(`/items/${itemId}/close`);
  return response.data;
};

/**
 * Remove a report.
 * @param {string} itemId
 */
export const deleteItem = async (itemId) => {
  await apiClient.delete(`/items/${itemId}`);
};
