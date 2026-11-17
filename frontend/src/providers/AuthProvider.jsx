import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, clearAuthToken, setOnAuthFailure, axiosClient } from '../lib/axiosClient.js';
import { queryClient } from '../lib/queryClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children, initialToken = null, initialMember = null }) {
  const [token, setTokenState] = useState(() => {
    if (initialToken) {
      setAuthToken(initialToken);
      return initialToken;
    }
    return null;
  });
  const [member, setMember] = useState(initialMember);

  const logout = useCallback(async () => {
    const currentToken = token;
    clearAuthToken();
    setTokenState(null);
    setMember(null);
    // Cached lists carry per-member data (wishlist hearts, cart quantities).
    queryClient.invalidateQueries();

    try {
      if (currentToken) {
        await axiosClient.post('/auth/logout').catch(() => {});
      }
    } catch {
      // Ignore network errors on logout
    }
  }, [token]);

  useEffect(() => {
    setOnAuthFailure(() => {
      setTokenState(null);
      setMember(null);
    });
  }, []);

  // A background refresh: it must not flip a page-level loading flag, or RequireAuth would swap the
  // current page (and any open dialog) for a spinner every time the wallet or points change.
  const refreshMember = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await axiosClient.get('/auth/me');
      setMember(data);
      return data;
    } catch {
      return null;
    }
  }, [token]);

  const login = useCallback(async (newToken, initialMember = null) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    queryClient.invalidateQueries();
    if (initialMember) {
      setMember(initialMember);
    } else {
      try {
        const data = await axiosClient.get('/auth/me');
        setMember(data);
      } catch {
        setMember(null);
      }
    }
  }, []);

  const value = {
    token,
    member,
    isAuthenticated: Boolean(token && member),
    loading: false,
    login,
    logout,
    refreshMember,
    giftPoints: member?.giftPoints ?? 0,
    walletBalance: member?.walletBalance ?? '0.00'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
