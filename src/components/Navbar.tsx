import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { BookOpen, Home, Code, CreditCard, Menu, X } from 'lucide-react';

const navLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/demo', label: 'Demo', icon: Code },
  { path: '/subscription', label: 'Subscribe', icon: CreditCard },
  { path: '/tutorials', label: 'Tutorials', icon: BookOpen },
];

export function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-dark-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/10 overflow-hidden">
              <img src="/assets/lazorkit_logo.png" alt="LazorKit" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">
              LazorKit Starter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${location.pathname === path
                  ? 'bg-dark-700 text-solana-teal'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Button */}
            <div className="hidden md:block">
              <WalletButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-dark-600/50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === path
                  ? 'bg-dark-700 text-solana-teal'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-dark-700">
              <WalletButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
