import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setUnauthorizedHandler } from '../api/axios';
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from '../services/authService';
import { getUserProfile } from '../services/profileService';
import { ERROR_TYPES } from '../utils/apiError';

const AuthContext = createContext(null);

const ONBOARDING_FLAG_KEY = 'momentum_has_onboarded';

/**
 * Drives RootNavigator's top-level routing decision: Splash while
 * bootstrapping, then Onboarding -> Auth -> Assessment -> Main, in that
 * order, based on what the user has completed so far.
 */
export const AuthProvider = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedBaseline, setHasCompletedBaseline] = useState(false);
  const [user, setUser] = useState(null);

  // Keep a stable ref to logout so the 401 handler registered below never
  // captures a stale closure — it always calls whatever logout is at call time.
  const logoutRef = useRef(null);

  useEffect(() => {
    const bootstrap = async () => {
      const [token, onboardedFlag, storedUser] = await Promise.all([
        getStoredToken(),
        AsyncStorage.getItem(ONBOARDING_FLAG_KEY),
        getStoredUser(),
      ]);

      setHasOnboarded(onboardedFlag === 'true');
      setIsAuthenticated(Boolean(token));
      setUser(storedUser);
      // Seed from the last-known cached value first so there's a sane
      // fallback if the confirmation call below can't complete (offline,
      // slow network) — this alone was the bug: it used to never be set
      // during restore at all, so every refresh silently defaulted to
      // `false` and routed straight back into the baseline assessment.
      setHasCompletedBaseline(Boolean(storedUser?.hasCompletedBaseline));

      if (token) {
        // Confirm against the authoritative backend record rather than
        // trusting the cached copy alone — it can be stale (e.g. baseline
        // completed from another device/session). RootNavigator stays on
        // the splash screen (isBootstrapping) until this resolves.
        try {
          const freshUser = await getUserProfile();
          setUser(freshUser);
          setHasCompletedBaseline(Boolean(freshUser?.hasCompletedBaseline));
          await setStoredUser(freshUser);
        } catch (err) {
          if (err?.type === ERROR_TYPES.UNAUTHORIZED) {
            // Token is expired or revoked — clear the session immediately
            // instead of keeping a stale token that will cause every
            // subsequent API call to fail with 401.
            await logoutRef.current?.();
          }
          // Offline / backend hiccup — keep the cached value already
          // applied above instead of blocking startup.
        }
      }

      setIsBootstrapping(false);
    };

    bootstrap();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    setIsAuthenticated(true);
    setHasCompletedBaseline(data.hasCompletedBaseline);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    setIsAuthenticated(true);
    setHasCompletedBaseline(data.hasCompletedBaseline);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setIsAuthenticated(false);
    setHasCompletedBaseline(false);
    setUser(null);
  }, []);

  // Keep the ref in sync with the callback so bootstrap and the global 401
  // handler always have access to the latest version without re-registering.
  logoutRef.current = logout;

  // Register logout as the global 401 handler immediately after it's
  // defined — any API call that returns 401 (expired / revoked token)
  // will automatically trigger a full session clear + redirect to login.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Manual escape hatch for the rare case a screen renders before `user` is
  // populated (e.g. bootstrap's profile fetch failed while offline) — every
  // normal screen should read `user` from context instead of calling
  // Get Profile itself.
  const refreshUser = useCallback(async () => {
    const freshUser = await getUserProfile();
    setUser(freshUser);
    setHasCompletedBaseline(Boolean(freshUser?.hasCompletedBaseline));
    await setStoredUser(freshUser);
    return freshUser;
  }, []);

  const completeBaseline = useCallback(async () => {
    setHasCompletedBaseline(true);
    // Keep the cached user record in sync too, so it already reflects
    // completion (bootstrap's fallback, other screens reading `user`)
    // even before the next authoritative profile fetch.
    if (user) {
      const next = { ...user, hasCompletedBaseline: true };
      await setStoredUser(next);
      setUser(next);
    }
  }, [user]);

  // Merges profile edits (e.g. from Edit Profile) into the persisted/session user
  // so the name and email shown across the app stay in sync without a re-login.
  const updateUser = useCallback(
    async (patch) => {
      const next = { ...user, ...patch };
      await setStoredUser(next);
      setUser(next);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      isBootstrapping,
      hasOnboarded,
      isAuthenticated,
      hasCompletedBaseline,
      user,
      completeOnboarding,
      login,
      register,
      logout,
      completeBaseline,
      updateUser,
      refreshUser,
    }),
    [
      isBootstrapping,
      hasOnboarded,
      isAuthenticated,
      hasCompletedBaseline,
      user,
      completeOnboarding,
      login,
      register,
      logout,
      completeBaseline,
      updateUser,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
