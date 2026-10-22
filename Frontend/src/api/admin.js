import axios from 'axios';
import { config } from '../config';
import { apiClient } from './client';

/**
 * Admin API instance.
 * Note: We use apiClient instead of a separate axios instance to leverage
 * the authentication interceptors and refresh token logic.
 */
const adminApi = apiClient;
const ADMIN_BASE = '/admin';

/**
 * Fetch system-wide analytics for the admin dashboard.
 * @returns {Promise<Object>} AdminDashboard
 */
export const getAdminDashboard = async () => {
  const response = await adminApi.get(`${ADMIN_BASE}/dashboard`);
  return response.data;
};

// --- User Management ---

/**
 * List all users with filters and paging.
 * @param {Object} params - { search, role, is_active, start_date, end_date, sort_by, order, page, page_size }
 * @returns {Promise<Object>} PageUserResponse
 */
export const getAdminUsers = async (params = {}) => {
  const response = await adminApi.get(`${ADMIN_BASE}/users`, { params });
  return response.data;
};

/**
 * Create a new administrative or regular user.
 * @param {Object} data - { full_name, email, password, role }
 * @returns {Promise<Object>} UserPublic
 */
export const createAdminUser = async (data) => {
  const response = await adminApi.post(`${ADMIN_BASE}/users`, data);
  return response.data;
};

/**
 * Get safe profile details for a specific user.
 * @param {string} userId
 * @returns {Promise<Object>} UserPublic
 */
export const getAdminUserById = async (userId) => {
  const response = await adminApi.get(`${ADMIN_BASE}/users/${userId}`);
  return response.data;
};

/**
 * Update user activity status.
 * @param {string} userId
 * @param {Object} data - { is_active: boolean }
 * @returns {Promise<Object>} UserPublic
 */
export const updateAdminUserStatus = async (userId, data) => {
  const response = await adminApi.patch(`${ADMIN_BASE}/users/${userId}/status`, data);
  return response.data;
};

/**
 * Update user role.
 * @param {string} userId
 * @param {Object} data - { role: 'admin' | 'user' }
 * @returns {Promise<Object>} UserPublic
 */
export const updateAdminUserRole = async (userId, data) => {
  const response = await adminApi.patch(`${ADMIN_BASE}/users/${userId}/role`, data);
  return response.data;
};

/**
 * Remove a user from the system.
 * @param {string} userId
 */
export const deleteAdminUser = async (userId) => {
  await adminApi.delete(`${ADMIN_BASE}/users/${userId}`);
};

// --- Item Moderation ---

/**
 * List all items for admin oversight.
 * @param {Object} params - Standard item params plus { user_id, status }
 * @returns {Promise<Object>} PageItemResponse
 */
export const getAdminItems = async (params = {}) => {
  const response = await adminApi.get(`${ADMIN_BASE}/items`, { params });
  return response.data;
};

/**
 * Force an item status change (specifically open <-> closed).
 * @param {string} itemId
 * @param {Object} data - { status: 'open' | 'closed' }
 * @returns {Promise<Object>} ItemResponse
 */
export const updateAdminItemStatus = async (itemId, data) => {
  const response = await adminApi.patch(`${ADMIN_BASE}/items/${itemId}/status`, data);
  return response.data;
};

/**
 * Delete a report from the system.
 * @param {string} itemId
 */
export const deleteAdminItem = async (itemId) => {
  await adminApi.delete(`${ADMIN_BASE}/items/${itemId}`);
};

// --- Category Management ---

/**
 * List categories with item counts.
 * @param {Object} params - { search, is_active, sort_by, order, page, page_size }
 * @returns {Promise<Object>} PageCategoryResponse
 */
export const getAdminCategories = async (params = {}) => {
  const response = await adminApi.get(`${ADMIN_BASE}/categories`, { params });
  return response.data;
};

/**
 * Create a new item category.
 * @param {Object} data - { name, description }
 * @returns {Promise<Object>} CategoryResponse
 */
export const createCategory = async (data) => {
  const response = await adminApi.post(`${ADMIN_BASE}/categories`, data);
  return response.data;
};

/**
 * Update category details or activity status.
 * @param {string} categoryId
 * @param {Object} data - { name, description, is_active }
 * @returns {Promise<Object>} CategoryResponse
 */
export const updateCategory = async (categoryId, data) => {
  const response = await adminApi.patch(`${ADMIN_BASE}/categories/${categoryId}`, data);
  return response.data;
};

/**
 * Remove a category.
 * @param {string} categoryId
 */
export const deleteCategory = async (categoryId) => {
  await adminApi.delete(`${ADMIN_BASE}/categories/${categoryId}`);
};

// --- Claims Oversight ---

/**
 * List all claims for administrative review.
 * @param {Object} params - { search, status, item_id, claimant_id, sort_by, order, page, page_size }
 * @returns {Promise<Object>} PageClaimResponse
 */
export const getAdminClaims = async (params = {}) => {
  const response = await adminApi.get(`${ADMIN_BASE}/claims`, { params });
  return response.data;
};

/**
 * List only pending claims for quick processing.
 * @param {Object} params - Same as above.
 * @returns {Promise<Object>} PageClaimResponse
 */
export const getAdminClaimsPending = async (params = {}) => {
  const response = await adminApi.get(`${ADMIN_BASE}/claims/pending`, { params });
  return response.data;
};
