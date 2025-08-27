import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from '../components/Spinner';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import StandaloneHeader from '../components/StandaloneHeader';

const SIGNUP_BG = 'https://images.unsplash.com/photo-1508361001413-7a9dca2c302d?q=80&w=2070&auto=format&fit=crop';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { signup, loading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    const farsiRegex = /[\u0600-\u06FF]/g;
    const sanitizedValue = value.replace(farsiRegex, '');

    if (value.length !== sanitizedValue.length) {
        setPasswordError(t('passwordFarsiNotAllowed'));
    } else if (password !== confirmPassword && e.target.id === 'confirm-password') {
        // Clear main error if it was a mismatch error
        if (error === t('errorPasswordMismatch')) setError('');
    } else {
        setPasswordError('');
    }
    fieldSetter(sanitizedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    if (password !== confirmPassword) {
        setError(t('errorPasswordMismatch'));
        return;
    }

    if (!agreed) {
        setError('You must agree to the Terms and Conditions.');
        return;
    }
    try {
      await signup(name, email, password);
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    }
  };

  const inputStyles = "w-full px-3 py-2 text-white bg-transparent border-b-2 border-white/50 focus:border-white transition-colors duration-300 ease-in-out outline-none placeholder:text-gray-400";

  return (
    <main className="relative min-h-screen">
      <StandaloneHeader />
      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${SIGNUP_BG})`}}>
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <section className="relative flex items-center justify-center min-h-screen p-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap-reverse md:flex-wrap-nowrap items-center -mx-3">
            <div className="w-full md:w-1/2 xl:w-6/12 p-3 text-center md:text-left">
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">{t('signupGreeting')}</h1>
              <p className="text-white text-lg mt-3">{t('signupSubGreeting')}</p>
            </div>
            <div className="w-full md:w-1/2 xl:w-5/12 ml-auto p-3">
              <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-8 border border-white/20 text-white">
                {signupSuccess ? (
                   <div className="text-center">
                        <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                        <h1 className="text-2xl font-bold">{t('verifySuccess')}</h1>
                        <p className="text-dimWhite mt-2">{t('signupVerificationMessage')}</p>
                        <Link to="/login" className="mt-6 inline-block font-medium text-secondary hover:text-white">
                            {t('goToLogin')}
                        </Link>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h1 className="text-3xl font-bold">{t('signupTitle')}</h1>
                      <p className="text-dimWhite mt-1">{t('signupInstruction')}</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-dimWhite mb-1">{t('name')}</label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className={inputStyles}
                          dir={lang === 'fa' ? 'rtl' : 'ltr'}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dimWhite mb-1">{t('emailAddress')}</label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={inputStyles}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-dimWhite mb-1">{t('password')}</label>
                        <div className="relative">
                          <input
                            id="password"
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => handlePasswordChange(e, setPassword)}
                            required
                            className={`${inputStyles} pr-10`}
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                         {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
                      </div>
                      
                       <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-dimWhite mb-1">{t('confirmPassword')}</label>
                        <div className="relative">
                          <input
                            id="confirm-password"
                            type={isConfirmPasswordVisible ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => handlePasswordChange(e, setConfirmPassword)}
                            required
                            className={`${inputStyles} pr-10`}
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                          >
                            {isConfirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                        />
                        <label htmlFor="terms" className="ml-2 rtl:mr-2 rtl:ml-0 block text-sm text-dimWhite">
                            {t('agreeTerms')}
                        </label>
                      </div>

                      {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md">
                            <p className="break-words">{error}</p>
                        </div>
                      )}
                      
                      <div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center py-3 px-4 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none disabled:opacity-50"
                        >
                          {loading ? <Spinner size="5" /> : t('signup')}
                        </button>
                      </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-dimWhite">
                      {t('signupPrompt')}{' '}
                      <Link to="/login" className="font-medium text-secondary hover:text-white">
                        {t('signInLink')}
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;