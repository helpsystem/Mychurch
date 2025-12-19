import React, { useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { BiblePayload } from './BilingualBiblePresentation';

interface Bible3DModeProps {
    data: BiblePayload;
    viewMode: 'dual' | 'fa' | 'en';
}

const Page = React.forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div className="page bg-[#fdfbf7] h-full shadow-inner border-r border-[#e3dccb] overflow-hidden" ref={ref}>
            <div className="h-full p-8 md:p-12 flex flex-col relative">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                </div>

                {/* Page Content */}
                <div className="text-center text-gray-500 text-xs font-mono mb-6 uppercase tracking-widest opacity-60">
                    {props.header}
                </div>

                <div className="flex-1 text-gray-800 leading-relaxed text-lg" dir={props.dir}>
                    {props.children}
                </div>

                <div className="text-center text-gray-400 text-xs mt-4">
                    {props.number}
                </div>
            </div>
        </div>
    );
});

const Bible3DMode: React.FC<Bible3DModeProps> = ({ data, viewMode }) => {
    const chapter = data.chapters[0];

    // Pagination Logic: Split verses into pages (e.g., 5 verses per page)
    const pages = useMemo(() => {
        if (!chapter) return [];
        const verses = chapter.verses;
        const VERSES_PER_PAGE = 6;
        const result = [];

        for (let i = 0; i < verses.length; i += VERSES_PER_PAGE) {
            result.push(verses.slice(i, i + VERSES_PER_PAGE));
        }
        return result;
    }, [chapter]);

    if (!chapter) return null;

    return (
        <div className="h-full w-full flex items-center justify-center bg-gray-900 perspective-[1500px] overflow-hidden">
            {/* @ts-ignore - types for react-pageflip might be missing */}
            <HTMLFlipBook
                width={500}
                height={700}
                size="stretch"
                minWidth={300}
                maxWidth={600}
                minHeight={400}
                maxHeight={800}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="shadow-2xl"
            >
                {/* Cover */}
                <Page number={1} header="HOLY BIBLE" dir="ltr">
                    <div className="h-full flex flex-col items-center justify-center border-4 border-double border-yellow-700/30 p-4">
                        <h1 className="text-4xl font-serif text-yellow-900 mb-4">{data.book_en}</h1>
                        <h2 className="text-3xl font-bold text-yellow-950 mb-8">{data.book_fa}</h2>
                        <div className="text-xl text-yellow-800 font-mono">Chapter {chapter.chapterNumber}</div>
                    </div>
                </Page>

                {/* Content Pages */}
                {pages.map((pageVerses, index) => (
                    <Page
                        key={index}
                        number={index + 2}
                        header={`${data.book_en} ${chapter.chapterNumber}`}
                        dir={viewMode === 'en' ? 'ltr' : 'rtl'}
                    >
                        <div className="space-y-6">
                            {pageVerses.map((v) => (
                                <div key={v.verseNumber} className="relative">
                                    <span className="text-xs font-bold text-yellow-700 absolute -right-6 top-1 select-none">
                                        {v.verseNumber}
                                    </span>
                                    {/* Content based on View Mode */}
                                    {(viewMode === 'dual' || viewMode === 'fa') && (
                                        <p className="font-medium text-gray-900 mb-2">{v.text_fa}</p>
                                    )}
                                    {(viewMode === 'dual' || viewMode === 'en') && (
                                        <p className="font-serif text-gray-600 text-sm ltr" dir="ltr">{v.text_en}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Page>
                ))}

                {/* Back Cover */}
                <Page number={pages.length + 2} header="END">
                    <div className="h-full flex items-center justify-center">
                        <div className="w-16 h-16 opacity-20 bg-gray-800 rounded-full"></div>
                    </div>
                </Page>

            </HTMLFlipBook>
        </div>
    );
};

export default Bible3DMode;
