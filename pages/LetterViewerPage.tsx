import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import LetterPage from '../components/LetterPage';
import Spinner from '../components/Spinner';
import { Printer } from 'lucide-react';

const MAX_PAGE_HEIGHT_PX = 950; // Approximate height for content on an A4 page in pixels

const LetterViewerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { content } = useContent();
    const { user, getUsers } = useAuth();
    const { t, lang } = useLanguage();

    const [pages, setPages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const letter = useMemo(() => content.churchLetters.find(l => l.id === Number(id)), [content.churchLetters, id]);
    const author = useMemo(() => allUsers.find(u => u.email === letter?.authorEmail), [allUsers, letter]);

    useEffect(() => {
        getUsers().then(setAllUsers);
    }, [getUsers]);

    useEffect(() => {
        if (!letter) {
            setIsLoading(false);
            return;
        }

        const paginateContent = () => {
            const tempContainer = document.createElement('div');
            tempContainer.style.width = '170mm'; // 210mm (A4 width) - 2*20mm (padding)
            tempContainer.style.visibility = 'hidden';
            tempContainer.style.position = 'absolute';
            tempContainer.style.fontFamily = 'serif';
            tempContainer.style.lineHeight = '1.625';
            document.body.appendChild(tempContainer);

            const contentContainer = document.createElement('div');
            contentContainer.innerHTML = letter.body[lang];
            const nodes = Array.from(contentContainer.childNodes);
            
            let currentPageContent = '';
            const paginatedContent: string[] = [];

            nodes.forEach(node => {
                const nodeHtml = (node as HTMLElement).outerHTML || node.textContent || '';
                tempContainer.innerHTML = currentPageContent + nodeHtml;
                
                if (tempContainer.offsetHeight > MAX_PAGE_HEIGHT_PX && currentPageContent !== '') {
                    paginatedContent.push(currentPageContent);
                    currentPageContent = nodeHtml;
                } else {
                    currentPageContent += nodeHtml;
                }
            });

            if (currentPageContent) {
                paginatedContent.push(currentPageContent);
            }
            
            document.body.removeChild(tempContainer);
            setPages(paginatedContent.length > 0 ? paginatedContent : ['']);
            setIsLoading(false);
        };
        
        // Timeout to ensure fonts are loaded for accurate measurement
        const timeoutId = setTimeout(paginateContent, 100);

        return () => clearTimeout(timeoutId);

    }, [letter, lang]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="12" /></div>;
    }

    if (!letter) {
        return <Navigate to="/404" />;
    }

    const isAuthorized = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER' || letter.authorizedUsers.includes(user?.email || '');

    if (!isAuthorized) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl text-red-500">Access Denied</h1>
                <p>You do not have permission to view this document.</p>
            </div>
        );
    }
    
    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="bg-gray-800 min-h-screen py-12 px-4">
             <div className="fixed top-4 right-4 z-50 print-hidden">
                <button 
                    onClick={handlePrint} 
                    className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 shadow-lg"
                >
                    <Printer size={16}/> {t('print')}
                </button>
            </div>
            <div id="letter-container" className="flex flex-col items-center gap-8">
                {pages.map((pageHtml, index) => (
                    <LetterPage 
                        key={index} 
                        pageNumber={index + 1} 
                        totalPages={pages.length}
                        settings={content.settings}
                        author={author}
                    >
                        <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
                    </LetterPage>
                ))}
            </div>
        </div>
    );
};

export default LetterViewerPage;
