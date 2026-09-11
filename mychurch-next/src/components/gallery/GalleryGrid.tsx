"use client";

import React, { useState, useCallback } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import { motion, type Variants } from "framer-motion";
import { Play, X, Link2, FileVideo } from "lucide-react";

export interface GalleryPhoto {
    src: string;
    width: number;
    height: number;
    title?: string;
    description?: string;
    category?: string;
    mediaType?: 'image' | 'video' | 'audio';
    isExternalLink?: boolean;
}

interface GalleryGridProps {
    photos: GalleryPhoto[];
}

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : null;
}

function getYouTubeThumbnail(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match && match[1] ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function checkIsVideo(photo: GalleryPhoto): boolean {
    if (photo.mediaType === 'video') return true;
    if (photo.category === 'ویدیوها' || photo.category === 'ویدیو پس‌زمینه') return true;
    const src = photo.src?.toLowerCase() || '';
    return !!src.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i) || src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com');
}

export function GalleryGrid({ photos }: GalleryGridProps) {
    const [index, setIndex] = useState(-1);
    const [activeVideo, setActiveVideo] = useState<GalleryPhoto | null>(null);

    // Filter only image slides for the Lightbox
    const imageSlides = photos
        .filter(p => !checkIsVideo(p))
        .map(p => ({
            src: p.src,
            width: p.width,
            height: p.height,
            title: p.title,
            description: p.description,
        }));

    const renderPhoto = useCallback(
        (renderProps: any) => {
            const { photo, imageProps, wrapperStyle } = renderProps;
            if (!photo) return null;

            const isVideo = checkIsVideo(photo);
            const ytThumb = isVideo ? getYouTubeThumbnail(photo.src) : null;
            const imgSrc = ytThumb || photo.src;

            const { alt, title, sizes, className, onClick, style, ...rest } = imageProps || {};

            const handleClick = (e: React.MouseEvent) => {
                if (isVideo) {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveVideo(photo);
                } else if (onClick) {
                    onClick(e);
                }
            };

            return (
                <motion.div
                    style={wrapperStyle}
                    variants={itemVariants}
                    className="overflow-hidden rounded-2xl cursor-pointer group"
                    onClick={handleClick}
                >
                    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-neutral-900">
                        {isVideo && !ytThumb ? (
                            <video
                                src={photo.src}
                                muted
                                preload="metadata"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <img
                                src={imgSrc}
                                alt={alt || photo.title || (isVideo ? "ویدیو" : "عکس گالری")}
                                style={{ ...style, transition: "transform 0.5s ease" }}
                                className="w-full h-full object-cover group-hover:scale-105"
                                {...rest}
                            />
                        )}

                        {/* Video Play Badge Overlay */}
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:bg-primary transition-all">
                                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                                </div>
                            </div>
                        )}

                        {/* Badges on top */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                            {isVideo && (
                                <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                    <FileVideo className="w-3 h-3" /> ویدیو
                                </span>
                            )}
                            {photo.isExternalLink && (
                                <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                    <Link2 className="w-3 h-3" /> لینک
                                </span>
                            )}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
                            {photo.title && (
                                <p className="text-white font-bold text-sm truncate" dir="rtl">{photo.title}</p>
                            )}
                        </div>

                        {/* Category badge */}
                        {photo.category && (
                            <span className="absolute top-3 right-3 bg-primary/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {photo.category}
                            </span>
                        )}
                    </div>
                </motion.div>
            );
        },
        []
    );

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full"
            >
                <RowsPhotoAlbum
                    photos={photos}
                    targetRowHeight={280}
                    rowConstraints={{ minPhotos: 1, maxPhotos: 4 }}
                    spacing={12}
                    onClick={({ index: clickedIdx }) => {
                        const clickedPhoto = photos[clickedIdx];
                        if (checkIsVideo(clickedPhoto)) {
                            setActiveVideo(clickedPhoto);
                        } else {
                            // Find index in imageSlides
                            const imageIndex = imageSlides.findIndex(s => s.src === clickedPhoto.src);
                            if (imageIndex >= 0) setIndex(imageIndex);
                        }
                    }}
                    render={{ photo: renderPhoto }}
                />
            </motion.div>

            {/* Lightbox for Images */}
            <Lightbox
                open={index >= 0}
                index={index}
                close={() => setIndex(-1)}
                slides={imageSlides}
                plugins={[Zoom, Captions]}
                zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
                styles={{
                    container: { backgroundColor: "rgba(0,0,0,0.95)" },
                }}
            />

            {/* Video Player Modal */}
            {activeVideo && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setActiveVideo(null)}
                >
                    <div
                        className="bg-neutral-900 border border-border/20 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border/10 bg-neutral-950/60">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <FileVideo className="w-5 h-5 text-blue-400" />
                                {activeVideo.title || "پخش ویدیو"}
                            </h3>
                            <button
                                onClick={() => setActiveVideo(null)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-2 bg-black flex items-center justify-center min-h-[360px]">
                            {getYouTubeEmbedUrl(activeVideo.src) ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(activeVideo.src)!}
                                    title={activeVideo.title || "YouTube video"}
                                    className="w-full aspect-video rounded-xl"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={activeVideo.src}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[70vh] rounded-xl"
                                />
                            )}
                        </div>

                        {activeVideo.description && (
                            <div className="p-4 bg-neutral-950/80 text-sm text-neutral-300">
                                {activeVideo.description}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
