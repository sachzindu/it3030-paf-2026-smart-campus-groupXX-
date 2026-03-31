import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * Provides authentication state and operations to the entire app.
 *
 * State:
 *   - user: current user profile (id, name, email, role, etc.) or null
 *   - token: JWT token string or null
 *   - loading: true while checking auth on mount
 *
 * Operations:
 *   - login(email, password) → authenticates and stores token/user
 *   - signup(name, email, password) → registers and stores token/user
 *   - loginWithToken(token) → used by OAuth2 callback to set token and fetch user
 *   - logout() → clears auth state and redirects to login
 *   - getDashboardPath() → returns the correct dashboard route for the user's role
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smarthub_token'));
  const [loading, setLoading] = useState(true);

  /**
   * Returns the dashboard path for a given role.
   */
  const getDashboardPath = useCallback((role) => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'TECHNICIAN':
        return '/dashboard/technician';
      case 'USER':
      default:
        return '/dashboard/user';
    }
  }, []);

  /**
   * Fetch current user profile using the stored token.
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('smarthub_user', JSON.stringify(userData));
      return userData;
    } catch {
      // Token is invalid or expired
      setToken(null);
      setUser(null);
      localStorage.removeItem('smarthub_token');
      localStorage.removeItem('smarthub_user');
      return null;
    }
  }, []);

  /**
   * On mount: validate existing token by fetching user profile.
   */
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchCurrentUser();
      }
      setLoading(false);
    };
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Login with email and password.
   */
  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('smarthub_token', newToken);
    localStorage.setItem('smarthub_user', JSON.stringify(userData));

    return userData;
  };

  /**
   * Register a new user account (always USER role).
   */
  const signup = async (name, email, password) => {
    const response = await api.post('/api/auth/signup', { name, email, password });
    const { token: newToken, user: userData } = response.data.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('smarthub_token', newToken);
    localStorage.setItem('smarthub_user', JSON.stringify(userData));

    return userData;
  };

  /**
   * Set a token directly (used by OAuth2 callback) and fetch the user profile.
   */
  const loginWithToken = async (newToken) => {
    setToken(newToken);
    localStorage.setItem('smarthub_token', newToken);
    const userData = await fetchCurrentUser();
    return userData;
  };

  /**
   * Logout: clear all auth state.
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smarthub_token');
    localStorage.removeItem('smarthub_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    loginWithToken,
    logout,
    getDashboardPath,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context. Must be used within AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
