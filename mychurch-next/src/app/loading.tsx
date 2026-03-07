export default function GlobalLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 w-full fade-in zoom-in-95 animate-in duration-500">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
            </div>
            <p className="text-muted-foreground animate-pulse font-medium text-lg tracking-wide">
                لطفاً صبر کنید...
            </p>
        </div>
    );
}
