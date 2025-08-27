import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Plus, Gamepad2, Heart, Users, Music, Clock, Check } from 'lucide-react';
import { User } from '../types';
import Spinner from '../components/Spinner';
import { DEFAULT_AVATAR_URL } from '../lib/constants';

const VR_BG = 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=2071&auto=format&fit=crop';
const CONTROLLER_BG = 'https://images.unsplash.com/photo-1622599522329-a5e2a6579201?q=80&w=2070&auto=format&fit=crop';

const GlassmorphicCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string }> = ({ icon, title, value }) => (
    <GlassmorphicCard className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-blue-gradient text-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-dimWhite">{title}</p>
            <h3 className="text-xl font-bold text-white">{value}</h3>
        </div>
    </GlassmorphicCard>
);

const VirtualRealityPage: React.FC = () => {
    const { t } = useLanguage();
    const { user, getUsers, sendInvitation } = useAuth();
    const [members, setMembers] = useState<User[]>([]);
    const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);

    const fetchMembers = useCallback(() => {
        if (!user) return;
        getUsers().then(allUsers => {
            const otherUsers = allUsers.filter(u => u.email !== user.email);
            setMembers(otherUsers.slice(-4).reverse());
        });
    }, [getUsers, user]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleConnect = async (targetEmail: string) => {
        setIsSendingInvite(targetEmail);
        const success = await sendInvitation(targetEmail);
        if (success) {
            fetchMembers(); // Re-fetch to get updated invitation status
        }
        setIsSendingInvite(null);
    };

    const getButtonState = (player: User) => {
        if (!user) return { text: t('vrPlayerActionJoin'), disabled: true, Icon: Plus, style: 'bg-blue-gradient text-primary' };

        const myInviteToPlayer = player.invitations.find(inv => inv.fromEmail === user.email);
        if (myInviteToPlayer) {
            if (myInviteToPlayer.status === 'accepted') {
                return { text: t('vrPlayerActionConnected'), disabled: true, Icon: Check, style: 'bg-green-600 text-white' };
            }
            if (myInviteToPlayer.status === 'pending') {
                return { text: t('vrPlayerActionPending'), disabled: true, Icon: Clock, style: 'bg-gray-600 text-white' };
            }
        }
        
        const playerInviteToMe = user.invitations.find(inv => inv.fromEmail === player.email);
        if (playerInviteToMe?.status === 'accepted') {
             return { text: t('vrPlayerActionConnected'), disabled: true, Icon: Check, style: 'bg-green-600 text-white' };
        }

        return { text: t('vrPlayerActionJoin'), disabled: false, Icon: Plus, style: 'bg-blue-gradient text-primary' };
    };

    return (
        <div className="space-y-6 sm:px-16 px-6 sm:py-12 py-4">
            <h1 className="font-poppins font-semibold text-4xl md:text-5xl text-white mb-2">{t('vrTitle')}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Welcome Card */}
                    <div className="relative rounded-2xl overflow-hidden h-64 flex items-end p-6 bg-cover bg-center" style={{ backgroundImage: `url(${VR_BG})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="relative z-10 text-white">
                            <h2 className="text-3xl font-bold">{t('vrWelcomeTitle')}</h2>
                            <p className="text-lg">{t('vrWelcomeText')}, {user?.profileData?.name || user?.email || t('vrWelcomeUser')}!</p>
                            <button className="mt-4 flex items-center gap-2 text-sm font-semibold">
                                {t('vrLaunch')} <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Controller Card */}
                    <GlassmorphicCard className="p-6">
                        <h3 className="font-semibold text-xl text-white">{t('vrControllerTitle')}</h3>
                        <div className="relative mt-4 h-56 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${CONTROLLER_BG})` }}>
                            <div className="absolute inset-0 bg-black/50 rounded-xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                                <Gamepad2 size={64} className="opacity-50" />
                            </div>
                        </div>
                    </GlassmorphicCard>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="space-y-4">
                        <StatCard icon={<Heart size={24} />} title={t('vrStat1Title')} value="76" />
                        <StatCard icon={<Users size={24} />} title={t('vrStat2Title')} value="3" />
                        <StatCard icon={<Music size={24} />} title={t('vrStat3Title')} value="128" />
                    </div>

                    {/* Newest Players */}
                    <GlassmorphicCard className="p-6">
                        <h3 className="font-semibold text-xl text-white mb-4">{t('vrPlayersTitle')}</h3>
                        <div className="space-y-4">
                            {members.map(player => {
                                const buttonState = getButtonState(player);
                                return (
                                <div key={player.email} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={player.profileData.imageUrl || DEFAULT_AVATAR_URL} alt={player.profileData.name} className="w-10 h-10 rounded-full object-cover"/>
                                        <div>
                                            <p className="font-semibold text-white">{player.profileData.name}</p>
                                            <p className={`text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-gray-500'}`}>
                                                {Math.random() > 0.5 ? t('vrPlayerStatusOnline') : t('vrPlayerStatusOffline')}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleConnect(player.email)}
                                        disabled={buttonState.disabled || isSendingInvite === player.email}
                                        className={`py-1 px-3 text-sm font-bold rounded-lg flex items-center justify-center gap-1 w-28 h-8 transition-colors disabled:opacity-70 ${buttonState.style}`}
                                    >
                                        {isSendingInvite === player.email ? <Spinner size="4" /> : 
                                            <>
                                                <buttonState.Icon size={14} /> {buttonState.text}
                                            </>
                                        }
                                    </button>
                                </div>
                            )})}
                        </div>
                    </GlassmorphicCard>
                </div>

            </div>
        </div>
    );
};

export default VirtualRealityPage;