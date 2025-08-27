
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getProfilePictureUrl } from '../lib/utils';
import { Bell, BellOff, XCircle, Edit, Save, Mail, Link as LinkIcon, MessageSquare, Send } from 'lucide-react';
import Spinner from '../components/Spinner';
import { User, ProfileData, AdminMessage } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import TourPromptModal from '../components/TourPromptModal';
import { useTour } from '../hooks/useTour';
import { TourStep } from '../context/TourContext';
import InboxMessage from '../components/InboxMessage';
import MessageViewerModal from '../components/MessageViewerModal';
import EmailClient from '../components/EmailClient';
import { useContent } from '../hooks/useContent';

// VAPID public key for push notifications
const VAPID_PUBLIC_KEY = 'BDoU4aWqeoE_g0cEpcUNgV-i6xSAnayT6ikg2uS39L3o_j7sYJqHGFZJ0bW8dFj2e_P_gE-A3k_a-j-g_cZ-aXk';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationSettings: React.FC = () => {
    const { t } = useLanguage();
    const { user, updateUserPushSubscription } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIos(isIOSDevice);
        if (typeof window.matchMedia === 'function') {
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        }

        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            setIsSubscribed(!!user?.pushSubscription);
        } else {
            setIsSupported(false);
        }
        setIsLoading(false);
    }, [user]);

    const handleSubscribe = async () => {
        setIsLoading(true);
        if (permission === 'default') {
            const newPermission = await Notification.requestPermission();
            setPermission(newPermission);
            if (newPermission !== 'granted') {
                setIsLoading(false);
                return;
            }
        }

        try {
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            await updateUserPushSubscription(subscription.toJSON());
            setIsSubscribed(true);
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderButton = () => {
        if (isLoading) {
            return <div className="flex justify-center"><Spinner /></div>;
        }
        
        if (!isSupported) {
            return (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <XCircle size={20} />
                    <span>{t('notificationsNotSupported')}</span>
                </div>
            );
        }

        if (isIos && isSupported && !isStandalone) {
             return (
                <div className="text-center text-sm text-dimWhite p-3 bg-primary rounded-lg border border-gray-700">
                    <p>{t('iosAddToHomeScreen')}</p>
                </div>
            );
        }

        if (permission === 'denied') {
            return (
                <button disabled className="w-full py-3 px-4 font-medium text-white bg-red-800 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                    <XCircle size={20} />
                    {t('permissionDenied')}
                </button>
            );
        }
        
        if (isSubscribed) {
             return (
                <button disabled className="w-full py-3 px-4 font-medium text-white bg-green-700 rounded-lg flex items-center justify-center gap-2">
                    <Bell size={20} />
                    {t('notificationsEnabled')}
                </button>
            );
        }

        return (
            <button onClick={handleSubscribe} className="w-full py-3 px-4 font-medium text-primary bg-blue-gradient rounded-[10px] outline-none flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <BellOff size={20} />
                {t('enableNotifications')}
            </button>
        );
    }

    return (
        <div className="bg-primary p-4 rounded-lg border border-gray-700 mt-4">
            <h2 className="text-lg font-semibold text-white mb-3">{t('notificationSettings')}</h2>
            {renderButton()}
        </div>
    );
};


const ProfilePage: React.FC = () => {
  const { user, updateProfileData, uploadProfilePicture } = useAuth();
  const { content } = useContent();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { startTour } = useTour();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      name: user?.profileData.name || '',
      gender: user?.profileData.gender || 'neutral',
      whatsappNumber: user?.profileData.whatsappNumber || '',
      signature: user?.profileData.signature || { en: '', fa: '' },
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    const fromSignup = location.state?.fromSignup;
    const hasSeenTour = localStorage.getItem('hasSeenUserTour');
    if (fromSignup && !hasSeenTour) {
      setShowTourPrompt(true);
    }
  }, [location.state]);


  if (!user) {
    return null; 
  }

  const handleStartTour = () => {
      const userTourSteps: TourStep[] = [
        {
            title: t('tourWelcomeTitle'),
            content: t('userTourNavContent'),
            position: 'center'
        },
        {
            selector: '.navbar nav',
            title: t('userTourNavTitle'),
            content: t('userTourNavContent'),
            position: 'bottom'
        },
        {
            selector: 'a[href="#/ai-helper"]',
            title: t('userTourAITitle'),
            content: t('userTourAIContent'),
            position: 'bottom',
            action: () => navigate('/ai-helper')
        },
        {
            selector: 'a[href="#/bible"]',
            title: t('userTourBibleTitle'),
            content: t('userTourBibleContent'),
            position: 'bottom',
            action: () => navigate('/bible')
        },
        {
            selector: '#user-profile-button',
            title: t('userTourProfileTitle'),
            content: t('userTourProfileContent'),
            position: 'bottom',
            action: () => navigate('/profile')
        }
    ];
    startTour(userTourSteps);
    setShowTourPrompt(false);
    localStorage.setItem('hasSeenUserTour', 'true');
  };

  const handleDeclineTour = () => {
    setShowTourPrompt(false);
    localStorage.setItem('hasSeenUserTour', 'true');
  };

  const handleEditToggle = () => {
    if (isEditing) {
        // Reset form if canceling
        setFormData({ name: user.profileData.name, gender: user.profileData.gender || 'neutral', whatsappNumber: user.profileData.whatsappNumber || '', signature: user.profileData.signature || { en: '', fa: '' } });
        setImageFile(null);
        setImagePreview(null);
    }
    setIsEditing(!isEditing);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Validation
          if (file.size > 5 * 1024 * 1024) {
              alert("File size cannot exceed 5MB.");
              return;
          }
          if (!['image/jpeg', 'image/png'].includes(file.type)) {
              alert("Invalid file type. Please upload a JPG or PNG image.");
              return;
          }
          
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = async () => {
      setIsSaving(true);
      try {
          let finalImageUrl = getProfilePictureUrl(user); // Start with current or default URL

          // Step 1: If a new image file is selected, upload it first.
          if (imageFile) {
              const uploadResponse = await uploadProfilePicture(imageFile);
              finalImageUrl = uploadResponse.imageUrl;
          }

          // Step 2: Prepare the rest of the profile data.
          const dataToUpdate: Partial<ProfileData> = {
              name: formData.name,
              gender: formData.gender,
              whatsappNumber: formData.whatsappNumber,
              imageUrl: finalImageUrl,
              signature: formData.signature,
          };
          
          // Step 3: Update the user's profile with all data.
          await updateProfileData(dataToUpdate);

          setIsEditing(false);
          setImageFile(null);
          setImagePreview(null);

      } catch (error) {
          console.error("Failed to update profile", error);
          // TODO: Show an error message to the user.
      } finally {
          setIsSaving(false);
      }
  };

  const profileImageUrl = imagePreview || getProfilePictureUrl(user);
  const messages = user.messages || [];
  const isLeader = user.role === 'MANAGER' || user.role === 'SUPER_ADMIN';

  return (
    <>
      {showTourPrompt && (
        <TourPromptModal 
            title={t('tourWelcomeTitle')}
            content={t('tourWelcomeContent')}
            onConfirm={handleStartTour}
            onDecline={handleDeclineTour}
        />
      )}
      {viewingMessage && (
          <MessageViewerModal
            message={viewingMessage}
            onClose={() => setViewingMessage(null)}
          />
      )}
      <div className="max-w-4xl mx-auto py-12 sm:px-16 px-6 space-y-8">
        <div className="bg-black-gradient p-8 rounded-[20px] shadow-lg text-center border border-gray-800">
          <div className="w-32 h-32 mx-auto image-container rounded-full relative group">
              <img src={profileImageUrl} alt="" className="image-background" aria-hidden="true" />
              <img src={profileImageUrl} alt={user.profileData.name} className="image-foreground rounded-full" />
              {isEditing && (
                  <>
                      <label htmlFor="profile-pic-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white cursor-pointer rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit size={32}/>
                      </label>
                      <input id="profile-pic-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  </>
              )}
          </div>

          {isEditing ? (
              <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="mt-4 text-3xl font-bold text-white bg-transparent border-b-2 border-gray-600 focus:border-secondary focus:outline-none text-center"
              />
          ) : (
              <h1 className="mt-4 text-3xl font-bold text-white">{user.profileData.name || user.email}</h1>
          )}
          
          <div className="mt-6 text-start space-y-4">
              <div className="bg-primary p-4 rounded-lg border border-gray-700">
                  <p className="text-sm font-medium text-dimWhite">{t('emailAddress')}</p>
                  <p className="text-lg text-white">{user.email}</p>
              </div>
              
              {isEditing ? (
                  <>
                   <div className="bg-primary p-4 rounded-lg border border-gray-700">
                      <p className="text-sm font-medium text-dimWhite mb-2">{t('gender')}</p>
                      <div className="flex justify-around">
                          {(['male', 'female', 'neutral'] as const).map(g => (
                               <label key={g} className="flex items-center gap-2 cursor-pointer text-white">
                                  <input
                                      type="radio"
                                      name="gender"
                                      value={g}
                                      checked={formData.gender === g}
                                      onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value as 'male' | 'female' | 'neutral' }))}
                                      className="form-radio text-secondary bg-gray-700 border-gray-600 focus:ring-secondary"
                                  />
                                  {t(g)}
                              </label>
                          ))}
                      </div>
                   </div>
                    <div className="bg-primary p-4 rounded-lg border border-gray-700">
                        <label className="text-sm font-medium text-dimWhite mb-1">{t('whatsAppNumber')}</label>
                        <input
                            type="tel"
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData(p => ({ ...p, whatsappNumber: e.target.value }))}
                            placeholder={t('whatsAppNumberHelp')}
                            className="w-full bg-transparent text-lg text-white focus:outline-none"
                        />
                    </div>
                    {isLeader && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                            <div>
                                <label className="block text-sm text-dimWhite mb-1">Signature (EN)</label>
                                <textarea
                                    rows={3}
                                    value={formData.signature?.en || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, signature: { ...p.signature!, en: e.target.value } }))}
                                    className="w-full p-2 bg-primary border border-gray-600 rounded-md focus:border-secondary focus:outline-none text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-dimWhite mb-1">Signature (FA)</label>
                                <textarea
                                    rows={3}
                                    value={formData.signature?.fa || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, signature: { ...p.signature!, fa: e.target.value } }))}
                                    className="w-full p-2 bg-primary border border-gray-600 rounded-md focus:border-secondary focus:outline-none text-white"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    )}
                  </>
              ) : (
                  <div className="bg-primary p-4 rounded-lg border border-gray-700">
                      <p className="text-sm font-medium text-dimWhite">{t('userRole')}</p>
                      <p className="text-lg text-white font-semibold">{t(`role${user.role.replace('_', '')}`)}</p>
                  </div>
              )}
              
              <div className="pt-4 flex justify-between items-center gap-4">
                  <button onClick={handleEditToggle} className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
                      {isEditing ? t('cancel') : <><Edit size={16}/> {t('editProfile')}</>}
                  </button>
                   {isEditing && (
                      <button onClick={handleSave} disabled={isSaving} className="py-2 px-6 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 disabled:opacity-50">
                         {isSaving ? <Spinner size="4" /> : <><Save size={16}/> {t('saveChanges')}</>}
                      </button>
                  )}
              </div>
              <NotificationSettings />
          </div>
        </div>

        <div className="bg-black-gradient p-6 rounded-[20px] shadow-lg border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><LinkIcon /> {t('communityLinks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href={content.settings.newsletterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-primary rounded-lg border border-gray-700 hover:border-secondary transition-colors"><Mail size={18}/> {t('joinNewsletter')}</a>
                <a href={content.settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-primary rounded-lg border border-gray-700 hover:border-secondary transition-colors"><Send size={18}/> {t('joinTelegram')}</a>
                <a href={content.settings.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-primary rounded-lg border border-gray-700 hover:border-secondary transition-colors"><MessageSquare size={18}/> {t('joinWhatsApp')}</a>
            </div>
        </div>
        
        <div className="bg-black-gradient p-6 rounded-[20px] shadow-lg border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><Mail /> {t('inbox')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {messages.length > 0 ? (
                    messages.map(msg => (
                        <InboxMessage key={msg.id} message={msg} onClick={() => setViewingMessage(msg)} />
                    ))
                ) : (
                    <p className="text-dimWhite text-center col-span-full py-8">{t('noNewMessages')}</p>
                )}
            </div>
        </div>

        {isLeader && (
            <div className="bg-black-gradient p-6 rounded-[20px] shadow-lg border border-gray-800">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><Mail /> {t('emailInbox')}</h2>
                <EmailClient user={user} />
            </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;
