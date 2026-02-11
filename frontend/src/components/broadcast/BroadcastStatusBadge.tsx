import React from 'react';
import { Users, SignalZero } from 'lucide-react';

interface BroadcastStatusBadgeProps {
    isLive: boolean;
    viewerCount: number;
}

const BroadcastStatusBadge: React.FC<BroadcastStatusBadgeProps> = ({ isLive, viewerCount }) => {
    if (isLive) {
        return (
            <div className="inline-flex items-center gap-3 bg-gray-900 text-white font-medium py-1.5 px-4 rounded-full text-sm border border-gray-700 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-3 h-3">
                        <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="text-red-400 font-bold tracking-wider">LIVE</span>
                </div>
                <div className="h-5 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{viewerCount.toLocaleString()}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 bg-gray-800 text-gray-400 font-medium py-1.5 px-4 rounded-full text-sm border border-gray-700">
            <SignalZero className="w-4 h-4 text-gray-500" />
            <span>OFFLINE</span>
        </div>
    );
};

export default BroadcastStatusBadge;
