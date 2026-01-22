/**
 * CollapsibleSection Component
 * 
 * A reusable collapsible section for displaying optional content
 * Shows disabled state when isEmpty is true
 */

import React, { useState } from 'react';
import { ChevronDown, FileText, Download } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    isEmpty: boolean;
    emptyText: string;
    children?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    isEmpty,
    emptyText,
    children
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/20 rounded-lg overflow-hidden backdrop-blur-sm">
            <button
                onClick={() => !isEmpty && setIsOpen(!isOpen)}
                disabled={isEmpty}
                className={`w-full p-4 flex items-center justify-between transition-all duration-200 ${isEmpty
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-white/10 hover:bg-white/15 text-white active:scale-[0.99]'
                    }`}
            >
                <span className="font-medium text-base">{title}</span>
                {!isEmpty && (
                    <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                )}
            </button>

            {isEmpty ? (
                <div className="p-6 bg-white/5 text-gray-500 text-sm italic text-center">
                    {emptyText}
                </div>
            ) : isOpen && (
                <div className="p-5 bg-white/5 animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

/**
 * AttachmentList Component
 * 
 * Displays a list of downloadable attachments
 */
interface Attachment {
    name: string;
    url: string;
    size?: string;
    type?: string;
}

interface AttachmentListProps {
    attachments: Attachment[];
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments }) => {
    return (
        <div className="space-y-2">
            {attachments.map((file, idx) => (
                <a
                    key={idx}
                    href={file.url}
                    download={file.name}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors group border border-white/10"
                >
                    <div className="flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{file.name}</div>
                        {file.size && (
                            <div className="text-xs text-gray-400 mt-0.5">{file.size}</div>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <Download className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </a>
            ))}
        </div>
    );
};

export default CollapsibleSection;
