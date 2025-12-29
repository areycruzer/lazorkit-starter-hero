import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface BentoCardProps {
    title: string;
    icon?: LucideIcon;
    image?: string;
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function BentoCard({ title, icon: Icon, image, children, className = '', delay = 0 }: BentoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 ${className}`}
        >
            {/* Radial Gradient Hover Effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(153, 69, 255, 0.08) 0%, transparent 70%)'
                }}
            />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    {Icon && !image && (
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-300 group-hover:text-solana-green group-hover:border-solana-green/20 transition-colors duration-300">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    {image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/5 group-hover:border-solana-teal/50 transition-colors duration-300 relative">
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-solana-purple/10 mix-blend-overlay" />
                        </div>
                    )}
                    <h3 className="text-lg font-medium text-gray-200 group-hover:text-white transition-colors">
                        {title}
                    </h3>
                </div>

                <div className="flex-1 text-gray-400">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
