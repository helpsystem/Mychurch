import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from '../components/Spinner';
import { Eye, EyeOff } from 'lucide-react';
import StandaloneHeader from '../components/StandaloneHeader';

const LOGIN_BG = 'https://images.unsplash.com/photo-1560439546-13de4a415347?q=80&w=1974&auto=format&fit=crop';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, loading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const farsiRegex = /[\u0600-\u06FF]/g;
    const sanitizedValue = value.replace(farsiRegex, '');

    if (value.length !== sanitizedValue.length) {
        setPasswordError(t('passwordFarsiNotAllowed'));
    } else {
        setPasswordError('');
    }
    setPassword(sanitizedValue);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    if (passwordError) return;

    try {
      const user = await login(email, password);
      if (user) {
        const targetPath = (user.role === 'MANAGER' || user.role === 'SUPER_ADMIN') ? '/admin' : '/profile';
        navigate(targetPath, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const inputStyles = "w-full px-3 py-2 text-white bg-transparent border-b-2 border-white/50 focus:border-white transition-colors duration-300 ease-in-out outline-none placeholder:text-gray-400";

  return (
    <main className="relative min-h-screen">
      <StandaloneHeader />
      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${LOGIN_BG})`}}>
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <section className="relative flex items-center justify-center min-h-screen p-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-center -mx-3">

            {/* Form Column (Left on Desktop) */}
            <div className="w-full md:w-1/2 xl:w-5/12 p-3">
              <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-8 border border-white/20 text-white">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold">{t('loginTitle')}</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        onChange={handlePasswordChange}
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
                  
                  <div className="flex items-center justify-between">
                     <div className="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                        />
                        <label htmlFor="remember-me" className="ml-2 rtl:mr-2 rtl:ml-0 block text-sm text-dimWhite">
                            {t('rememberMe')}
                        </label>
                    </div>
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
                      {loading ? <Spinner size="5" /> : t('login')}
                    </button>
                  </div>
                </form>

                <p className="mt-6 text-center text-sm text-dimWhite">
                  {t('loginPrompt')}{' '}
                  <Link to="/signup" className="font-medium text-secondary hover:text-white">
                    {t('signupLink')}
                  </Link>
                </p>
                <p className="mt-2 text-center text-xs text-gray-400">
                  <Link to="/admin/login" className="font-medium hover:text-white">
                    {t('adminLoginTitle')}
                  </Link>
                </p>
              </div>
            </div>

            {/* Text Column (Right on Desktop) */}
            <div className={`w-full md:w-1/2 xl:w-6/12 p-3 text-center ${lang === 'en' ? 'md:text-left' : 'md:text-right'}`}>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">{t('loginGreeting')}</h1>
              <p className="text-white text-lg mt-3">{t('loginSubGreeting')}</p>
            </div>
            
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;