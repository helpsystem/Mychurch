import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from '../components/Spinner';
import { CheckCircle, AlertCircle } from 'lucide-react';
import StandaloneHeader from '../components/StandaloneHeader';

const VERIFY_BG = 'https://images.unsplash.com/photo-1512403759738-c13b39744520?q=80&w=2070&auto=format&fit=crop';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { verifyEmail } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'input'>('verifying');
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const emailFromParam = searchParams.get('email');
        if (emailFromParam) setEmail(emailFromParam);
        
        if (token) {
            const doVerification = async () => {
                try {
                    await verifyEmail(token);
                    setStatus('success');
                    setTimeout(() => navigate('/profile', { state: { fromSignup: true }, replace: true }), 3000);
                } catch (e: any) {
                    setError(e.message || t('verifyErrorSubtext'));
                    setStatus('error');
                }
            };
            doVerification();
        } else {
            // No token, show OTP input status
            setStatus('input' as any);
        }
    }, [searchParams, verifyEmail, navigate, t]);

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStatus('verifying');
        try {
            // We need verifyOtp from context, but context type might not have it or useAuth might not expose it
            // Based on AuthContext.tsx, it IS available as verifyOtp
            const { verifyOtp } = (useAuth() as any); 
            if (!verifyOtp) throw new Error("Verification method not found");
            
            await verifyOtp(email, otp);
            setStatus('success');
            setTimeout(() => navigate('/profile', { state: { fromSignup: true }, replace: true }), 3000);
        } catch (e: any) {
            setError(e.message || t('verifyErrorSubtext'));
            setStatus('error');
        }
    };

    const inputStyles = "w-full px-3 py-2 text-white bg-transparent border-b-2 border-white/50 focus:border-white transition-colors duration-300 ease-in-out outline-none placeholder:text-gray-400";

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <>
                        <Spinner size="12" />
                        <h1 className="text-3xl font-bold mt-4">{t('verifyTitle')}</h1>
                        <p className="text-dimWhite mt-2">{t('verifyInstructions')}</p>
                    </>
                );
            case 'input' as any:
                return (
                    <div className="w-full text-center">
                         <h1 className="text-3xl font-bold mb-4">{t('verifyEmailTitle') || 'Verify Your Account'}</h1>
                         <p className="text-dimWhite mb-6">
                            {t('verifyEmailDescription') || 'Please enter the verification code sent to your email.'}
                         </p>
                         
                         <form onSubmit={handleOtpSubmit} className="space-y-6">
                            <div>
                               <label htmlFor="email" className="block text-sm font-medium text-dimWhite mb-1 text-left rtl:text-right">
                                   {t('emailAddress') || 'Email Address'}
                               </label>
                               <input
                                 id="email"
                                 type="email"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                                 placeholder="your@email.com"
                                 className={inputStyles}
                                 dir="ltr"
                               />
                            </div>
                            <div>
                               <label htmlFor="otp" className="block text-sm font-medium text-dimWhite mb-1 text-left rtl:text-right">
                                   {t('verificationCode') || 'Verification Code'}
                               </label>
                               <input
                                 id="otp"
                                 type="text"
                                 value={otp}
                                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                 required
                                 placeholder="12345678"
                                 className={`${inputStyles} text-center tracking-widest text-2xl font-mono`}
                                 dir="ltr"
                               />
                            </div>

                            {error && (
                               <div className="text-sm text-center p-3 rounded-md flex items-center gap-2 text-red-400 bg-red-900/20">
                                   <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                   <p className="break-words">{error}</p>
                               </div>
                            )}

                            <button
                              type="submit"
                              disabled={otp.length < 6 || !email}
                              className="w-full flex justify-center py-3 px-4 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none disabled:opacity-50 transition-opacity"
                            >
                              {t('verifyButton') || 'Verify Account'}
                            </button>
                         </form>
                    </div>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle size={64} className="text-green-400" />
                        <h1 className="text-3xl font-bold mt-4">{t('verifySuccess')}</h1>
                        <p className="text-dimWhite mt-2">{t('verifySuccessSubtext')}</p>
                    </>
                );
            case 'error':
                 return (
                    <>
                        <AlertCircle size={64} className="text-red-400" />
                        <h1 className="text-3xl font-bold mt-4">{t('verifyError')}</h1>
                        <p className="text-dimWhite mt-2">{error}</p>
                        <button 
                            onClick={() => setStatus('input' as any)}
                            className="mt-6 inline-block py-2 px-6 font-medium text-secondary hover:text-white transition-colors"
                        >
                            {t('tryAgain') || 'Try manual entry'}
                        </button>
                        <Link to="/login" className="mt-4 block text-sm text-dimWhite hover:text-white">
                            {t('goToLogin')}
                        </Link>
                    </>
                );
        }
    }

    return (
        <main className="relative min-h-screen">
            <StandaloneHeader />
            <div className="absolute inset-0">
                <img src={VERIFY_BG} alt="" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40" aria-hidden="true" />
                <img src={VERIFY_BG} alt="Email verification background" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50" />
            </div>
            <section className="relative flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-2xl p-8 sm:p-12 border border-white/20 text-white text-center flex flex-col items-center">
                        {renderContent()}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default VerifyEmailPage;