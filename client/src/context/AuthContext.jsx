/**
 * Sign-in state. Shows the login page until the server confirms a session;
 * the rest of the app (and its data) only mounts once signed in.
 * When the server has no APP_PASSWORD (local use) the app opens directly.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setUnauthenticatedHandler } from '../services/api';
import LoginPage from '../pages/LoginPage';
import { ErrorState, LoadingState } from '../components/common/StateBlocks';

const AuthContext = createContext(null);

const AUTH_STATUS = Object.freeze({
  CHECKING: 'checking',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
  ERROR: 'error',
});

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(AUTH_STATUS.CHECKING);
  const [authRequired, setAuthRequired] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [checkAttempt, setCheckAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    authService
      .getSession()
      .then((session) => {
        if (!isCurrent) {
          return;
        }
        setAuthRequired(session.authRequired);
        setStatus(session.authenticated ? AUTH_STATUS.SIGNED_IN : AUTH_STATUS.SIGNED_OUT);
      })
      .catch((error) => {
        if (isCurrent) {
          setCheckError(error);
          setStatus(AUTH_STATUS.ERROR);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [checkAttempt]);

  // Any API call that comes back "not signed in" returns the user to the login page.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      setSessionExpired(true);
      setStatus(AUTH_STATUS.SIGNED_OUT);
    });
    return () => setUnauthenticatedHandler(() => {});
  }, []);

  const login = useCallback(async (password) => {
    await authService.login(password);
    setSessionExpired(false);
    setStatus(AUTH_STATUS.SIGNED_IN);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setSessionExpired(false);
      setStatus(AUTH_STATUS.SIGNED_OUT);
    }
  }, []);

  const value = useMemo(() => ({ authRequired, logout }), [authRequired, logout]);

  if (status === AUTH_STATUS.CHECKING) {
    return <LoadingState message="Loading..." />;
  }
  if (status === AUTH_STATUS.ERROR) {
    return (
      <ErrorState
        title="Unable to reach the budget server"
        message={checkError?.message}
        onRetry={() => {
          setStatus(AUTH_STATUS.CHECKING);
          setCheckAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }
  if (status === AUTH_STATUS.SIGNED_OUT) {
    return <LoginPage onLogin={login} sessionExpired={sessionExpired} />;
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
