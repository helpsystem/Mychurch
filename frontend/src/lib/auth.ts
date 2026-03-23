import { api } from './api';
import { User, UserRole, BillingInfo, CreditCard, ProfileData, ActivityLog, Language } from '../types';
import { getAuthToken, removeToken } from './tokenManager';
import { supabase } from './supabaseClient'; // Ensure supabase client is imported

// -----------------------------------------------------
// SUPABASE AUTHENTICATION INTEGRATION (New Option A Flow)
// -----------------------------------------------------

/**
 * Sign up a new user using Supabase Auth.
 * Captures email, password, name, and phone.
 */
export const signup = async (signupData: { name: string; email: string; password: string; phone?: string; captchaToken?: string; website?: string; }): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
            data: {
                full_name: signupData.name, // Save name in metadata
                phone: signupData.phone,    // Save phone in metadata
            }
        }
    });

    if (error) {
        throw new Error(error.message);
    }
    
    // Note: User is not fully signed in until they verify OTP.
};

/**
 * Verify OTP sent to the user's email during signup.
 */
export const verifyOtp = async (email: string, token: string): Promise<{ user: User, token: string }> => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup' // or 'email' depending on Supabase configuration
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.session) {
        throw new Error("Verification succeeded, but no session returned.");
    }

    if (!data.user) {
        throw new Error("Verification succeeded, but no user data returned.");
    }

    // Fetch full user details from public.users table
    const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();

    const user: User = {
        email: data.user.email || '',
        role: dbUser?.role || 'USER',
        roles: dbUser?.roles || ['USER'],
        permissions: dbUser?.permissions || [],
        profileData: {
            name: dbUser?.name || data.user.user_metadata?.full_name || '',
            phone: dbUser?.phone || data.user.user_metadata?.phone || '',
            whatsappNumber: dbUser?.whatsappNumber || '',
            billingInfo: dbUser?.billingInfo || { name: '', company: '', email: '', vat: '' },
            creditCards: dbUser?.creditCards || []
        },
        invitations: dbUser?.invitations || [],
        activityLog: [],
        messages: dbUser?.messages || []
    };
    
    return { user, token: data.session.access_token };
};

export const verifyEmail = async (token: string): Promise<{ user: User, token: string }> => {
    // This was the old magic link method. If magic links are still used somewhere, keep this.
    // Otherwise it could be removed in favor of verifyOtp.
    return api.post('/api/auth/verify-email', { token });
};

/**
 * Log in an existing user using Supabase Auth.
 */
export const login = async (loginData: { email: string; password: string; }): Promise<{ user: User, token: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.session) {
        throw new Error("Login succeeded, but no session returned.");
    }

    if (!data.user) {
        throw new Error("Login succeeded, but no user data returned.");
    }

    // Fetch full user details from public.users table
    const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();

    const user: User = {
        email: data.user.email || '',
        role: dbUser?.role || 'USER',
        roles: dbUser?.roles || ['USER'],
        permissions: dbUser?.permissions || [],
        profileData: {
             name: dbUser?.name || data.user.user_metadata?.full_name || '',
             phone: dbUser?.phone || data.user.user_metadata?.phone || '',
             whatsappNumber: dbUser?.whatsappNumber || '',
             billingInfo: dbUser?.billingInfo || { name: '', company: '', email: '', vat: '' },
             creditCards: []
        },
        invitations: dbUser?.invitations || [],
        activityLog: [],
        messages: dbUser?.messages || []
    };

    return { user, token: data.session.access_token };
};

export const adminLogin = async (loginData: { email: string; password: string; }): Promise<{ user: User, token: string }> => {
    return api.post('/api/auth/admin-login', loginData);
};

export const logout = async () => {
    await supabase.auth.signOut();
    removeToken();
};

export const fetchCurrentUser = async (): Promise<User | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        removeToken();
        return null;
    }

    const { user: supaUser } = session;

    // Fetch full user details from public.users table
    // We match by email since the public.users table might not have the Supabase ID yet
    const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', supaUser.email)
        .single();

    if (dbError || !dbUser) {
        console.warn("User session exists in Supabase Auth, but not found in public.users table:", dbError?.message);
        // Fallback to metadata for basic info
        return {
            email: supaUser.email || '',
            role: 'USER',
            roles: ['USER'],
            permissions: [],
            profileData: {
                 name: supaUser.user_metadata?.full_name || '',
                 phone: supaUser.user_metadata?.phone || '',
                 billingInfo: { name: '', company: '', email: '', vat: '' },
                 creditCards: []
            },
            invitations: [],
            activityLog: [],
            messages: []
        };
    }

    const user: User = {
        email: dbUser.email,
        role: dbUser.role || 'USER',
        roles: Array.isArray(dbUser.roles) ? dbUser.roles : [dbUser.role || 'USER'],
        permissions: Array.isArray(dbUser.permissions) ? dbUser.permissions : [],
        profileData: {
            name: dbUser.name || dbUser.profileData?.name || '',
            phone: dbUser.phone || dbUser.profileData?.phone || '',
            whatsappNumber: dbUser.whatsappNumber || dbUser.profileData?.whatsappNumber || '',
            gender: dbUser.gender || dbUser.profileData?.gender || 'neutral',
            imageUrl: dbUser.imageUrl || dbUser.profileData?.imageUrl || '',
            billingInfo: dbUser.billingInfo || dbUser.profileData?.billingInfo || { name: '', company: '', email: '', vat: '' },
            creditCards: dbUser.creditCards || dbUser.profileData?.creditCards || [],
            signature: dbUser.signature || dbUser.profileData?.signature
        },
        invitations: dbUser.invitations || [],
        activityLog: [],
        messages: dbUser.messages || []
    };
    return user;
};

export const getUsers = async (): Promise<User[]> => {
    return api.get<User[]>('/api/users');
}

export const updateUserPermissions = async (email: string, permissions: string[]): Promise<boolean> => {
    await api.put<void>(`/api/users/${email}/permissions`, { permissions });
    return true;
}

export const updateUserRole = async (email: string, role: UserRole): Promise<boolean> => {
    await api.put<void>(`/api/users/${email}/role`, { role });
    return true;
}

export const updateUserRoles = async (email: string, roles: UserRole[]): Promise<boolean> => {
    await api.put<void>(`/api/users/${email}/roles`, { roles });
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

export const createUser = async (userData: { name: string, email: string, password: string, role: string, permissions: string[] }): Promise<User> => {
    const { user } = await api.post<{ user: User }>('/api/users', userData);
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