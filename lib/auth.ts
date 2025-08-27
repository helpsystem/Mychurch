import { api } from './api';
import { User, BillingInfo, CreditCard, ProfileData, ActivityLog, Language } from '../types';
import { getAuthToken, removeToken } from './tokenManager';

// All paths have been reviewed and corrected to ensure they point to the correct backend endpoints.

export const signup = async (signupData: { name: string; email: string; password: string; }): Promise<void> => {
  await api.post('/api/auth/signup', signupData);
};

export const verifyEmail = async (token: string): Promise<{user: User, token: string}> => {
  return api.post('/api/auth/verify-email', { token });
};

export const login = async (loginData: { email: string; password: string; }): Promise<{user: User, token: string}> => {
  return api.post('/api/auth/login', loginData);
};

export const adminLogin = async (loginData: { email: string; password: string; }): Promise<{user: User, token: string}> => {
  return api.post('/api/auth/login', loginData);
};

export const logout = () => {
  removeToken();
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const data = await api.get<{ user: User }>('/api/auth/me');
    return data.user;
  } catch (error) {
    console.error("Failed to fetch current user, token might be invalid.", error);
    removeToken();
    return null;
  }
};

export const getUsers = async (): Promise<User[]> => {
    return api.get<User[]>('/api/users');
}

export const updateUserPermissions = async (email: string, permissions: string[]): Promise<boolean> => {
    await api.put<void>(`/api/users/${email}/permissions`, { permissions });
    return true;
}

export const updateUserRole = async (email: string, role: 'USER' | 'MANAGER' | 'SUPER_ADMIN'): Promise<boolean> => {
    await api.put<void>(`/api/users/${email}/role`, { role });
    return true;
}

export const getUserActivity = async (email: string): Promise<ActivityLog[]> => {
    // In a real app, this would fetch from an API endpoint like `/api/users/${email}/activity`
    console.log(`Fetching activity for ${email}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const MOCK_LOGS: ActivityLog[] = [
                { date: '2024-07-29 10:45:11', action: 'Update Content', details: 'Updated "Summer Picnic" event details.' },
                { date: '2024-07-28 15:20:05', action: 'Login', details: 'User logged in successfully.' },
                { date: '2024-07-28 15:21:30', action: 'Add Content', details: 'Added new sermon: "The Joy of the Lord".' },
                { date: '2024-07-28 18:00:00', action: 'Logout', details: 'User logged out.' },
            ];
            resolve(MOCK_LOGS);
        }, 500);
    });
}

export const getSiteActivity = async (): Promise<ActivityLog[]> => {
    // In a real app, this would fetch from an API endpoint like `/api/activity`
    console.log(`Fetching site-wide activity`);
    return new Promise(resolve => {
        setTimeout(() => {
            const MOCK_LOGS: ActivityLog[] = [
                { date: '2024-08-01 11:05:21', action: 'User Signup', details: 'newuser@example.com registered.' },
                { date: '2024-08-01 10:45:11', action: 'Update Content', details: 'Admin updated "Summer Picnic" event.' },
                { date: '2024-08-01 09:15:00', action: 'Send Notification', details: 'Admin sent "Weekly reminder" push notification.' },
                { date: '2024-07-31 18:30:00', action: 'Add Content', details: 'Manager added new worship song: "Way Maker".' },
                { date: '2024-07-31 15:20:05', action: 'User Login', details: 'member@example.com logged in.' },
            ];
            resolve(MOCK_LOGS);
        }, 500);
    });
}

export const createUser = async (userData: {name: string, email: string, password: string, role: string, permissions: string[]}): Promise<User> => {
    const { user } = await api.post<{user: User}>('/api/users', userData);
    return user;
};

export const updateUser = async (email: string, userData: Partial<User>): Promise<User | null> => {
    const { user } = await api.put<{ user: User }>(`/api/users/${encodeURIComponent(email)}`, userData);
    return user;
};

export const updateBillingInfoItem = async (field: keyof BillingInfo, value: string): Promise<User> => {
    const { user } = await api.put<{ user: User }>('/api/profile/billing', { [field]: value });
    return user;
};

export const deleteBillingInfoItem = async (field: keyof BillingInfo): Promise<User> => {
    const { user } = await api.delete<{ user: User }>(`/api/profile/billing/${field}`);
    return user;
};

export const addCard = async (card: Omit<CreditCard, 'isPrimary'>): Promise<User> => {
    const { user } = await api.post<{ user: User }>('/api/profile/cards', card);
    return user;
};

export const deleteCard = async (cardNumber: string): Promise<User> => {
    const { user } = await api.delete<{ user: User }>(`/api/profile/cards/${encodeURIComponent(cardNumber)}`);
    return user;
};

export const sendInvitation = async (toEmail: string): Promise<boolean> => {
    await api.post<void>('/api/invitations', { toEmail });
    return true;
};

export const sendMessage = async (messageData: { toEmail: string, subject: Record<Language, string>, body: Record<Language, string>, methods: ('inbox' | 'email')[] }): Promise<boolean> => {
    await api.post<void>('/api/messages/send', messageData);
    return true;
}

export const acceptInvitation = async (fromEmail: string): Promise<User> => {
    const { user } = await api.post<{ user: User }>(`/api/invitations/accept`, { fromEmail });
    return user;
};

export const updateProfileData = async (data: Partial<ProfileData>): Promise<User> => {
    const { user } = await api.put<{ user: User }>('/api/profile', data);
    return user;
};

export const uploadProfilePicture = (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('picture', file);
    return api.upload<{ imageUrl: string }>('/api/profile/picture', formData);
};

export const updateUserPushSubscription = async (subscription: PushSubscriptionJSON | null): Promise<User> => {
    // This simulates updating the user's push subscription on the backend
    const { user } = await api.put<{ user: User }>('/api/profile/push-subscription', { subscription });
    return user;
};