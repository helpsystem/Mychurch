import React from 'react';

const LogoLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            {/* Animated Background Ring */}
            <div className="absolute animate-[spin_8s_linear_infinite] w-64 h-64 rounded-full border-t border-b border-purple-500/30 blur-sm" />
            <div className="absolute animate-[spin_12s_linear_infinite_reverse] w-72 h-72 rounded-full border-r border-l border-blue-500/20 blur-sm" />

            {/* Logo Container */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl animate-pulse rounded-full" />

                    {/* Logo Image */}
                    <img
                        src="/images/church-logo-ultra-hd.png"
                        alt="Loading..."
                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-[pulse_3s_ease-in-out_infinite]"
                    />
                </div>

                {/* Text Animation */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-[pulse_4s_ease-in-out_infinite]">
                        IRAN CHURCH DC
                    </h2>
                    <div className="flex justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite_0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite_200ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-[bounce_1s_infinite_400ms]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoLoader;
