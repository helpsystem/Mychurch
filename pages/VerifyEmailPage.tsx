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
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
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
            setError('No verification token found.');
            setStatus('error');
        }
    }, [searchParams, verifyEmail, navigate, t]);

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
                        <Link to="/login" className="mt-6 inline-block py-2 px-6 font-medium text-primary bg-blue-gradient rounded-[10px] outline-none">
                            {t('goToLogin')}
                        </Link>
                    </>
                );
        }
    }

    return (
        <main className="relative min-h-screen">
            <StandaloneHeader />
            <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${VERIFY_BG})`}}>
                <div className="absolute inset-0 bg-black/60" />
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