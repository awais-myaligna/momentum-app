import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login as loginRequest, logout as logoutRequest, register as registerRequest, getStoredToken } from '../services/authService';
import { mockStore } from '../mocks/mockStore';

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

  useEffect(() => {
    const bootstrap = async () => {
      const [token, onboardedFlag] = await Promise.all([
        getStoredToken(),
        AsyncStorage.getItem(ONBOARDING_FLAG_KEY),
      ]);

      setHasOnboarded(onboardedFlag === 'true');
      setIsAuthenticated(Boolean(token));
      setHasCompletedBaseline(mockStore.hasCompletedBaseline);
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
    setHasCompletedBaseline(mockStore.hasCompletedBaseline);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    setIsAuthenticated(true);
    setHasCompletedBaseline(mockStore.hasCompletedBaseline);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setIsAuthenticated(false);
    setHasCompletedBaseline(false);
  }, []);

  const completeBaseline = useCallback(() => {
    setHasCompletedBaseline(true);
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      hasOnboarded,
      isAuthenticated,
      hasCompletedBaseline,
      completeOnboarding,
      login,
      register,
      logout,
      completeBaseline,
    }),
    [isBootstrapping, hasOnboarded, isAuthenticated, hasCompletedBaseline, completeOnboarding, login, register, logout, completeBaseline]
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
