import { apiClient } from './client';

/**
 * @typedef {import('./types').CategoryResponse} CategoryResponse
 * @typedef {import('./types').PageCategoryResponse} PageCategoryResponse
 */

/**
 * List available categories for reporting.
 * @param {string} [search] - Optional search term to filter categories.
 * @returns {Promise<PageCategoryResponse>}
 */
export const getCategories = async (search = '') => {
  const response = await apiClient.get('/categories', { params: { search } });
  return response.data;
};

/**
 * Get detailed information for a specific category.
 * @param {string} categoryId
 * @returns {Promise<CategoryResponse>}
 */
export const getCategoryById = async (categoryId) => {
  const response = await apiClient.get(`/categories/${categoryId}`);
  return response.data;
};
