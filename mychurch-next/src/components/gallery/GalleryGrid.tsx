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

export interface GalleryPhoto {
    src: string;
    width: number;
    height: number;
    title?: string;
    description?: string;
    category?: string;
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

export function GalleryGrid({ photos }: GalleryGridProps) {
    const [index, setIndex] = useState(-1);

    const slides = photos.map(p => ({
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

            const { alt, title, sizes, className, onClick, style, ...rest } = imageProps || {};

            return (
                <motion.div
                    style={wrapperStyle}
                    variants={itemVariants}
                    className="overflow-hidden rounded-2xl cursor-pointer group"
                >
                    <div className="relative w-full h-full overflow-hidden rounded-2xl">
                        <img
                            src={photo.src}
                            alt={alt || photo.title || "عکس گالری"}
                            style={{ ...style, transition: "transform 0.5s ease" }}
                            className="w-full h-full object-cover group-hover:scale-105"
                            onClick={onClick}
                            {...rest}
                        />
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
                    onClick={({ index }) => setIndex(index)}
                    render={{ photo: renderPhoto }}
                />
            </motion.div>

            <Lightbox
                open={index >= 0}
                index={index}
                close={() => setIndex(-1)}
                slides={slides}
                plugins={[Zoom, Captions]}
                zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
                styles={{
                    container: { backgroundColor: "rgba(0,0,0,0.95)" },
                }}
            />
        </>
    );
}
