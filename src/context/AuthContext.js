import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from '../services/authService';

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

  const completeBaseline = useCallback(() => {
    setHasCompletedBaseline(true);
  }, []);

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
