import React, { useState } from 'react';
import { Heart, Lock, User, Mail, Phone, Send, AlertCircle, CheckCircle, Wand2, Eye, EyeOff, Globe, Shield } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { secureGeminiService } from '../services/secureGeminiService';
import { api } from '../lib/api';
import Spinner from './Spinner';

interface PrayerRequestFormProps {
  onSubmit?: (request: any) => void;
  className?: string;
}

const PrayerRequestForm: React.FC<PrayerRequestFormProps> = ({ onSubmit, className = '' }) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [request, setRequest] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Enhanced form data for new prayer request system
  const [formData, setFormData] = useState({
    text: '',
    category: 'other' as 'thanksgiving' | 'healing' | 'guidance' | 'family' | 'other',
    isAnonymous: false,
    authorName: user?.profileData?.name || '',
    authorEmail: user?.email || '',
    authorPhone: '',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    isPublic: false
  });

  const [showContactFields, setShowContactFields] = useState(!user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.text.trim()) {
      setStatus({ message: t('prayerRequestTextRequired') || 'Prayer request text is required', type: 'error' });
      return false;
    }
    
    if (!formData.isAnonymous && !formData.authorName.trim()) {
      setStatus({ message: t('nameRequired') || 'Name is required', type: 'error' });
      return false;
    }
    
    if (!formData.isAnonymous && formData.authorEmail && !/\S+@\S+\.\S+/.test(formData.authorEmail)) {
      setStatus({ message: t('invalidEmail') || 'Please enter a valid email address', type: 'error' });
      return false;
    }
    
    return true;
  };

  const handleSubmitPrayerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const response = await api.post('/api/prayer-requests', formData);
      setStatus({ message: t('prayerRequestSuccess') || 'Prayer request submitted successfully!', type: 'success' });
      
      // Reset form after successful submission
      setFormData({
        text: '',
        category: 'other',
        isAnonymous: false,
        authorName: user?.profileData?.name || '',
        authorEmail: user?.email || '',
        authorPhone: '',
        urgency: 'normal',
        isPublic: false
      });
      setRequest('');
      setGeneratedPrayer('');
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(response);
      }
    } catch (error: any) {
      setStatus({ message: error.message || t('prayerRequestError') || 'Error submitting prayer request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePrayer = async () => {
    const prayerText = formData.text || request;
    if (!prayerText.trim()) return;
    setIsLoading(true);
    setStatus(null);
    setGeneratedPrayer('');
    try {
      const response = await secureGeminiService.generatePrayer(prayerText);
      setGeneratedPrayer(response.text);
    } catch (err) {
      setStatus({ message: t('prayerRequestError') || 'Error generating prayer', type: 'error' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitPrayerRequest} className={`space-y-6 my-8 ${className}`}>
      {/* Main Prayer Request Form */}
      <div className="bg-black-gradient p-8 rounded-[20px] box-shadow">
        {/* Privacy and Identification Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{t('identificationSettings') || 'Privacy Settings'}</h3>
          </div>
          
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between bg-primary p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <label className="text-white font-medium">{t('submitAnonymously') || 'Submit Anonymously'}</label>
                <p className="text-gray-400 text-sm">{t('anonymousDescription') || 'Your name will not be displayed'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('isAnonymous', !formData.isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isAnonymous ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between bg-primary p-4 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.isPublic ? <Globe className="w-5 h-5 text-green-400" /> : <Shield className="w-5 h-5 text-blue-400" />}
              <div>
                <label className="text-white font-medium">
                  {formData.isPublic ? (t('publicRequest') || 'Public Request') : (t('confidentialRequest') || 'Confidential Request')}
                </label>
                <p className="text-gray-400 text-sm">
                  {formData.isPublic ? (t('publicDescription') || 'Will appear on public prayer wall') : (t('confidentialDescription') || 'Only seen by prayer team')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('isPublic', !formData.isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isPublic ? 'bg-green-600' : 'bg-blue-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* Category Selection */}
        <div className="mb-6">
          <label className="block font-semibold text-lg text-white mb-3">
            {t('prayerCategory') || 'Prayer Category'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'thanksgiving', icon: '🙏', label: t('thanksgiving') || 'Thanksgiving' },
              { value: 'healing', icon: '💚', label: t('healing') || 'Healing' },
              { value: 'guidance', icon: '🧭', label: t('guidance') || 'Guidance' },
              { value: 'family', icon: '👨‍👩‍👧‍👦', label: t('family') || 'Family' },
              { value: 'other', icon: '✨', label: t('other') || 'Other' }
            ].map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleInputChange('category', category.value)}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.category === category.value
                    ? 'border-secondary bg-secondary/20 text-white'
                    : 'border-gray-600 bg-primary hover:border-gray-500 text-gray-300'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Urgency Level */}
        <div className="mb-6">
          <label className="block font-semibold text-lg text-white mb-3">
            {t('urgencyLevel') || 'Urgency Level'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'low', color: 'green', label: t('lowUrgency') || 'Low' },
              { value: 'normal', color: 'blue', label: t('normalUrgency') || 'Normal' },
              { value: 'high', color: 'yellow', label: t('highUrgency') || 'High' },
              { value: 'urgent', color: 'red', label: t('urgentUrgency') || 'Urgent' }
            ].map((urgency) => (
              <button
                key={urgency.value}
                type="button"
                onClick={() => handleInputChange('urgency', urgency.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.urgency === urgency.value
                    ? `border-${urgency.color}-500 bg-${urgency.color}-500/20 text-white`
                    : 'border-gray-600 bg-primary hover:border-gray-500 text-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{urgency.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Contact Information */}
        {!formData.isAnonymous && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-lg text-white">
                {t('contactInformation') || 'Contact Information'}
              </label>
              {user && (
                <button
                  type="button"
                  onClick={() => setShowContactFields(!showContactFields)}
                  className="text-secondary hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  {showContactFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showContactFields ? (t('hideFields') || 'Hide') : (t('showFields') || 'Show')}
                </button>
              )}
            </div>
            
            {(showContactFields || !user) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('fullName') || 'Full Name'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => handleInputChange('authorName', e.target.value)}
                      placeholder={t('enterFullName') || 'Enter your full name'}
                      className="w-full pl-12 pr-4 py-3 bg-primary border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                      required={!formData.isAnonymous}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('emailAddress') || 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.authorEmail}
                      onChange={(e) => handleInputChange('authorEmail', e.target.value)}
                      placeholder={t('enterEmail') || 'Enter your email'}
                      className="w-full pl-12 pr-4 py-3 bg-primary border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-2">
                    {t('phoneNumber') || 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.authorPhone}
                      onChange={(e) => handleInputChange('authorPhone', e.target.value)}
                      placeholder={t('enterPhone') || 'Enter your phone number'}
                      className="w-full pl-12 pr-4 py-3 bg-primary border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Prayer Request Text */}
        <div className="mb-6">
          <label htmlFor="prayer-text" className="block font-semibold text-xl text-white mb-3">
            {t('yourRequest') || 'Your Prayer Request'} <span className="text-red-400">*</span>
          </label>
          <textarea
            id="prayer-text"
            rows={6}
            value={formData.text || request}
            onChange={(e) => {
              handleInputChange('text', e.target.value);
              setRequest(e.target.value);
            }}
            placeholder={t('prayerRequestPlaceholder') || 'Please share your prayer request here...'}
            className="w-full p-4 border border-gray-600 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
            required
          ></textarea>
        </div>

        {status && (
          <div className={`mb-4 p-3 text-center rounded-lg border ${
              status.type === 'success' 
              ? 'text-green-300 bg-green-900/50 border-green-500/50' 
              : 'text-red-300 bg-red-900/50 border-red-500/50'
            }`}>
            {status.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.text.trim()}
            className="w-full sm:w-auto flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Spinner size="5" />
                {t('submitting') || 'Submitting...'}
              </>
            ) : (
              <>
                <Send size={18} />
                {t('submitRequest') || 'Submit Request'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleGeneratePrayer}
            disabled={isLoading || !(formData.text || request).trim()}
            className="w-full sm:w-auto flex-1 py-3 px-6 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner size="5" />
                {t('generating') || 'Generating...'}
              </>
            ) : (
             <>
               <Wand2 size={18} />
               {t('generatePrayer') || 'Generate Prayer'}
             </>
            )}
          </button>
        </div>
      </div>
      
      {generatedPrayer && (
        <div className="bg-gray-gradient p-8 rounded-[20px]">
          <h2 className="font-semibold text-2xl text-white mb-4">{t('generatedPrayer') || 'Generated Prayer'}</h2>
          <p className="text-dimWhite whitespace-pre-wrap leading-relaxed">{generatedPrayer}</p>
        </div>
      )}
    </form>
  );
};

export default PrayerRequestForm;