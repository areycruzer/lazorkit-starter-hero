import { Link } from 'react-router-dom';
import { useWallet } from '@lazorkit/wallet';
import { 
  Fingerprint, 
  Zap, 
  Shield, 
  Wallet, 
  ArrowRight, 
  Code,
  BookOpen,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Fingerprint,
    title: 'Passkey Authentication',
    description: 'Use FaceID, TouchID, or Windows Hello. No seed phrases to manage.',
    color: 'from-solana-purple to-solana-blue',
  },
  {
    icon: Shield,
    title: 'Hardware-Level Security',
    description: 'Keys stored in device Secure Enclave. Never exposed to the web.',
    color: 'from-solana-teal to-solana-blue',
  },
  {
    icon: Wallet,
    title: 'Smart Wallets',
    description: 'Programmable accounts with spending limits, session keys, and recovery.',
    color: 'from-solana-purple to-solana-teal',
  },
  {
    icon: Zap,
    title: 'Gasless Transactions',
    description: 'Built-in Paymaster sponsors fees. Users don\'t need SOL to start.',
    color: 'from-yellow-500 to-solana-teal',
  },
];

export function HomePage() {
  const { connect, isConnected, isConnecting } = useWallet();

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-solana-purple/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-solana-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-solana-blue/20 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-700 border border-dark-500 mb-8">
            <Sparkles className="w-4 h-4 text-solana-teal" />
            <span className="text-sm text-gray-300">Production-Ready Solana Starter Template</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Build Web3 Apps with{' '}
            <span className="gradient-text">Passkey Wallets</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            A production-ready starter template for Solana developers. 
            Integrate LazorKit's seedless smart wallets in minutes with 
            beautiful UI and best practices built-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <Link to="/demo" className="btn-primary flex items-center gap-2">
                <Code className="w-5 h-5" />
                Try Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => connect()}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2 animate-pulse-glow"
              >
                <Fingerprint className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Get Started with Passkey'}
              </button>
            )}
            <Link to="/tutorials" className="btn-secondary flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              View Tutorials
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card group cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Simple <span className="gradient-text">Integration</span>
          </h2>
          <p className="text-gray-400">Get started with just a few lines of code</p>
        </div>

        <div className="code-block max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dark-600">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-gray-500 text-sm">App.tsx</span>
          </div>
          <pre className="text-sm leading-relaxed overflow-x-auto">
            <code>
              <span className="text-solana-purple">import</span>
              <span className="text-white">{' { '}</span>
              <span className="text-solana-teal">useWallet</span>
              <span className="text-white">{' } '}</span>
              <span className="text-solana-purple">from</span>
              <span className="text-yellow-300">{" '@lazorkit/wallet'"}</span>
              <span className="text-gray-500">;</span>
              {'\n\n'}
              <span className="text-solana-purple">function</span>
              <span className="text-solana-blue">{' App'}</span>
              <span className="text-white">{'() {'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-solana-purple">const</span>
              <span className="text-white">{' { connect, signAndSendTransaction } = '}</span>
              <span className="text-solana-teal">useWallet</span>
              <span className="text-white">{'();'}</span>
              {'\n\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-solana-purple">return</span>
              <span className="text-white">{' ('}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-gray-500">{'<'}</span>
              <span className="text-solana-teal">button</span>
              <span className="text-solana-blue">{' onClick'}</span>
              <span className="text-white">{'={'}</span>
              <span className="text-white">{'() => '}</span>
              <span className="text-solana-teal">connect</span>
              <span className="text-white">{'()'}</span>
              <span className="text-white">{'}'}</span>
              <span className="text-gray-500">{'>'}</span>
              {'\n'}
              <span className="text-white">{'      Connect Wallet'}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-gray-500">{'</'}</span>
              <span className="text-solana-teal">button</span>
              <span className="text-gray-500">{'>'}</span>
              {'\n'}
              <span className="text-white">{'  );'}</span>
              {'\n'}
              <span className="text-white">{'}'}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card bg-gradient-to-r from-dark-800 to-dark-700 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            This starter template includes everything you need: React hooks, 
            pre-built components, tutorials, and TypeScript support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/tutorials" className="btn-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Start Learning
            </Link>
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              Full Documentation
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
