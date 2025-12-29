import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { Zap, BookOpen, Home, Code, CreditCard } from 'lucide-react';

const navLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/demo', label: 'Demo', icon: Code },
  { path: '/subscription', label: 'Subscribe', icon: CreditCard },
  { path: '/tutorials', label: 'Tutorials', icon: BookOpen },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple to-solana-teal flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">
              LazorKit Starter
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === path
                    ? 'bg-dark-700 text-solana-teal'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
