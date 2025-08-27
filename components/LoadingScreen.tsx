
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
    onFinished: () => void;
}

const LoadingScreen: React.FC<Props> = ({ onFinished }) => {
    const { t } = useLanguage();

    return (
        <div className="loading-container">
            <div className="loading-box w-auto relative flex justify-center flex-col p-4">
                <div className="title w-full relative flex items-center h-[50px]">
                    <span className="block"></span>
                    <h1>{t('loadingTitle')}</h1>
                </div>

                <div className="role w-full relative flex items-center h-[30px] mt-[-10px]">
                    <span className="block"></span>
                    <p>{t('loadingSubtitle')}</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
