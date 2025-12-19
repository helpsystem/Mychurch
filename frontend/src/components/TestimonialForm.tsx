import React, { useState } from 'react';
import { Star, Heart, Lock, User, Mail, Phone, Send, AlertCircle, CheckCircle, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import MathCaptcha from './MathCaptcha';
import HoneypotField from './HoneypotField';

interface TestimonialFormProps {
  onSubmit?: (testimonial: any) => void;
  className?: string;
}

const TestimonialForm: React.FC<TestimonialFormProps> = ({ onSubmit, className = '' }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Anti-spam state
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [honeypotValue, setHoneypotValue] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const [formData, setFormData] = useState({
    type: 'testimony' as 'testimony' | 'blessing' | 'confession',
    isAnonymous: false,
    testimonialText: '',
    name: user?.profileData?.name || '',
    email: user?.email || '',
    phone: '',
    category: 'general', // 'general', 'healing', 'salvation', 'provision', 'guidance', 'family', 'breakthrough'
    isPublic: true, // Default to public for testimonials
    allowSharing: true,
    dateOfEvent: '', // When the testimony happened
    location: '', // Where it happened (optional)
    verificationConsent: false, // Allow church to contact for verification
    includeInNewsletter: false,
    rating: 5 // How much this impacted their life (1-5 stars)
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCaptchaVerify = (isValid: boolean, token: string) => {
    setCaptchaVerified(isValid);
    setCaptchaToken(token);
    if (isValid) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.testimonialText.trim()) {
        throw new Error(lang === 'fa' ? 'لطفاً متن شهادت را وارد کنید' : 'Please enter your testimony');
      }
      
      if (!captchaVerified) {
        throw new Error(lang === 'fa' ? 'لطفاً تایید امنیتی را تکمیل کنید' : 'Please complete the security verification');
      }
      
      if (formData.testimonialText.trim().length < 20) {
        throw new Error(lang === 'fa' ? 'شهادت حداقل باید ۲۰ حرف باشد' : 'Testimonial must be at least 20 characters long');
      }

      if (!formData.isAnonymous && !formData.name.trim()) {
        throw new Error(lang === 'fa' ? 'لطفاً نام خود را وارد کنید' : 'Please enter your name');
      }

      if (!formData.isAnonymous && !formData.email.trim()) {
        throw new Error(lang === 'fa' ? 'لطفاً ایمیل خود را وارد کنید' : 'Please enter your email');
      }

      const testimonialData = {
        type: formData.type,
        isAnonymous: formData.isAnonymous,
        testimonialText: formData.testimonialText,
        name: formData.isAnonymous ? null : formData.name,
        email: formData.isAnonymous ? null : formData.email,
        phone: formData.isAnonymous ? null : formData.phone,
        category: formData.category,
        isPublic: formData.isPublic,
        allowSharing: formData.allowSharing,
        dateOfEvent: formData.dateOfEvent || null,
        location: formData.location || null,
        verificationConsent: formData.verificationConsent,
        includeInNewsletter: formData.includeInNewsletter,
        rating: formData.rating,
        userId: user?.email || null,
        captchaToken,
        website: honeypotValue // Honeypot field
      };

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify(testimonialData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.rateLimited) {
          setRateLimited(true);
          throw new Error(`Rate limit exceeded. Please wait ${errorData.retryAfter} minutes.`);
        } else if (errorData.field === 'security') {
          throw new Error(lang === 'fa' ? 'فعالیت مشکوک شناسایی شد' : 'Suspicious activity detected');
        } else if (errorData.field === 'captcha') {
          setCaptchaVerified(false);
          setCaptchaToken('');
          throw new Error(lang === 'fa' ? 'تایید امنیتی ناموفق بود' : 'Security verification failed');
        } else {
          throw new Error(errorData.message || 'Failed to submit testimonial');
        }
      }

      setSubmitted(true);
      
      // Reset form
      setFormData({
        type: 'testimony',
        isAnonymous: false,
        testimonialText: '',
        name: user?.profileData?.name || '',
        email: user?.email || '',
        phone: '',
        category: 'general',
        isPublic: true,
        allowSharing: true,
        dateOfEvent: '',
        location: '',
        verificationConsent: false,
        includeInNewsletter: false,
        rating: 5
      });
      setCaptchaVerified(false);
      setCaptchaToken('');
      setHoneypotValue('');
      setRateLimited(false);

      if (onSubmit) {
        onSubmit(testimonialData);
      }

      // Auto-hide success after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);

    } catch (error: any) {
      console.error('Error submitting testimonial:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testimonialTypes = [
    {
      value: 'testimony',
      label: lang === 'fa' ? 'شهادت' : 'Testimony',
      icon: '🙌',
      description: lang === 'fa' ? 'شهادت از کار خدا در زندگی' : 'Witness of God\'s work in your life'
    },
    {
      value: 'blessing',
      label: lang === 'fa' ? 'برکت' : 'Blessing',
      icon: '✨',
      description: lang === 'fa' ? 'برکت یا معجزه دریافت شده' : 'Blessing or miracle received'
    },
    {
      value: 'confession',
      label: lang === 'fa' ? 'اعتراف' : 'Confession',
      icon: '💖',
      description: lang === 'fa' ? 'اعتراف ایمان یا اقرار' : 'Confession of faith or acknowledgment'
    }
  ];

  const categories = [
    { value: 'general', label: lang === 'fa' ? 'عمومی' : 'General', icon: '🙏' },
    { value: 'healing', label: lang === 'fa' ? 'شفا' : 'Healing', icon: '💊' },
    { value: 'salvation', label: lang === 'fa' ? 'نجات' : 'Salvation', icon: '✝️' },
    { value: 'provision', label: lang === 'fa' ? 'تامین نیاز' : 'Provision', icon: '💰' },
    { value: 'guidance', label: lang === 'fa' ? 'راهنمایی' : 'Guidance', icon: '🧭' },
    { value: 'family', label: lang === 'fa' ? 'خانواده' : 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'breakthrough', label: lang === 'fa' ? 'پیروزی' : 'Breakthrough', icon: '🚀' }
  ];

  if (submitted) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {lang === 'fa' ? 'شهادت ارسال شد' : 'Testimonial Submitted'}
        </h3>
        <p className="text-gray-600 mb-6">
          {lang === 'fa' 
            ? 'شهادت شما با موفقیت ارسال شد. خدا بابت گواهی شما شکر کند!'
            : 'Your testimonial has been submitted successfully. Thank God for your witness!'
          }
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {lang === 'fa' ? 'شهادت جدید' : 'Submit Another Testimony'}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          {lang === 'fa' ? 'ثبت شهادت' : 'Share Your Testimony'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Testimonial Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {lang === 'fa' ? 'نوع شهادت' : 'Type of Testimony'}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {testimonialTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleInputChange('type', type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.type === type.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="anonymous" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Lock className="w-4 h-4" />
            {lang === 'fa' ? 'ناشناس ارسال شود' : 'Submit anonymously'}
          </label>
          <span className="text-xs text-gray-500">
            {lang === 'fa' ? 'نام شما نمایش داده نخواهد شد' : 'Your name will not be displayed'}
          </span>
        </div>

        {/* Personal Information */}
        {!formData.isAnonymous && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {lang === 'fa' ? 'نام *' : 'Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required={!formData.isAnonymous}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {lang === 'fa' ? 'ایمیل *' : 'Email *'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required={!formData.isAnonymous}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                {lang === 'fa' ? 'تلفن (اختیاری)' : 'Phone (Optional)'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'fa' ? 'تاریخ رویداد (اختیاری)' : 'Date of Event (Optional)'}
              </label>
              <input
                type="date"
                value={formData.dateOfEvent}
                onChange={(e) => handleInputChange('dateOfEvent', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {lang === 'fa' ? 'دسته‌بندی' : 'Category'}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleInputChange('category', category.value)}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  formData.category === category.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-sm">{category.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Impact Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {lang === 'fa' ? 'چقدر زندگی‌تان را تغییر داد؟' : 'How much did this impact your life?'}
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleInputChange('rating', star)}
                className={`p-2 transition-colors ${
                  formData.rating >= star ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating}/5 {lang === 'fa' ? 'ستاره' : 'stars'}
            </span>
          </div>
        </div>

        {/* Testimonial Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.type === 'testimony' 
              ? (lang === 'fa' ? 'شهادت شما *' : 'Your Testimony *')
              : formData.type === 'blessing'
              ? (lang === 'fa' ? 'شرح برکت *' : 'Describe Your Blessing *')
              : (lang === 'fa' ? 'اعتراف شما *' : 'Your Confession *')
            }
          </label>
          <textarea
            value={formData.testimonialText}
            onChange={(e) => handleInputChange('testimonialText', e.target.value)}
            rows={5}
            placeholder={
              formData.type === 'testimony'
                ? (lang === 'fa' ? 'خدا چگونه در زندگی شما کار کرده است؟' : 'How has God worked in your life?')
                : formData.type === 'blessing'
                ? (lang === 'fa' ? 'چه برکتی دریافت کردید؟' : 'What blessing did you receive?')
                : (lang === 'fa' ? 'اعتراف ایمان یا اقرار خود را بنویسید' : 'Write your confession of faith')
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            required
            minLength={20}
            maxLength={3000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.testimonialText.length}/3000 characters (minimum 20)
          </div>
        </div>
        
        {/* CAPTCHA Component */}
        <MathCaptcha
          onVerify={handleCaptchaVerify}
          className=""
          required={true}
        />
        
        {/* Honeypot Field (hidden) */}
        <HoneypotField
          value={honeypotValue}
          onChange={setHoneypotValue}
          name="website"
        />

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {lang === 'fa' ? 'مکان (اختیاری)' : 'Location (Optional)'}
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder={lang === 'fa' ? 'کجا اتفاق افتاد؟' : 'Where did this happen?'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Privacy and Sharing Options */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">
            {lang === 'fa' ? 'تنظیمات اشتراک‌گذاری' : 'Sharing Settings'}
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isPublic" className="flex items-center gap-2 text-sm text-gray-700">
                {formData.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {lang === 'fa' 
                  ? 'در صفحه عمومی شهادت‌ها نمایش داده شود'
                  : 'Display on public testimonials page'
                }
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowSharing"
                checked={formData.allowSharing}
                onChange={(e) => handleInputChange('allowSharing', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="allowSharing" className="text-sm text-gray-700">
                {lang === 'fa' 
                  ? 'اجازه اشتراک‌گذاری در شبکه‌های اجتماعی'
                  : 'Allow sharing on social media'
                }
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeInNewsletter"
                checked={formData.includeInNewsletter}
                onChange={(e) => handleInputChange('includeInNewsletter', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="includeInNewsletter" className="text-sm text-gray-700">
                {lang === 'fa' 
                  ? 'در خبرنامه کلیسا گنجانده شود'
                  : 'Include in church newsletter'
                }
              </label>
            </div>

            {!formData.isAnonymous && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verificationConsent"
                  checked={formData.verificationConsent}
                  onChange={(e) => handleInputChange('verificationConsent', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="verificationConsent" className="text-sm text-gray-700">
                  {lang === 'fa' 
                    ? 'کلیسا می‌تواند برای تایید با من تماس بگیرد'
                    : 'Church may contact me for verification'
                  }
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !captchaVerified || rateLimited}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {lang === 'fa' ? 'در حال ارسال...' : 'Submitting...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {formData.type === 'testimony'
                ? (lang === 'fa' ? 'ارسال شهادت' : 'Submit Testimony')
                : formData.type === 'blessing'
                ? (lang === 'fa' ? 'ارسال برکت' : 'Submit Blessing')
                : (lang === 'fa' ? 'ارسال اعتراف' : 'Submit Confession')
              }
            </>
          )}
        </button>
        
        {!captchaVerified && !loading && (
          <div className="text-center text-xs text-gray-500 mt-2">
            {lang === 'fa' ? 'این به ما کمک می‌کند تا از هرزنامه جلوگیری کنیم' : 'This helps us prevent spam and automated submissions'}
          </div>
        )}
      </form>
    </div>
  );
};

export default TestimonialForm;