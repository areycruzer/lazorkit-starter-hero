import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { 
  BookOpen, 
  Code, 
  Wallet, 
  ArrowRight,
  Clock,
  Zap,
  Shield,
  Send,
  Fingerprint,
  Sparkles
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  icon: LucideIcon;
  topics: string[];
  featured?: boolean;
}

const tutorials: Tutorial[] = [
  {
    id: 'passkey-wallet-setup',
    title: 'From Seed Phrases to FaceID',
    description: 'Understand why passkeys are the future and set up your first LazorKit wallet with biometrics',
    difficulty: 'Beginner',
    time: '10 min',
    icon: Fingerprint,
    topics: ['Passkeys vs Seeds', 'secp256r1 Curve', 'S-Normalization', 'WebAuthn'],
    featured: true,
  },
  {
    id: 'gasless-transactions',
    title: 'Going Gasless: Sponsor USDC Transactions',
    description: 'Learn how smart wallets enable fee sponsorship and send USDC without needing SOL',
    difficulty: 'Intermediate',
    time: '12 min',
    icon: Sparkles,
    topics: ['Paymaster', 'Transaction Sizing', 'Authorization', 'Business Models'],
    featured: true,
  },
  {
    id: 'getting-started',
    title: 'Getting Started with LazorKit',
    description: 'Set up your first passkey wallet integration in under 5 minutes',
    difficulty: 'Beginner',
    time: '5 min',
    icon: Zap,
    topics: ['Installation', 'Provider Setup', 'Basic Connection'],
  },
  {
    id: 'wallet-integration',
    title: 'Complete Wallet Integration',
    description: 'Build a full wallet experience with connect, disconnect, and account display',
    difficulty: 'Beginner',
    time: '15 min',
    icon: Wallet,
    topics: ['useWallet Hook', 'Connection States', 'Error Handling'],
  },
  {
    id: 'sign-messages',
    title: 'Signing Messages',
    description: 'Implement cryptographic message signing for authentication and verification',
    difficulty: 'Intermediate',
    time: '10 min',
    icon: Shield,
    topics: ['signMessage API', 'Verification', 'Use Cases'],
  },
  {
    id: 'transactions',
    title: 'Sending Transactions',
    description: 'Transfer SOL and tokens with gasless transaction support',
    difficulty: 'Intermediate',
    time: '20 min',
    icon: Send,
    topics: ['signAndSendTransaction', 'Paymaster', 'Token Transfers'],
  },
];

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function TutorialsPage() {
  const featuredTutorials = tutorials.filter(t => t.featured);
  const regularTutorials = tutorials.filter(t => !t.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-purple to-solana-teal flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold">
            <span className="gradient-text">Tutorials</span>
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Step-by-step guides to master LazorKit integration
        </p>
      </div>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-solana-purple" />
            Featured Guides
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredTutorials.map((tutorial) => (
              <Link
                key={tutorial.id}
                to={`/tutorials/${tutorial.id}`}
                className="card group block relative overflow-hidden border-2 border-solana-purple/30 hover:border-solana-purple/60"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-solana-purple to-solana-teal text-xs font-semibold text-white rounded-bl-lg">
                  Featured
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-solana-purple/30 to-solana-teal/30 border border-solana-purple/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <tutorial.icon className="w-7 h-7 text-solana-teal" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${difficultyColors[tutorial.difficulty]}`}>
                        {tutorial.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {tutorial.time}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-solana-teal transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {tutorial.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tutorial.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-dark-700 rounded-lg text-gray-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-solana-teal group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Tutorials */}
      <h2 className="text-xl font-semibold mb-6">All Tutorials</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {regularTutorials.map((tutorial) => (
          <Link
            key={tutorial.id}
            to={`/tutorials/${tutorial.id}`}
            className="card group block"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 border border-dark-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <tutorial.icon className="w-6 h-6 text-solana-teal" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${difficultyColors[tutorial.difficulty]}`}>
                    {tutorial.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {tutorial.time}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-solana-teal transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {tutorial.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tutorial.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-dark-700 rounded-lg text-gray-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-solana-teal group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Reference */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Quick Reference</h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-solana-purple" />
              <h3 className="text-lg font-semibold">Provider Setup</h3>
            </div>
            <div className="code-block">
              <pre className="text-sm">
                <code>{`import { LazorkitProvider } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      <YourApp />
    </LazorkitProvider>
  );
}`}</code>
              </pre>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-solana-teal" />
              <h3 className="text-lg font-semibold">useWallet Hook</h3>
            </div>
            <div className="code-block">
              <pre className="text-sm">
                <code>{`import { useWallet } from '@lazorkit/wallet';

function WalletComponent() {
  const {
    connect,
    disconnect,
    isConnected,
    smartWalletPubkey,
    signMessage,
    signAndSendTransaction,
  } = useWallet();
  
  // Your wallet logic here
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
