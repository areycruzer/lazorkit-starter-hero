import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';


interface CodeWindowProps {
    code: string;
    language?: string;
    title?: string;
    showLineNumbers?: boolean;
    className?: string;
}

export function CodeWindow({
    code,
    language = 'typescript',
    title = 'Terminal',
    showLineNumbers = true,
    className = ''
}: CodeWindowProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = code.trim().split('\n');

    return (
        <div className={`glass-card rounded-xl overflow-hidden border border-white/10 shadow-2xl ${className}`}>
            {/* Window Header / Titlebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-dark-800/80 border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    {/* Traffic Lights */}
                    <div className="flex gap-1.5 mr-4">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
                    </div>

                    {/* Title / Icon */}
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{title}</span>
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    {copied ? <Check className="w-4 h-4 text-solana-green" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto bg-[#0D0D0D] font-mono text-sm leading-relaxed">
                <table className="w-full border-collapse">
                    <tbody>
                        {lines.map((line, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                {showLineNumbers && (
                                    <td className="w-8 pr-4 text-right select-none text-gray-600 text-xs py-0.5">
                                        {i + 1}
                                    </td>
                                )}
                                <td className="py-0.5 pl-2 text-gray-300 whitespace-pre">
                                    {/* Basic Syntax Highlighting Logic (can be enhanced or replaced with Prism) */}
                                    <HighlightedLine line={line} language={language} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Simple highlighter for demo purposes
// In production, use prism-react-renderer or similar
function HighlightedLine({ line }: { line: string, language?: string }) {
    // Very basic regex-based highlighting
    const parts = line.split(/(\s+|[(){}[\]=,;])/g);

    return (
        <>
            {parts.map((part, i) => {
                let color = 'text-gray-300';

                // Keywords
                if (/^(import|export|const|let|var|function|return|if|else|for|while|await|async|try|catch)$/.test(part)) {
                    color = 'text-solana-purple';
                }
                // Types
                else if (/^[A-Z][a-zA-Z0-9]*$/.test(part)) {
                    color = 'text-[#E5C07B]'; // Yellow-ish for types
                }
                // Strings
                else if (/^['"`]/.test(part) || /['"`]$/.test(part)) {
                    color = 'text-solana-green';
                }
                // Comments
                else if (part.startsWith('//')) {
                    color = 'text-gray-500 italic';
                }

                return <span key={i} className={color}>{part}</span>;
            })}
        </>
    );
}
