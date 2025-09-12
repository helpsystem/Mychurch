import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, BillingInfo, CreditCard, ProfileData, Language } from '../types';
import * as authService from '../lib/auth';
import { setToken } from '../lib/tokenManager';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      try {
        const currentUser = await authService.fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const handleAuthAction = useCallback(async (action: Promise<{user: User, token: string}>) => {
    try {
      const { user, token } = await action;
      setToken(token);
      setUser(user);
      return user;
    } catch (error) {
      console.error("Auth action failed:", error);
      throw error;
    }
  }, []);
  
  const handleDataUpdate = useCallback(async (action: Promise<User | null>) => {
    try {
      const resultUser = await action;
      if (resultUser) {
        setUser(resultUser);
      }
      return resultUser;
    } catch (error) {
      console.error("Data update failed:", error);
      throw error;
    }
  }, []);

  const login = (email: string, password: string) => handleAuthAction(authService.login({ email, password }));
  const adminLogin = (email: string, password: string) => handleAuthAction(authService.adminLogin({ email, password }));
  
  const signup = async (name: string, email: string, password: string, captchaToken?: string, website?: string): Promise<void> => {
    try {
        await authService.signup({ name, email, password, captchaToken, website });
    } catch (error) {
        console.error("Signup failed:", error);
        throw error;
    }
  };

  const verifyEmail = (token: string) => handleAuthAction(authService.verifyEmail(token));

  const createUser = (userData: any): Promise<User | null> => authService.createUser(userData);
  const updateUser = (email: string, userData: Partial<User>): Promise<User | null> => handleDataUpdate(authService.updateUser(email, userData));

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    window.location.hash = '/';
  }, []);

  const canEdit = useCallback((section: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'MANAGER') {
      return user.permissions.includes(section);
    }
    return false;
  }, [user]);
  
  const sendMessage = async (toEmail: string, subject: Record<Language, string>, body: Record<Language, string>, methods: ('inbox' | 'email')[]): Promise<boolean> => {
      return authService.sendMessage({ toEmail, subject, body, methods });
  };

  const updateBillingInfoItem = (field: keyof BillingInfo, value: string) => handleDataUpdate(authService.updateBillingInfoItem(field, value));
  const deleteBillingInfoItem = (field: keyof BillingInfo) => handleDataUpdate(authService.deleteBillingInfoItem(field));
  const addCard = (card: Omit<CreditCard, 'isPrimary'>) => handleDataUpdate(authService.addCard(card));
  const deleteCard = (cardNumber: string) => handleDataUpdate(authService.deleteCard(cardNumber));
  const acceptInvitation = (fromEmail: string) => handleDataUpdate(authService.acceptInvitation(fromEmail));
  const updateProfileData = (data: Partial<ProfileData>) => handleDataUpdate(authService.updateProfileData(data));
  const uploadProfilePicture = (file: File) => authService.uploadProfilePicture(file);
  const updateUserPushSubscription = (subscription: PushSubscriptionJSON | null) => handleDataUpdate(authService.updateUserPushSubscription(subscription));

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    canEdit,
    login,
    adminLogin,
    signup,
    verifyEmail,
    logout,
    loading,
    getUsers: authService.getUsers,
    updateUserPermissions: authService.updateUserPermissions,
    updateUserRole: authService.updateUserRole,
    createUser,
    updateUser,
    updateBillingInfoItem,
    deleteBillingInfoItem,
    addCard,
    deleteCard,
    sendInvitation: authService.sendInvitation,
    acceptInvitation,
    updateProfileData,
    uploadProfilePicture,
    getUserActivity: authService.getUserActivity,
    getSiteActivity: authService.getSiteActivity,
    updateUserPushSubscription,
    sendMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};