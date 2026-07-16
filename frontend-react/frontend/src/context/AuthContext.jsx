import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
const TOKEN_KEY = 'snip_token';

export function AuthProvider({ children }) {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // A ref (not state) holds the live token, so apiFetch always reads the
  // current value even inside closures created before a refresh happened.
  const tokenRef = useRef(sessionStorage.getItem(TOKEN_KEY));

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const openAuthModal = (tab = 'login') => { setAuthModalTab(tab); setAuthModalOpen(true); };
  const closeAuthModal = () => setAuthModalOpen(false);

  const saveToken = (t) => {
    tokenRef.current = t;
    sessionStorage.setItem(TOKEN_KEY, t);
  };
  const clearToken = () => {
    tokenRef.current = null;
    sessionStorage.removeItem(TOKEN_KEY);
  };

  const tryRefresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!r.ok) return false;
      const d = await r.json();
      saveToken(d.accessToken);
      setCurrentUser(d.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async (silent = false) => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore network errors on logout */
    }
    clearToken();
    setCurrentUser(null);
    if (!silent) toast('Signed out');
  }, [toast]);

  // Generic fetch wrapper: attaches the bearer token, and if the backend
  // responds 401 (expired access token) it tries one silent refresh via
  // the httpOnly refresh cookie, then retries the original request once.
  const apiFetch = useCallback(async (path, opts = {}) => {
    const buildHeaders = () => ({
      'Content-Type': 'application/json',
      ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
      ...(opts.headers || {}),
    });

    let res = await fetch(path, { ...opts, headers: buildHeaders() });

    if (res.status === 401 && tokenRef.current) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetch(path, { ...opts, headers: buildHeaders() });
      } else {
        await logout(true);
      }
    }
    return res;
  }, [tryRefresh, logout]);

  const fetchMe = useCallback(async () => {
    try {
      const r = await apiFetch('/api/auth/me');
      if (!r.ok) return false;
      setCurrentUser(await r.json());
      return true;
    } catch {
      return false;
    }
  }, [apiFetch]);

  const login = async (email, password) => {
    const r = await fetch('api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Login failed');
    saveToken(d.accessToken);
    setCurrentUser(d.user);
    return d.user;
  };

  const register = async (name, email, password) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Registration failed');
    saveToken(d.accessToken);
    setCurrentUser(d.user);
    return d.user;
  };

  const googleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // On mount: pick up a token passed back from a Google OAuth redirect,
  // report an OAuth failure, then try to resolve the current user.
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const redirectToken = params.get('token');
      const authError = params.get('auth') === 'error';

      if (redirectToken || authError) {
        if (redirectToken) saveToken(redirectToken);
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (tokenRef.current) {
        const ok = await fetchMe();
        if (!ok) {
          const refreshed = await tryRefresh();
          if (refreshed) await fetchMe();
        }
      }

      setLoading(false);
      if (authError) toast('Google sign-in failed', true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    currentUser,
    loading,
    apiFetch,
    login,
    register,
    googleLogin,
    logout,
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
