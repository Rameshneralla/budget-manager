/** Login API. The session itself is an httpOnly cookie handled by the browser. */
import { api } from './api';

export const authService = {
  /** { authRequired, authenticated } */
  getSession: () => api.get('/auth/session'),
  login: (password) => api.post('/auth/login', { password }),
  logout: () => api.post('/auth/logout'),
};
