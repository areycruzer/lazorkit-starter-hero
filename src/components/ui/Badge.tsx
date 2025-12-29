interface BadgeProps {
    label: string;
    variant?: 'solana' | 'neutral' | 'outline';
    showDot?: boolean;
}

export function Badge({ label, variant = 'neutral', showDot = false }: BadgeProps) {
    const styles = {
        solana: 'bg-solana-green/10 text-solana-green border-solana-green/20',
        neutral: 'bg-white/5 text-gray-400 border-white/10',
        outline: 'border-white/20 text-gray-300 bg-transparent'
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
            {showDot && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
            )}
            {label}
        </div>
    );
}
