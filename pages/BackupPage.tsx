import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Download, FileJson, Database } from 'lucide-react';
import Spinner from '../components/Spinner';

const BackupPage: React.FC = () => {
    const { t } = useLanguage();
    const { content } = useContent();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleContentBackup = () => {
        setIsDownloading(true);
        try {
            const jsonString = JSON.stringify(content, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `iccdc_content_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to create content backup:", error);
            alert("Could not generate content backup.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDatabaseBackup = () => {
        setIsGenerating(true);
        setTimeout(() => {
            try {
                const sqlContent = `-- Simulated backup of ICCDC database
-- Generated on: ${new Date().toISOString()}
-- In a real production environment, this file would contain a full SQL dump from pg_dump or a similar tool.

-- Structure for table 'users'
-- CREATE TABLE users (...);

-- Data for table 'users'
-- INSERT INTO users (id, email, role, ...) VALUES (...);

-- End of simulated backup.
`;
                const blob = new Blob([sqlContent], { type: "application/sql" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `iccdc_db_backup_simulated_${new Date().toISOString().split('T')[0]}.sql`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Failed to create DB backup:", error);
                alert("Could not generate database backup.");
            } finally {
                setIsGenerating(false);
            }
        }, 1500); // Simulate generation time
    };

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                <Download /> {t('backupExport')}
            </h2>
            <p className="text-dimWhite mb-6">{t('backupDescription')}</p>

            <div className="space-y-4">
                <div className="bg-primary p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <FileJson className="text-secondary w-8 h-8 flex-shrink-0" />
                         <div>
                            <h3 className="font-semibold text-white">{t('backupContent')}</h3>
                            <p className="text-xs text-dimWhite">Download all pages, posts, settings, etc., as a single JSON file.</p>
                         </div>
                    </div>
                    <button 
                        onClick={handleContentBackup} 
                        disabled={isDownloading}
                        className="w-full sm:w-auto py-2 px-4 font-medium text-sm text-primary bg-blue-gradient rounded-[10px] outline-none flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDownloading ? <><Spinner size="4"/> {t('downloading')}</> : <><Download size={16}/> JSON</>}
                    </button>
                </div>

                 <div className="bg-primary p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <Database className="text-secondary w-8 h-8 flex-shrink-0" />
                         <div>
                            <h3 className="font-semibold text-white">{t('backupDb')}</h3>
                            <p className="text-xs text-dimWhite">Generate and download a simulated SQL file of your database.</p>
                         </div>
                    </div>
                     <button 
                        onClick={handleDatabaseBackup} 
                        disabled={isGenerating}
                        className="w-full sm:w-auto py-2 px-4 font-medium text-sm text-primary bg-blue-gradient rounded-[10px] outline-none flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <><Spinner size="4"/> {t('generatingBackup')}</> : <><Download size={16}/> SQL</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupPage;
