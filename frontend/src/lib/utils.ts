import { User } from '../types';
import { DEFAULT_AVATAR_URL } from './constants';

export const getProfilePictureUrl = (user: User | null): string => {
    if (!user) return DEFAULT_AVATAR_URL;
    return user.profileData.imageUrl || DEFAULT_AVATAR_URL;
};
