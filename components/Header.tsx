

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, Bell, Check, ChevronDown, User as UserIcon, LogOut, LayoutDashboard, Home, BookOpen, HeartHandshake, Info, DollarSign, MessageSquare, Phone, BrainCircuit, Image, Globe, HelpCircle, Users, Tv, Search, Bookmark, Gamepad2, Volume2, Music } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { getProfilePictureUrl } from '../lib/utils';
import { User } from '../types';
import { useContent } from '../hooks/useContent';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import Spinner from './Spinner';
import GlobalSearchModal from './GlobalSearchModal';

const InvitationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, acceptInvitation } = useAuth();
    const { t } = useLanguage();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pendingInvites = user?.invitations?.filter(inv => inv.status === 'pending') ?? [];

    const handleAccept = async (fromEmail: string) => {
        await acceptInvitation(fromEmail);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={dropdownRef} className="absolute top-full mt-2 right-0 w-72 bg-black-gradient border border-gray-700 rounded-lg shadow-lg z-50 p-4">
            <h3 className="text-white font-semibold mb-2">{t('notifications')}</h3>
            <div className="space-y-2">
                {pendingInvites.length > 0 ? (
                    pendingInvites.map(invite => (
                        <div key={invite.fromEmail} className="text-sm p-2 rounded-md bg-primary/50 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold">{invite.fromName}</p>
                                <p className="text-dimWhite">{t('invitationFrom')}</p>
                            </div>
                            <button onClick={() => handleAccept(invite.fromEmail)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 py-1 flex items-center gap-1 text-xs">
                                <Check size={14}/> {t('accept')}
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-dimWhite text-sm text-center py-4">{t('noNotifications')}</p>
                )}
            </div>
        </div>
    );
};

const NavDropdown: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button className="font-normal cursor-pointer text-[16px] text-dimWhite hover:text-white flex items-center gap-1">
                {title}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-48 bg-black-gradient border border-gray-700 rounded-lg shadow-lg z-50 py-2">
                    {children}
                </div>
            )}
        </div>
    );
};

const Header: React.FC<{ onOpenVerseModal: () => void }> = ({ onOpenVerseModal }) => {
    const { t, lang } = useLanguage();
    const { isAuthenticated, user, logout } = useAuth();
    const { content } = useContent();
    const { isTranslated, isLoading: isTranslating, toggleTranslation } = useLiveTranslation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isBellOpen, setIsBellOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const pendingInvitesCount = user?.invitations?.filter(inv => inv.status === 'pending').length ?? 0;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const closeMenu = () => setIsMenuOpen(false);

    const menuItems: {
        ministries: { to: string, title: string, icon: JSX.Element }[],
        resources: ({ to: string, title: string, icon: JSX.Element, action?: undefined } | { action: () => void, title: string, icon: JSX.Element, to?: undefined })[],
        connect: { to: string, title: string, icon: JSX.Element }[]
    } = {
        ministries: [
            { to: '/sermons', title: t('navSermons'), icon: <BookOpen size={16}/> },
            { to: '/worship', title: t('worshipTitle'), icon: <HeartHandshake size={16}/> },
            { to: '/events', title: t('navEvents'), icon: <UserIcon size={16}/> },
        ],
        resources: [
            { to: '/bible', title: t('navBible'), icon: <BookOpen size={16}/> },
            { to: '/audio-bible', title: lang === 'fa' ? 'کتاب مقدس صوتی' : 'Audio Bible', icon: <Volume2 size={16}/> },
            { to: '/worship-songs', title: lang === 'fa' ? 'سرودهای مسیحی' : 'Worship Songs', icon: <Music size={16}/> },
            { title: t('verseForToday'), icon: <Bookmark size={16} />, action: onOpenVerseModal },
            { to: '/connect', title: t('navConnectVR'), icon: <Gamepad2 size={16}/> },
            { to: '/gallery', title: t('galleries'), icon: <Image size={16}/> },
            { to: '/ai-helper', title: t('navAiHelper'), icon: <BrainCircuit size={16}/> },
            { to: '/live', title: t('navLive'), icon: <Tv size={16}/> },
            { to: '/giving', title: t('navGiving'), icon: <DollarSign size={16}/> },
            { to: '/help-center', title: t('footerLinkHelp'), icon: <HelpCircle size={16}/> },
        ],
        connect: [
            { to: '/new-here', title: t('navNewHere'), icon: <Users size={16}/> },
            { to: '/about', title: t('navAbout'), icon: <Info size={16}/> },
            { to: '/testimonials', title: t('navTestimonials'), icon: <MessageSquare size={16}/> },
            { to: '/prayer', title: t('navPrayer'), icon: <HeartHandshake size={16}/> },
            { to: '/contact', title: t('navContact'), icon: <Phone size={16}/> },
        ]
    };
    
    const renderMobileMenu = () => (
      <div className={`fixed inset-0 bg-primary z-50 p-6 flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : (lang === 'fa' ? 'translate-x-full' : '-translate-x-full') }`}>
            <div className="flex justify-between items-center mb-8">
                <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
                    <img src={content.settings.logoUrl} alt="Church Logo" className="w-10 h-10" />
                    <span className="text-white text-lg font-semibold">{t('churchTitle')}</span>
                </Link>
                <button onClick={closeMenu}><X size={28} className="text-white"/></button>
            </div>
            
            <nav className="flex-grow space-y-4">
                <NavLink to="/" onClick={closeMenu} className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg text-lg ${isActive ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}> <Home size={20}/> {t('navHome')} </NavLink>
                
                {[
                    {title: t('navMinistries'), links: menuItems.ministries}, 
                    {title: t('navResources'), links: menuItems.resources},
                    {title: t('navConnect'), links: menuItems.connect}
                ].map(group => (
                    <div key={group.title}>
                        <h3 className="text-gray-500 font-bold text-sm uppercase px-3 mt-4 mb-2">{group.title}</h3>
                        {group.links.map(link => {
                            if (link.action) {
                                return (
                                    <button key={link.title} onClick={() => { link.action(); closeMenu(); }} className="w-full flex items-center gap-3 p-3 rounded-lg text-dimWhite hover:bg-gray-800">
                                        {link.icon} {link.title}
                                    </button>
                                );
                            }
                            return (
                                <NavLink key={link.to} to={link.to!} onClick={closeMenu} className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}>
                                    {link.icon} {link.title}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="mt-auto border-t border-gray-700">
                <div className="pt-6 pb-4">
                    {isAuthenticated ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3">
                                <img src={getProfilePictureUrl(user)} alt="profile" className="w-10 h-10 rounded-full object-cover border-2 border-dimWhite"/>
                                <div>
                                    <p className="font-semibold text-white">{user?.profileData.name}</p>
                                    <p className="text-sm text-dimWhite">{user?.email}</p>
                                </div>
                            </div>
                            <NavLink to="/profile" onClick={closeMenu} className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg text-lg ${isActive ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}>
                                <UserIcon size={20}/> {t('profile')}
                            </NavLink>
                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                <NavLink to="/admin" onClick={closeMenu} className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg text-lg ${isActive ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}>
                                    <LayoutDashboard size={20}/> {t('dashboard')}
                                </NavLink>
                            )}
                            <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full text-left flex items-center gap-3 p-3 rounded-lg text-lg text-red-400 hover:bg-gray-800 hover:text-red-300">
                                <LogOut size={20}/> {t('logout')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Link to="/login" onClick={closeMenu} className="block w-full text-center p-3 text-lg font-semibold text-dimWhite bg-gray-800 hover:bg-gray-700 rounded-lg">{t('login')}</Link>
                            <Link to="/signup" onClick={closeMenu} className="block w-full text-center p-3 text-lg font-semibold text-primary bg-blue-gradient rounded-lg">{t('signup')}</Link>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-700 pt-4 pb-2 space-y-4">
                    <button
                        onClick={() => {
                            toggleTranslation(lang === 'en' ? 'fa' : 'en');
                            closeMenu();
                        }}
                        disabled={isTranslating}
                        className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg text-lg ${isTranslated ? 'bg-secondary text-primary' : 'bg-gray-800 text-dimWhite'} disabled:opacity-50`}
                    >
                        {isTranslating ? <Spinner size="5" /> : <Globe size={20} />}
                        <span>{isTranslated ? t('revertTranslation') : t('liveTranslate')}</span>
                    </button>
                    <LanguageSwitcher />
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            <header className="w-full flex py-4 justify-between items-center navbar">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <img src={content.settings.logoUrl} alt="Church Logo" className="w-10 h-10" />
                    <span className="text-white text-lg font-semibold hidden md:block">{t('churchTitle')}</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="list-none md:flex hidden justify-center items-center gap-8 flex-1" dir="ltr">
                    <NavLink to="/" className={({isActive}) => `font-normal text-[16px] ${isActive ? 'text-white' : 'text-dimWhite'} hover:text-white`}>{t('navHome')}</NavLink>
                    <NavDropdown title={t('navMinistries')}>
                        {menuItems.ministries.map(item => <NavLink key={item.to} to={item.to} className="flex gap-3 items-center px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white">{item.icon}{item.title}</NavLink>)}
                    </NavDropdown>
                    <NavDropdown title={t('navResources')}>
                        {menuItems.resources.map(item => {
                            if (item.action) {
                                return (
                                    <button key={item.title} onClick={item.action} className="w-full text-left flex gap-3 items-center px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white">
                                        {item.icon}{item.title}
                                    </button>
                                );
                            }
                            return <NavLink key={item.to} to={item.to!} className="flex gap-3 items-center px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white">{item.icon}{item.title}</NavLink>
                        })}
                    </NavDropdown>
                    <NavDropdown title={t('navConnect')}>
                        {menuItems.connect.map(item => <NavLink key={item.to} to={item.to} className="flex gap-3 items-center px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white">{item.icon}{item.title}</NavLink>)}
                    </NavDropdown>
                </nav>

                {/* Auth & Lang Switcher */}
                <div className="hidden md:flex items-center gap-4">
                    <button onClick={() => setIsSearchOpen(true)} className="p-2 text-dimWhite hover:text-white"><Search size={20} /></button>
                    <LanguageSwitcher />
                    <button
                        onClick={() => toggleTranslation(lang === 'en' ? 'fa' : 'en')}
                        disabled={isTranslating}
                        className={`p-2 rounded-full transition-colors ${isTranslated ? 'bg-secondary text-primary' : 'bg-primary text-dimWhite'} hover:text-white border border-gray-700 disabled:opacity-50`}
                        title={t('toggleLiveTranslation')}
                    >
                        {isTranslating ? <Spinner size="5" /> : <Globe size={20} />}
                    </button>
                    <div className="w-px h-6 bg-white/20"></div>
                    {isAuthenticated ? (
                        <>
                            <div className="relative">
                                {pendingInvitesCount > 0 && (
                                    <button onClick={() => setIsBellOpen(prev => !prev)} className="text-dimWhite hover:text-white transition-colors relative">
                                        <Bell size={20} />
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary" />
                                    </button>
                                )}
                                {isBellOpen && <InvitationsDropdown onClose={() => setIsBellOpen(false)} />}
                            </div>
                            <div className="relative" id="user-profile-button">
                                <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center gap-2">
                                    <img src={getProfilePictureUrl(user)} alt="profile" className="w-8 h-8 rounded-full object-cover border-2 border-dimWhite"/>
                                </button>
                                {isProfileOpen && (
                                    <div className="absolute top-full mt-2 right-0 w-48 bg-black-gradient border border-gray-700 rounded-lg shadow-lg z-50 py-2">
                                        <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white"><UserIcon size={16}/> {t('profile')}</Link>
                                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                            <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-dimWhite hover:bg-gray-800 hover:text-white"><LayoutDashboard size={16}/> {t('dashboard')}</Link>
                                        )}
                                        <div className="h-px bg-gray-700 my-1"></div>
                                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 hover:text-red-300"><LogOut size={16}/> {t('logout')}</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-dimWhite hover:text-white transition-colors text-sm font-semibold">{t('login')}</Link>
                            <Link to="/signup" className="py-2 px-4 font-semibold text-sm text-primary bg-blue-gradient rounded-[10px] outline-none">{t('signup')}</Link>
                        </>
                    )}
                </div>
                
                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    <button onClick={() => setIsSearchOpen(true)} className="p-2 text-dimWhite hover:text-white"><Search size={24} /></button>
                    {!isAuthenticated && (
                        <Link to="/login" className="text-white">
                            <UserIcon size={24} />
                        </Link>
                    )}
                    <button onClick={() => setIsMenuOpen(true)}>
                        <Menu size={28} className="text-white"/>
                    </button>
                </div>
                {renderMobileMenu()}
            </header>
            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Header;