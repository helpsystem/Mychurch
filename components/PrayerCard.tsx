import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { PrayerRequest } from '../types';
import { Heart, User } from 'lucide-react';
import { api } from '../lib/api';

interface PrayerCardProps {
  prayer: PrayerRequest;
  onPrayerUpdate?: (prayerId: number) => void;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, onPrayerUpdate }) => {
    const { t } = useLanguage();
    const storageKey = `prayed_for_${prayer.id}`;
    
    const [hasPrayed, setHasPrayed] = useState(false);
    const [prayerCount, setPrayerCount] = useState(prayer.prayerCount);
    const [animate, setAnimate] = useState(false);
    const [hearts, setHearts] = useState<{ id: number }[]>([]);

    useEffect(() => {
        const storedValue = localStorage.getItem(storageKey);
        if (storedValue) {
            setHasPrayed(true);
        }
    }, [storageKey]);

    const handlePrayClick = async () => {
        if (!hasPrayed) {
            setHasPrayed(true);
            const newCount = prayerCount + 1;
            setPrayerCount(newCount);
            localStorage.setItem(storageKey, 'true');
            setAnimate(true);
            
            const newHeart = { id: Date.now() };
            setHearts(prev => [...prev, newHeart]);
            setTimeout(() => {
                setHearts(prev => prev.filter(h => h.id !== newHeart.id));
            }, 2000);

            setTimeout(() => setAnimate(false), 500);
            
            // Call the API to update the prayer count
            try {
                await api.incrementPrayerCount(prayer.id);
                if (onPrayerUpdate) {
                    onPrayerUpdate(prayer.id);
                }
            } catch (error) {
                console.error('Failed to update prayer count:', error);
                // Revert optimistic update on error
                setHasPrayed(false);
                setPrayerCount(prev => prev - 1);
                localStorage.removeItem(storageKey);
            }
        }
    };

    const categoryText = t(`category${prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}`);
    const author = prayer.isAnonymous ? 'Anonymous' : prayer.authorName;

    return (
        <div className="bg-primary p-5 rounded-lg border border-gray-800 feature-card prayer-card mb-6 relative overflow-hidden">
             {hearts.map(heart => (
                <div key={heart.id} className="flying-heart">
                    <Heart fill="currentColor" className="text-red-500" />
                </div>
            ))}
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-dimBlue px-2 py-1 rounded-full">{categoryText}</span>
                <div className="text-xs text-gray-500">{new Date(prayer.createdAt).toLocaleDateString()}</div>
            </div>
            <p className="text-dimWhite mb-4">{prayer.text}</p>
            <div className="flex justify-between items-center mt-auto border-t border-gray-700 pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User size={14} />
                    <span>{author}</span>
                </div>
                <button
                    onClick={handlePrayClick}
                    disabled={hasPrayed}
                    className={`flex items-center gap-2 text-sm font-semibold rounded-full px-3 py-1 transition-colors z-10 ${
                        hasPrayed 
                        ? 'bg-red-500/20 text-red-400 cursor-default' 
                        : 'bg-red-900/50 text-red-400 hover:bg-red-800/70 hover:text-white'
                    }`}
                >
                    <Heart size={14} fill={hasPrayed ? 'currentColor' : 'none'} />
                    <span className={`font-bold ${animate ? 'heart-beat' : ''}`}>{prayerCount}</span>
                    <span>{t('iPrayed')}</span>
                </button>
            </div>
        </div>
    );
};

export default PrayerCard;