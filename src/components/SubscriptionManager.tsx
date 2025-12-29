import { useState, useEffect } from 'react';
import {
  Fingerprint,
  CreditCard,
  Key,
  Check,
  Zap,
  Info,
  Loader2,
} from 'lucide-react';
import { useWallet } from '@lazorkit/wallet';
import { SuccessCelebration } from './SuccessCelebration';
import { Badge } from './ui/Badge';
import { BentoCard } from './ui/BentoCard';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface SessionKey {
  id: string;
  name: string;
  permissions: string[];
  expiresAt: Date;
  usageCount: number;
  maxUsage: number | null;
  isActive: boolean;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly';
  nextCharge: Date;
  sessionKeyId: string;
  status: 'active' | 'paused' | 'cancelled';
}

type Step = 'wallet' | 'subscription' | 'dashboard';

const mockSessionKeys: SessionKey[] = [
  {
    id: 'sk_001',
    name: 'USDC Subscription',
    permissions: ['transfer:usdc', 'max:5'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    usageCount: 3,
    maxUsage: null,
    isActive: true,
  },
];

const mockSubscription: Subscription = {
  id: 'sub_001',
  name: 'Premium Plan',
  amount: 4.99,
  currency: 'USDC',
  interval: 'monthly',
  nextCharge: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
  sessionKeyId: 'sk_001',
  status: 'active',
};

export function SubscriptionManager() {
  const { isConnected, connect, isConnecting } = useWallet();

  const [currentStep, setCurrentStep] = useState<Step>('wallet');
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('');

  // Determine current step based on state
  useEffect(() => {
    if (!isConnected) {
      setCurrentStep('wallet');
    } else if (!subscription) {
      setCurrentStep('subscription');
    } else {
      setCurrentStep('dashboard');
    }
  }, [isConnected, subscription]);

  // Trigger celebration helper
  const triggerCelebration = (title: string, subtitle: string) => {
    setCelebrationTitle(title);
    setCelebrationSubtitle(subtitle);
    setShowCelebration(true);
  };

  const handleCreateWallet = async () => {
    await connect();
    triggerCelebration('Wallet Connected!', 'Your passkey wallet is ready.');
  };

  const handleCreateSubscription = async () => {
    setIsCreatingSubscription(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSessionKeys(mockSessionKeys);
      setSubscription(mockSubscription);
      setCurrentStep('dashboard');
      triggerCelebration('Subscription Active!', 'Recurring payments enabled via Session Key.');
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleCancelSubscription = () => {
    setSubscription(null);
    setSessionKeys([]);
    setCurrentStep('subscription');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge label="Gasless Subscriptions" variant="solana" />
        <h1 className="text-4xl font-bold mt-6 mb-4">
          Subscription <span className="gradient-text-brand">Manager</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Set up automatic payments using Session Keys. No biometric prompts for recurring charges—just one-time approval.
        </p>
      </div>

      {/* Progress */}
      <div className="flex justify-center mb-16">
        <div className="flex items-center gap-4">
          <StepIndicator step="wallet" current={currentStep} label="Connect Wallet" />
          <div className="w-12 h-px bg-dark-600" />
          <StepIndicator step="subscription" current={currentStep} label="Approve Plan" />
          <div className="w-12 h-px bg-dark-600" />
          <StepIndicator step="dashboard" current={currentStep} label="Dashboard" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'wallet' && (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="glass-panel max-w-lg mx-auto p-12 rounded-3xl">
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-solana-purple/20 to-solana-green/20 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-solana-purple" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Create Your Account</h2>
              <p className="text-gray-400 mb-8">
                Bank-grade security with your device's Secure Enclave. Zero fees.
              </p>
              <button onClick={handleCreateWallet} className="btn-primary w-full py-4 text-lg">
                {isConnecting ? <Loader2 className="animate-spin" /> : <Fingerprint className="w-5 h-5" />}
                {isConnecting ? 'Verifying...' : 'Continue with Biometrics'}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'subscription' && (
          <motion.div
            key="subscription"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-2 gap-8"
          >
            {/* Plan Card */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Premium Plan</h3>
                  <p className="text-gray-400 text-sm">Gasless USDC Subscription</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-4xl font-bold mb-2">$4.99 <span className="text-lg text-gray-500 font-normal">/ month</span></div>
                <div className="flex items-center gap-2 text-solana-green text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Zero gas fees on all transactions</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {['Unlimited transactions', 'Priority support', 'Advanced analytics', 'Cancel anytime'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-solana-green/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-solana-green" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreateSubscription}
                disabled={isCreatingSubscription}
                className="btn-primary w-full py-4"
              >
                {isCreatingSubscription ? <Loader2 className="animate-spin" /> : <Key className="w-5 h-5" />}
                {isCreatingSubscription ? 'Creating Session Key...' : 'Approve with Session Key'}
              </button>
            </div>

            {/* Explainer */}
            <div className="space-y-6">
              <BentoCard title="How Session Keys Work" icon={Info}>
                <div className="space-y-6 mt-4">
                  <ExplainerStep
                    number={1}
                    title="One-Time Biometric Approval"
                    desc="You authenticate once to create a limited-permission Session Key."
                  />
                  <ExplainerStep
                    number={2}
                    title="Automatic Charges"
                    desc="The app uses this key to charge your subscription automatically. No popups!"
                  />
                  <ExplainerStep
                    number={3}
                    title="Full Control"
                    desc="Revoke the key anytime instantly stopping all payments."
                  />
                </div>
              </BentoCard>
            </div>
          </motion.div>
        )}

        {currentStep === 'dashboard' && subscription && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel p-8 rounded-3xl">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-solana-green to-solana-blue flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{subscription.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-solana-green/20 text-solana-green text-xs font-semibold">Active</span>
                      <span className="text-gray-400 text-sm">Next charge: {subscription.nextCharge.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${subscription.amount}</div>
                  <div className="text-gray-400">USDC / {subscription.interval}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="btn-secondary flex-1">Pause Subscription</button>
                <button onClick={handleCancelSubscription} className="btn-secondary flex-1 hover:border-red-500/50 hover:text-red-400">Cancel</button>
              </div>
            </div>

            <BentoCard title="Active Session Keys" icon={Key}>
              {sessionKeys.map(key => (
                <div key={key.id} className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-solana-green animate-pulse" />
                    <div>
                      <div className="font-medium text-white">{key.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{key.permissions.join(', ')}</div>
                    </div>
                  </div>
                  <button className="text-xs text-red-400 hover:text-white transition-colors">Revoke</button>
                </div>
              ))}
            </BentoCard>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessCelebration
        show={showCelebration}
        title={celebrationTitle}
        subtitle={celebrationSubtitle}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
}

function StepIndicator({ step, current, label }: { step: Step, current: Step, label: string }) {
  const steps = ['wallet', 'subscription', 'dashboard'];
  const idx = steps.indexOf(step);
  const currentIdx = steps.indexOf(current);
  const isCompleted = idx < currentIdx;
  const isCurrent = idx === currentIdx;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
            ${isCompleted ? 'bg-solana-green border-solana-green text-black' :
          isCurrent ? 'border-solana-purple text-solana-purple shadow-[0_0_15px_rgba(153,69,255,0.3)]' :
            'border-dark-600 text-dark-600'}
         `}>
        {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
      </div>
      <span className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

function ExplainerStep({ number, title, desc }: { number: number, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
