import { apiClient } from './client';

/**
 * Fetch the current user's dashboard summary.
 * @returns {Promise<Object>} UserDashboard
 */
export const getUserDashboard = async () => {
  const response = await apiClient.get('/users/me/dashboard');
  return response.data;
};
