import { Github, Twitter, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-dark-600/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">
              Built with <span className="text-solana-purple">♥</span> using{' '}
              <span className="gradient-text font-semibold">LazorKit</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Passkey-Native Smart Wallet Starter
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-solana-teal transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Docs</span>
            </a>
            <a
              href="https://github.com/lazor-kit/lazor-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
            >
              <Github className="w-5 h-5 text-gray-400 hover:text-white" />
            </a>
            <a
              href="https://twitter.com/LazorKit"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
            >
              <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
