import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: `${config.apiBaseUrl}`,
});

/**
 * Fetch the current user's dashboard summary.
 * @returns {Promise<Object>} UserDashboard
 */
export const getUserDashboard = async () => {
  const response = await api.get('/users/me/dashboard');
  return response.data;
};
