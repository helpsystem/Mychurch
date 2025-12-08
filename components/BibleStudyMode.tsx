import React from 'react';
import { BiblePayload } from '@/components/BilingualBiblePresentation';
import { Type, BookOpen, Share2, Copy } from 'lucide-react';

interface BibleStudyModeProps {
    data: BiblePayload;
    viewMode?: 'dual' | 'fa' | 'en';
}

const BibleStudyMode: React.FC<BibleStudyModeProps> = ({ data, viewMode = 'dual' }) => {
    const chapter = data.chapters[0];
    if (!chapter) return null;

    return (
        <div className="h-full overflow-y-auto bg-white p-8 pb-32">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-8 text-center border-b border-gray-100 pb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {data.book_fa} <span className="text-gray-400 mx-2">|</span> {data.book_en}
                    </h2>
                    <div className="text-gray-500 font-mono text-lg">
                        Chapter {chapter.chapterNumber}
                    </div>
                </div>

                {/* Verses List */}
                <div className="space-y-6">
                    {chapter.verses.map((verse) => (
                        <div
                            key={verse.verseNumber}
                            id={`verse-${verse.verseNumber}`}
                            className="group flex flex-col md:flex-row gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 relative"
                        >
                            {/* Verse Number & Tools */}
                            <div className="flex flex-col items-center gap-2 md:w-12 pt-1">
                                <span className="w-8 h-8 rounded-full bg-gray-100/50 text-gray-500 flex items-center justify-center text-sm font-bold group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                    {verse.verseNumber}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md" title="Copy">
                                        <Copy size={14} />
                                    </button>
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md" title="Share">
                                        <Share2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className={`flex-1 grid gap-8 ${viewMode === 'dual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Farsi */}
                                {(viewMode === 'dual' || viewMode === 'fa') && (
                                    <div className="text-right" dir="rtl">
                                        <p className="text-xl leading-loose text-gray-800 font-medium">
                                            {verse.text_fa}
                                        </p>
                                    </div>
                                )}

                                {/* English */}
                                {(viewMode === 'dual' || viewMode === 'en') && (
                                    <div className={`text-left pt-1 ${viewMode === 'dual' ? 'md:border-l md:border-gray-100 md:pl-8' : ''}`}>
                                        <p className="text-lg leading-relaxed text-gray-600 font-serif">
                                            {verse.text_en}
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>

                {/* Footer Navigation placeholder */}
                <div className="mt-16 flex items-center justify-between text-gray-400 text-sm border-t border-gray-100 pt-8">
                    <span>Previous Chapter</span>
                    <span>Next Chapter</span>
                </div>

            </div>
        </div>
    );
};

export default BibleStudyMode;
