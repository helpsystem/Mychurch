import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { FileText, MicVocal, Users, Bell, AlertTriangle, CheckCircle, Activity, BookOpen, Music } from 'lucide-react';
import { ActivityLog, User } from '../types';
import Spinner from './Spinner';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DashboardView: React.FC = () => {
    const { t } = useLanguage();
    const { content } = useContent();
    const { getUsers, getSiteActivity } = useAuth();
    
    const [users, setUsers] = useState<User[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userList, activityLogs] = await Promise.all([
                    getUsers(),
                    getSiteActivity(),
                ]);
                setUsers(userList);
                setActivity(activityLogs);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [getUsers, getSiteActivity]);
    
    // Needs Review Logic
    const versesNeedingReview = Object.entries(content.bibleContent).flatMap(([book, chapters]) =>
        Object.entries(chapters).flatMap(([chapter, verses]) =>
            verses.en.length !== verses.fa.length || verses.en.some((v, i) => !v || !verses.fa[i])
                ? [{ book, chapter }]
                : []
        )
    );
    const songsNeedingAudio = content.worshipSongs.filter(song => !song.audioUrl);
    
    // Chart Data
    const contentData = {
        labels: [t('sermonsTitle'), t('navEvents'), t('pages'), t('worshipTitle')],
        datasets: [{
            data: [
                content.sermons.length,
                content.events.length,
                content.pages.length,
                content.worshipSongs.length,
            ],
            backgroundColor: ['#33BBCF', '#9DEDF0', '#BEF3F5', '#5CE1E6'],
            borderColor: '#00040F',
            borderWidth: 2,
        }]
    };
    
    const userRoleData = {
        labels: [t('roleUser'), t('roleManager'), t('roleSuperAdmin')],
        datasets: [{
            data: [
                users.filter(u => u.role === 'USER').length,
                users.filter(u => u.role === 'MANAGER').length,
                users.filter(u => u.role === 'SUPER_ADMIN').length,
            ],
            backgroundColor: ['#DEF9FA', '#7DE7EB', '#00F6FF'],
            borderColor: '#00040F',
            borderWidth: 2,
        }]
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#e0e0e0',
                    font: {
                        size: 14
                    }
                }
            }
        },
        maintainAspectRatio: false
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    const stats = [
        { title: t('totalUsers'), value: users.length, icon: <Users/>, color: 'bg-yellow-500' },
        { title: t('totalSermons'), value: content.sermons.length, icon: <MicVocal/>, color: 'bg-green-500' },
        { title: t('totalPages'), value: content.pages.length, icon: <FileText/>, color: 'bg-blue-500' },
        { title: t('totalNotifications'), value: 2, icon: <Bell/>, color: 'bg-red-500' }, // Mocked value
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('dashboardOverview')}</h1>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.title} className="bg-black-gradient p-6 rounded-xl flex items-center gap-4 border border-gray-700">
                        <div className={`p-3 rounded-full text-white ${stat.color}`}>
                            {React.cloneElement(stat.icon, { size: 28 })}
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-sm text-dimWhite">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-black-gradient p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">{t('contentDistribution')}</h2>
                    <div className="h-64"><Doughnut data={contentData} options={chartOptions} /></div>
                </div>
                 <div className="bg-black-gradient p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">{t('userRoles')}</h2>
                    <div className="h-64"><Pie data={userRoleData} options={chartOptions} /></div>
                </div>
            </div>

            {/* Review & Activity */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-black-gradient p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-400"/> {t('needsReview')}</h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {versesNeedingReview.length === 0 && songsNeedingAudio.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle size={18}/>
                                <p>All content is up-to-date.</p>
                            </div>
                        ) : (
                            <>
                                {versesNeedingReview.map(v => (
                                    <div key={`${v.book}-${v.chapter}`} className="flex items-center gap-2 text-sm text-dimWhite">
                                        <BookOpen size={16} className="text-yellow-500"/>
                                        <span>{t('verseMissingTranslation')}: {v.book} {v.chapter}</span>
                                    </div>
                                ))}
                                {songsNeedingAudio.map(s => (
                                     <div key={s.id} className="flex items-center gap-2 text-sm text-dimWhite">
                                        <Music size={16} className="text-yellow-500"/>
                                        <span>{t('songMissingAudio')}: {s.title.en}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
                 <div className="bg-black-gradient p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Activity/> {t('recentActivity')}</h2>
                     <div className="space-y-3 max-h-60 overflow-y-auto">
                        {activity.map((log, index) => (
                            <div key={index} className="flex gap-3 text-sm">
                                <div className="text-gray-500 w-28 flex-shrink-0">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <div className="flex-grow">
                                    <span className="font-bold text-secondary">{log.action}: </span>
                                    <span className="text-dimWhite">{log.details}</span>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;