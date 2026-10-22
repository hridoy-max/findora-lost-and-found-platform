import apiClient from './client';

export const authApi = {
  async register(data) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data) {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  async refresh(refreshToken) {
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },

  async me() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Local tokens cleared in context
    }
  },

  async updateProfile(data) {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },

  async changePassword(data) {
    const res = await apiClient.patch('/auth/change-password', data);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
};
