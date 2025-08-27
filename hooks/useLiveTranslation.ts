import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Language } from '../types';
import { translationService } from '../services/translationService';

export const useLiveTranslation = () => {
    const [isTranslated, setIsTranslated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const originalTextsRef = useRef(new Map<Node, string>());
    const location = useLocation();

    // Reset translation state on page navigation
    useEffect(() => {
        if (isTranslated) {
            revertTranslation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const revertTranslation = useCallback(() => {
        originalTextsRef.current.forEach((originalText, node) => {
            node.nodeValue = originalText;
        });
        originalTextsRef.current.clear();
        setIsTranslated(false);
        setIsLoading(false);
    }, []);

    const toggleTranslation = useCallback(async (targetLang: Language) => {
        if (isLoading) return;

        if (isTranslated) {
            revertTranslation();
            return;
        }

        setIsLoading(true);
        const mainContent = document.querySelector('main');
        if (!mainContent) {
            setIsLoading(false);
            return;
        }

        const walker = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT, null);
        const textNodes: Node[] = [];
        const textsToTranslate: string[] = [];
        
        // Exclude elements that shouldn't be translated
        const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'TEXTAREA', 'INPUT', 'SELECT'];

        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue?.trim() && !excludedTags.includes(node.parentElement?.tagName || '')) {
                textNodes.push(node);
                textsToTranslate.push(node.nodeValue);
                originalTextsRef.current.set(node, node.nodeValue);
            }
        }
        
        if (textsToTranslate.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const translatedTexts = await translationService.bulkTranslate(textsToTranslate, targetLang);
            
            textNodes.forEach((node, index) => {
                if(translatedTexts[index]) {
                   node.nodeValue = translatedTexts[index];
                }
            });
            setIsTranslated(true);
        } catch (error) {
            console.error("Live translation failed:", error);
            revertTranslation(); // Revert on error
        } finally {
            setIsLoading(false);
        }

    }, [isLoading, isTranslated, revertTranslation]);

    return { isTranslated, isLoading, toggleTranslation };
};
