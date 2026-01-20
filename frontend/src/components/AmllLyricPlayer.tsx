import React, { useEffect, useRef, useState } from 'react';
import { LyricPlayer } from '@applemusic-like-lyrics/core';
import type { AmllLyricLine } from '../utils/amllConverter';

interface AmllLyricPlayerProps {
    lyricLines: AmllLyricLine[];
    currentTime: number; // in seconds
    showFinglish?: boolean;
    className?: string;
    onLineChange?: (lineIndex: number) => void;
}

/**
 * AMLL Lyric Player Wrapper Component
 * Wraps the AMLL core library for React usage
 * Provides Apple Music-like lyric display with word-by-word highlighting
 */
export const AmllLyricPlayer: React.FC<AmllLyricPlayerProps> = ({
    lyricLines,
    currentTime,
    showFinglish = true,
    className = '',
    onLineChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<LyricPlayer | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize AMLL player
    useEffect(() => {
        if (!containerRef.current) return;

        try {
            // Create new LyricPlayer instance
            const player = new LyricPlayer();
            playerRef.current = player;

            // Append to container
            const element = player.getElement();
            if (element) {
                containerRef.current.appendChild(element);
            }

            // Configure player options
            // Note: Configuration will depend on AMLL library's API

            setIsReady(true);

            return () => {
                // Cleanup
                if (playerRef.current) {
                    try {
                        const element = playerRef.current.getElement();
                        if (element && element.parentNode) {
                            element.parentNode.removeChild(element);
                        }
                        playerRef.current.dispose?.();
                    } catch (error) {
                        console.error('Error disposing AMLL player:', error);
                    }
                    playerRef.current = null;
                }
                setIsReady(false);
            };
        } catch (error) {
            console.error('Failed to initialize AMLL player:', error);
            return;
        }
    }, []);

    // Update lyrics when they change
    useEffect(() => {
        if (!isReady || !playerRef.current || !lyricLines) return;

        try {
            playerRef.current.setLyricLines(lyricLines);
        } catch (error) {
            console.error('Error setting lyric lines:', error);
        }
    }, [lyricLines, isReady]);

    // Update current time
    useEffect(() => {
        if (!isReady || !playerRef.current) return;

        try {
            // Convert seconds to milliseconds
            const timeMs = currentTime * 1000;
            playerRef.current.setCurrentTime(timeMs);

            // Request animation frame update
            requestAnimationFrame(() => {
                if (playerRef.current) {
                    playerRef.current.update(timeMs);
                }
            });
        } catch (error) {
            console.error('Error updating time:', error);
        }
    }, [currentTime, isReady]);

    // Update animation on every frame
    useEffect(() => {
        if (!isReady || !playerRef.current) return;

        let animationFrameId: number;
        let lastTime = performance.now();

        const animate = (time: number) => {
            if (!playerRef.current) return;

            const deltaTime = time - lastTime;
            lastTime = time;

            try {
                playerRef.current.update(deltaTime);
            } catch (error) {
                console.error('Error in animation frame:', error);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isReady]);

    return (
        <div
            ref={containerRef}
            className={`amll-player-container ${className}`}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
            }}
        />
    );
};

export default AmllLyricPlayer;
