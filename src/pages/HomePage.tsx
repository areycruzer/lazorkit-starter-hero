import { Link } from 'react-router-dom';
import { useWallet } from '@lazorkit/wallet';
import {
  Fingerprint,
  Zap,
  Shield,
  Code,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from '../components/ui/BentoCard';
import { Badge } from '../components/ui/Badge';
import { CodeWindow } from '../components/ui/CodeWindow';
import { WalletButton } from '../components/WalletButton';

export function HomePage() {
  const { isConnected } = useWallet();

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-solana-purple/20 to-transparent blur-3xl" />
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        {/* Header Content */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <Badge label="Powered by Solana Network" variant="solana" showDot />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight"
          >
            Auth for the <br />
            <span className="gradient-text-brand">Next Billion Users</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A production-ready starter kit. Integrate hardware-backed passkeys,
            sponsored transactions, and smart accounts in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {!isConnected && (
              <div className="w-full sm:w-auto">
                <WalletButton />
              </div>
            )}

            {isConnected && (
              <Link to="/demo" className="btn-primary w-full sm:w-auto">
                <Code className="w-5 h-5" />
                Live Demo
              </Link>
            )}

            <Link to="/tutorials" className="btn-secondary w-full sm:w-auto">
              <BookOpen className="w-5 h-5" />
              Documentation
            </Link>
          </motion.div>
        </div>

        {/* Bento Grid Features */}
        <div className="bento-grid">
          <BentoCard
            title="Biometric Authentication"
            icon={Fingerprint}
            className="col-span-1 md:col-span-2"
            delay={0.4}
          >
            <p className="mb-4">
              Replace seed phrases with FaceID, TouchID, and Windows Hello.
              Keys are stored in the device's Secure Enclave, providing bank-grade security.
            </p>
            <div className="mt-auto h-32 bg-gradient-to-br from-solana-purple/10 to-transparent rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
              <Fingerprint className="w-16 h-16 text-solana-purple/50" />
            </div>
          </BentoCard>

          <BentoCard
            title="Zero-Gas Experience"
            icon={Zap}
            delay={0.5}
          >
            <p className="mb-4">
              Built-in Paymaster support. Sponsor transaction fees for your users
              so they don't need SOL to get started.
            </p>
            <div className="flex items-center gap-2 text-solana-green font-mono text-sm bg-solana-green/5 p-2 rounded-lg border border-solana-green/10">
              <Zap className="w-4 h-4" />
              <span>Gas: $0.00 (Sponsored)</span>
            </div>
          </BentoCard>

          <BentoCard
            title="Smart Accounts"
            icon={Shield}
            delay={0.6}
          >
            <p>
              Programmable wallets with session keys, spending limits, and
              social recovery options.
            </p>
          </BentoCard>

          <BentoCard
            title="Developer Friendly"
            icon={Code}
            className="col-span-1 md:col-span-2"
            delay={0.7}
          >
            <p className="mb-6">
              Full TypeScript support, React hooks, and comprehensive documentation.
              Get started with just a few lines of code.
            </p>
            <CodeWindow
              code="const { connect } = useWallet();"
              language="typescript"
              title="React Hook"
              className="mt-6"
            />
          </BentoCard>
        </div>
      </section>
    </div>
  );
}
