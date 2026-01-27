/**
 * Admin Version Trash Page
 * صفحه سطل زباله نسخه‌های سرود برای پنل ادمین
 */

import React, { useState, useEffect } from 'react';
import {
    Trash2,
    RotateCcw,
    XCircle,
    Clock,
    Music,
    AlertTriangle,
    RefreshCw,
    Search
} from 'lucide-react';
import { TrashItem, TRASH_RETENTION_DAYS } from '../../types/song-version';
import songVersionManager from '../../services/SongVersionManager';
import { useLanguage } from '../../context/LanguageContext';

const AdminVersionTrashPage: React.FC = () => {
    const { lang } = useLanguage();
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // بارگذاری آیتم‌های سطل زباله
    useEffect(() => {
        loadTrashItems();
    }, []);

    const loadTrashItems = () => {
        setLoading(true);
        try {
            const items = songVersionManager.getTrashItems();
            setTrashItems(items);
        } catch (error) {
            console.error('Error loading trash items:', error);
        } finally {
            setLoading(false);
        }
    };

    // فیلتر بر اساس جستجو
    const filteredItems = trashItems.filter(item =>
        item.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.version.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // بازیابی یک آیتم
    const handleRestore = (versionId: string) => {
        if (confirm(lang === 'fa' ? 'آیا می‌خواهید این نسخه را بازیابی کنید؟' : 'Restore this version?')) {
            songVersionManager.restoreVersion(versionId);
            loadTrashItems();
            setSelectedItems(prev => prev.filter(id => id !== versionId));
        }
    };

    // حذف کامل یک آیتم
    const handlePermanentDelete = (versionId: string) => {
        if (confirm(lang === 'fa' ? '⚠️ این عمل غیرقابل بازگشت است! آیا مطمئن هستید؟' : '⚠️ This action is irreversible! Are you sure?')) {
            songVersionManager.permanentlyDeleteVersion(versionId);
            loadTrashItems();
            setSelectedItems(prev => prev.filter(id => id !== versionId));
        }
    };

    // بازیابی همه انتخاب‌شده‌ها
    const handleRestoreSelected = () => {
        if (selectedItems.length === 0) return;
        if (confirm(lang === 'fa' ? `آیا می‌خواهید ${selectedItems.length} نسخه را بازیابی کنید؟` : `Restore ${selectedItems.length} versions?`)) {
            selectedItems.forEach(id => songVersionManager.restoreVersion(id));
            loadTrashItems();
            setSelectedItems([]);
        }
    };

    // حذف همه انتخاب‌شده‌ها
    const handleDeleteSelected = () => {
        if (selectedItems.length === 0) return;
        if (confirm(lang === 'fa' ? `⚠️ ${selectedItems.length} نسخه به طور کامل حذف خواهد شد! آیا مطمئن هستید؟` : `⚠️ ${selectedItems.length} versions will be permanently deleted! Are you sure?`)) {
            selectedItems.forEach(id => songVersionManager.permanentlyDeleteVersion(id));
            loadTrashItems();
            setSelectedItems([]);
        }
    };

    // خالی کردن سطل زباله
    const handleEmptyTrash = () => {
        if (trashItems.length === 0) return;
        if (confirm(lang === 'fa' ? '⚠️ همه آیتم‌های سطل زباله حذف خواهند شد! آیا مطمئن هستید؟' : '⚠️ All trash items will be permanently deleted! Are you sure?')) {
            trashItems.forEach(item => songVersionManager.permanentlyDeleteVersion(item.version.id));
            loadTrashItems();
            setSelectedItems([]);
        }
    };

    // پاکسازی خودکار
    const handleCleanup = () => {
        const count = songVersionManager.cleanupTrash();
        if (count > 0) {
            alert(lang === 'fa' ? `${count} آیتم منقضی شده پاکسازی شد` : `${count} expired items cleaned up`);
            loadTrashItems();
        } else {
            alert(lang === 'fa' ? 'آیتم منقضی شده‌ای وجود ندارد' : 'No expired items to clean up');
        }
    };

    // انتخاب/لغو انتخاب آیتم
    const toggleSelect = (versionId: string) => {
        setSelectedItems(prev =>
            prev.includes(versionId)
                ? prev.filter(id => id !== versionId)
                : [...prev, versionId]
        );
    };

    // انتخاب همه
    const toggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.version.id));
        }
    };

    // تعداد روز باقیمانده با رنگ مناسب
    const getDaysColor = (days: number) => {
        if (days <= 7) return 'text-red-400';
        if (days <= 14) return 'text-orange-400';
        return 'text-gray-400';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/10 to-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600/20 rounded-xl">
                            <Trash2 size={32} className="text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                {lang === 'fa' ? '🗑️ سطل زباله نسخه‌ها' : '🗑️ Version Trash'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {lang === 'fa'
                                    ? `آیتم‌ها پس از ${TRASH_RETENTION_DAYS} روز به طور خودکار حذف می‌شوند`
                                    : `Items are automatically deleted after ${TRASH_RETENTION_DAYS} days`
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCleanup}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            {lang === 'fa' ? 'پاکسازی منقضی‌ها' : 'Cleanup Expired'}
                        </button>
                        <button
                            onClick={loadTrashItems}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            {lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Stats & Actions Bar */}
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-gray-700">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{trashItems.length}</div>
                            <div className="text-xs text-gray-400">{lang === 'fa' ? 'کل آیتم‌ها' : 'Total Items'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">
                                {trashItems.filter(i => i.daysRemaining <= 7).length}
                            </div>
                            <div className="text-xs text-gray-400">{lang === 'fa' ? 'منقضی نزدیک' : 'Expiring Soon'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{selectedItems.length}</div>
                            <div className="text-xs text-gray-400">{lang === 'fa' ? 'انتخاب شده' : 'Selected'}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 && (
                            <>
                                <button
                                    onClick={handleRestoreSelected}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    {lang === 'fa' ? 'بازیابی انتخاب‌شده' : 'Restore Selected'}
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <XCircle size={16} />
                                    {lang === 'fa' ? 'حذف انتخاب‌شده' : 'Delete Selected'}
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleEmptyTrash}
                            disabled={trashItems.length === 0}
                            className="px-4 py-2 bg-red-900/50 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm flex items-center gap-2 text-red-300"
                        >
                            <Trash2 size={16} />
                            {lang === 'fa' ? 'خالی کردن سطل' : 'Empty Trash'}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'fa' ? 'جستجوی نام سرود یا نسخه...' : 'Search song or version name...'}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {/* Items List */}
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="animate-spin text-gray-500 mx-auto mb-4" size={32} />
                        <p className="text-gray-500">{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
                        <Trash2 size={48} className="text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                            {lang === 'fa' ? 'سطل زباله خالی است' : 'Trash is Empty'}
                        </h3>
                        <p className="text-gray-500">
                            {lang === 'fa' ? 'هیچ نسخه حذف‌شده‌ای وجود ندارد' : 'No deleted versions found'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Select All */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/30 rounded-lg">
                            <input
                                type="checkbox"
                                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                onChange={toggleSelectAll}
                                className="w-5 h-5 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-400 text-sm">
                                {lang === 'fa' ? 'انتخاب همه' : 'Select All'} ({filteredItems.length})
                            </span>
                        </div>

                        {filteredItems.map(item => (
                            <div
                                key={item.version.id}
                                className={`bg-gray-800/50 rounded-xl p-4 border transition-all ${selectedItems.includes(item.version.id)
                                        ? 'border-purple-500 bg-purple-900/20'
                                        : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.version.id)}
                                        onChange={() => toggleSelect(item.version.id)}
                                        className="w-5 h-5 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                    />

                                    {/* Icon */}
                                    <div className="p-2 bg-gray-700 rounded-lg">
                                        <Music size={24} className="text-gray-400" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate">{item.songTitle}</h4>
                                        <p className="text-gray-400 text-sm truncate">{item.version.name}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                            <span>
                                                {lang === 'fa' ? 'حذف شده:' : 'Deleted:'} {new Date(item.version.deletedAt || '').toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                                            </span>
                                            <span className={getDaysColor(item.daysRemaining)}>
                                                <Clock size={12} className="inline mr-1" />
                                                {item.daysRemaining} {lang === 'fa' ? 'روز باقیمانده' : 'days left'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Warning for expiring soon */}
                                    {item.daysRemaining <= 7 && (
                                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-red-900/50 rounded text-red-300 text-xs">
                                            <AlertTriangle size={12} />
                                            {lang === 'fa' ? 'منقضی نزدیک' : 'Expiring soon'}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRestore(item.version.id)}
                                            className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white transition-colors"
                                            title={lang === 'fa' ? 'بازیابی' : 'Restore'}
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => handlePermanentDelete(item.version.id)}
                                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                                            title={lang === 'fa' ? 'حذف کامل' : 'Delete Permanently'}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVersionTrashPage;
