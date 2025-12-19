import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../lib/api';
import { Plus, Edit, Trash2, Video, Save, X, Calendar, User, Type, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Sermon {
    id: number;
    title: string;
    preacher: string;
    date: string;
    youtube_id: string;
    description?: string;
    is_live: boolean;
    notes?: string;
}

const AdminSermonsPage = () => {
    const { t, lang } = useLanguage();
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSermon, setCurrentSermon] = useState<Partial<Sermon>>({});

    // Fetch Sermons
    const fetchSermons = async () => {
        setLoading(true);
        try {
            const data = await api.getSermons();
            setSermons(data || []);
        } catch (error) {
            console.error('Error fetching sermons:', error);
            toast.error('Failed to load sermons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSermons();
    }, []);

    const handleSave = async () => {
        if (!currentSermon.title || !currentSermon.youtube_id) {
            toast.error('Title and YouTube ID are required');
            return;
        }

        const sermonData = {
            title: currentSermon.title,
            speaker: currentSermon.preacher, // Backend expects 'speaker', frontend interface uses 'preacher'
            preacher: currentSermon.preacher, // Send both for compatibility
            date: currentSermon.date || new Date().toISOString().split('T')[0],
            youtube_id: currentSermon.youtube_id,
            description: currentSermon.description,
            is_live: currentSermon.is_live || false,
            notes: currentSermon.notes,
            audioUrl: 'https://youtube.com', // Placeholder required by backend schema if strictly enforced, or DB default
            notesUrl: ''
        };

        try {
            if (currentSermon.id) {
                // Update
                await api.updateSermon(currentSermon.id, sermonData);
            } else {
                // Insert
                await api.createSermon(sermonData);
            }
            toast.success('Sermon saved successfully');
            setIsEditing(false);
            setCurrentSermon({});
            fetchSermons();
        } catch (error) {
            console.error('Error saving sermon:', error);
            toast.error('Failed to save sermon');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this sermon?')) return;

        try {
            await api.deleteSermon(id);
            toast.success('Sermon deleted');
            fetchSermons();
        } catch (error) {
            toast.error('Failed to delete sermon');
        }
    };

    const toggleLive = async (sermon: Sermon) => {
        try {
            await api.updateSermon(sermon.id, { ...sermon, is_live: !sermon.is_live });
            toast.success(sermon.is_live ? 'Live stream ended' : 'Gone LIVE!');
            fetchSermons();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="p-6 bg-primary min-h-screen text-white font-poppins">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gradient">Online Services Management</h1>
                <button
                    onClick={() => { setIsEditing(true); setCurrentSermon({}); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add New Service
                </button>
            </div>

            {/* List */}
            <div className="bg-black-gradient rounded-xl p-6 shadow-xl">
                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Preacher</th>
                                    <th className="p-4">YouTube ID</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sermons.map((sermon: Sermon) => (
                                    <tr key={sermon.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleLive(sermon)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit ${sermon.is_live
                                                    ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse'
                                                    : 'bg-gray-700 text-gray-400'
                                                    }`}
                                            >
                                                {sermon.is_live ? (
                                                    <><Video size={12} /> LIVE NOW</>
                                                ) : (
                                                    'OFFLINE'
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-dimWhite">{sermon.date}</td>
                                        <td className="p-4 font-medium">{sermon.title}</td>
                                        <td className="p-4 text-dimWhite">{sermon.preacher}</td>
                                        <td className="p-4 font-mono text-xs text-blue-400">{sermon.youtube_id}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setCurrentSermon(sermon); setIsEditing(true); }}
                                                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sermon.id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sermons.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            No sermons found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl p-6 shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {currentSermon.id ? 'Edit Service' : 'Add New Service'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Title */}
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Title (Topic)</label>
                                    <div className="flex bg-black rounded-lg border border-gray-700 p-2 focus-within:border-blue-500">
                                        <Type className="text-gray-500 mr-2" />
                                        <input
                                            type="text"
                                            value={currentSermon.title || ''}
                                            onChange={e => setCurrentSermon({ ...currentSermon, title: e.target.value })}
                                            className="bg-transparent w-full outline-none text-white"
                                            placeholder="e.g. Sunday Service - Faith"
                                        />
                                    </div>
                                </div>

                                {/* Preacher */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Preacher</label>
                                    <div className="flex bg-black rounded-lg border border-gray-700 p-2 focus-within:border-blue-500">
                                        <User className="text-gray-500 mr-2" />
                                        <input
                                            type="text"
                                            value={currentSermon.preacher || ''}
                                            onChange={e => setCurrentSermon({ ...currentSermon, preacher: e.target.value })}
                                            className="bg-transparent w-full outline-none text-white"
                                            placeholder="e.g. Pastor Javad"
                                        />
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                                    <div className="flex bg-black rounded-lg border border-gray-700 p-2 focus-within:border-blue-500">
                                        <Calendar className="text-gray-500 mr-2" />
                                        <input
                                            type="date"
                                            value={currentSermon.date || ''}
                                            onChange={e => setCurrentSermon({ ...currentSermon, date: e.target.value })}
                                            className="bg-transparent w-full outline-none text-white"
                                        />
                                    </div>
                                </div>

                                {/* YouTube ID */}
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">YouTube Video ID</label>
                                    <div className="flex bg-black rounded-lg border border-gray-700 p-2 focus-within:border-blue-500">
                                        <LinkIcon className="text-gray-500 mr-2" />
                                        <input
                                            type="text"
                                            value={currentSermon.youtube_id || ''}
                                            onChange={e => setCurrentSermon({ ...currentSermon, youtube_id: e.target.value })}
                                            className="bg-transparent w-full outline-none text-white"
                                            placeholder="e.g. dQw4w9WgXcQ (ID only)"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Get this from the YouTube URL (after v=)</p>
                                </div>

                                {/* Description */}
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Description / Verses</label>
                                    <textarea
                                        value={currentSermon.description || ''}
                                        onChange={e => setCurrentSermon({ ...currentSermon, description: e.target.value })}
                                        className="bg-black rounded-lg border border-gray-700 p-3 w-full h-24 outline-none text-white resize-none focus:border-blue-500"
                                        placeholder="Enter sermon description or scripture references..."
                                    />
                                </div>
                            </div>

                            {/* Live Toggle in Edit */}
                            <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl mt-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentSermon.is_live || false}
                                        onChange={e => setCurrentSermon({ ...currentSermon, is_live: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                                <span className={`font-bold ${currentSermon.is_live ? 'text-red-500' : 'text-gray-400'}`}>
                                    {currentSermon.is_live ? 'Currently LIVE' : 'Archive Mode'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Service
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSermonsPage;
