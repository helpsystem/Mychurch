import React, { useState, useEffect } from 'react';
import { PrayerRequest } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../lib/api';
import PrayerCard from './PrayerCard';
import Spinner from './Spinner';
import { Search, Filter, Heart, Calendar, RefreshCw } from 'lucide-react';

interface Props {
    showOnlyPublic?: boolean;
}

const PrayerWall: React.FC<Props> = ({ showOnlyPublic = true }) => {
    const { t, lang } = useLanguage();
    const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    const fetchPrayerRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getPrayerRequests(showOnlyPublic);
            setPrayerRequests(response || []);
        } catch (err: any) {
            console.error('Failed to fetch prayer requests:', err);
            setError(err.message || 'Failed to load prayer requests');
            // Use mock data as fallback
            setPrayerRequests(getMockPrayerRequests());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrayerRequests();
    }, [showOnlyPublic]);

    const getMockPrayerRequests = (): PrayerRequest[] => [
        {
            id: 1,
            text: lang === 'fa' ? 'لطفاً برای سلامتی مادرم دعا کنید' : 'Please pray for my mother\'s healing',
            category: 'healing',
            isAnonymous: false,
            authorName: 'Sarah',
            prayerCount: 12,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            text: lang === 'fa' ? 'از خداوند برای شغل جدیدم تشکر می‌کنم' : 'Thanking God for my new job opportunity',
            category: 'thanksgiving',
            isAnonymous: true,
            prayerCount: 8,
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            text: lang === 'fa' ? 'نیاز به راهنمایی برای تصمیم مهم زندگی دارم' : 'Need guidance for an important life decision',
            category: 'guidance',
            isAnonymous: false,
            authorName: 'Michael',
            prayerCount: 15,
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];

    const filteredPrayers = prayerRequests.filter(prayer => {
        const matchesSearch = prayer.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (prayer.authorName && prayer.authorName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || prayer.category === selectedCategory;
        const matchesUrgency = selectedUrgency === 'all' || (prayer as any).urgency === selectedUrgency;
        
        return matchesSearch && matchesCategory && matchesUrgency;
    });

    const handlePrayerUpdate = async (prayerId: number) => {
        try {
            const updatedPrayer = await api.incrementPrayerCount(prayerId);
            setPrayerRequests(prev => 
                prev.map(prayer => prayer.id === prayerId 
                    ? { ...prayer, prayerCount: updatedPrayer.prayerCount } 
                    : prayer
                )
            );
        } catch (error) {
            console.error('Failed to update prayer count:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="8" />
                    <p className="text-gray-400">{t('loadingPrayers') || 'Loading prayers...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="prayer-wall space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('searchPrayers') || 'Search prayer requests...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{t('filters') || 'Filters'}:</span>
                    </div>
                    
                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">{t('allCategories') || 'All Categories'}</option>
                        <option value="thanksgiving">{t('thanksgiving') || 'Thanksgiving'}</option>
                        <option value="healing">{t('healing') || 'Healing'}</option>
                        <option value="guidance">{t('guidance') || 'Guidance'}</option>
                        <option value="family">{t('family') || 'Family'}</option>
                        <option value="other">{t('other') || 'Other'}</option>
                    </select>
                    
                    {/* Urgency Filter */}
                    <select
                        value={selectedUrgency}
                        onChange={(e) => setSelectedUrgency(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">{t('allUrgencies') || 'All Urgencies'}</option>
                        <option value="low">{t('lowUrgency') || 'Low'}</option>
                        <option value="normal">{t('normalUrgency') || 'Normal'}</option>
                        <option value="high">{t('highUrgency') || 'High'}</option>
                        <option value="urgent">{t('urgentUrgency') || 'Urgent'}</option>
                    </select>
                    
                    {/* Refresh Button */}
                    <button
                        onClick={fetchPrayerRequests}
                        disabled={loading}
                        className="ml-auto flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('refresh') || 'Refresh'}
                    </button>
                </div>
                
                {/* Results Count */}
                <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-4">
                    <span>
                        {t('showingResults') || 'Showing'} {filteredPrayers.length} {t('of') || 'of'} {prayerRequests.length} {t('requests') || 'requests'}
                    </span>
                    {showOnlyPublic && (
                        <span className="text-green-600 font-medium">
                            📢 {t('publicRequestsOnly') || 'Public requests only'}
                        </span>
                    )}
                    {!showOnlyPublic && (
                        <span className="text-blue-600 font-medium">
                            🔒 {t('allRequestsIncludingPrivate') || 'All requests (including private)'}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">
                        ⚠️ {t('errorLoadingPrayers') || 'Error loading prayers'}: {error}
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                        {t('usingMockData') || 'Using sample data for demonstration'}
                    </p>
                    <button
                        onClick={fetchPrayerRequests}
                        className="mt-2 text-red-600 hover:text-red-700 underline text-sm"
                    >
                        {t('tryAgain') || 'Try Again'}
                    </button>
                </div>
            )}
            
            {/* Prayer Cards Grid */}
            {filteredPrayers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPrayers.map(prayer => (
                        <PrayerCard 
                            key={prayer.id} 
                            prayer={prayer} 
                            onPrayerUpdate={() => handlePrayerUpdate(prayer.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || selectedCategory !== 'all' || selectedUrgency !== 'all' 
                            ? (t('noPrayersFound') || 'No prayers found') 
                            : (t('noPrayersYet') || 'No prayer requests yet')
                        }
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm || selectedCategory !== 'all' || selectedUrgency !== 'all'
                            ? (t('tryDifferentFilters') || 'Try adjusting your search or filters')
                            : (t('firstToSubmit') || 'Be the first to submit a prayer request')
                        }
                    </p>
                    {(searchTerm || selectedCategory !== 'all' || selectedUrgency !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                                setSelectedUrgency('all');
                            }}
                            className="mt-3 text-blue-600 hover:text-blue-700 underline"
                        >
                            {t('clearFilters') || 'Clear all filters'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrayerWall;