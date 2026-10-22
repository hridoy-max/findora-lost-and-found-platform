/**
 * Token management for the Findora application.
 * Access tokens are kept in memory only for security.
 * Refresh tokens are stored in localStorage.
 */

let accessToken = null;

export const getAccess = () => accessToken;

export const getRefresh = () => localStorage.getItem('findora.refresh');

export const setTokens = ({ access_token, refresh_token }) => {
  accessToken = access_token;
  if (refresh_token) {
    localStorage.setItem('findora.refresh', refresh_token);
  }
};

export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('findora.refresh');
};

/**
 * Synchronize auth state across tabs.
 * If the refresh token is removed in one tab, sign out all others.
 */
export const initTokenSync = (onSignOut) => {
  window.addEventListener('storage', (event) => {
    if (event.key === 'findora.refresh' && event.newValue === null) {
      onSignOut();
    }
  });
};
