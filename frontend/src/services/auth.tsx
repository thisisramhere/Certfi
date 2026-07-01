import React, { createContext, useContext, ReactNode } from 'react';
import { authAPI } from '../api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<{ access_token: string; refresh_token: string; token_type: string } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authState = authAPI.getStoredAuth();
        if (authState?.access_token) {
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
          } catch (err) {
            authAPI.clearAuthState();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await authAPI.login(credentials);
      authAPI.setAuthState({
        access_token: response.token_pair.access_token,
        refresh_token: response.token_pair.refresh_token,
        user: response.user
      });
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      authAPI.clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      if (response.token_pair) {
        authAPI.setAuthState({
          access_token: response.token_pair.access_token,
          refresh_token: response.token_pair.refresh_token,
          user: response.user
        });
        setUser(response.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      authAPI.clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authAPI.clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const tokens = await authAPI.refreshToken();
      if (tokens) {
        const currentUser = localStorage.getItem('current_user');
        authAPI.setAuthState({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user: currentUser ? JSON.parse(currentUser) : user,
        });
      }
      return tokens;
    } catch (err) {
      authAPI.clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};