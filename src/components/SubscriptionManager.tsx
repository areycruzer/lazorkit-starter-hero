/**
 * SubscriptionManager - A beautiful one-click subscription flow
 * 
 * Features:
 * - Create Passkey Smart Wallet with one click
 * - Approve gasless USDC subscription (Devnet simulation)
 * - Session Keys dashboard with explanation
 * - Progress steps UI
 */

import { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  CreditCard, 
  Key, 
  Check, 
  Shield,
  Zap,
  RefreshCw,
  Clock,
  AlertCircle,
  Info,
  Loader2,
  Wallet,
  Calendar,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';
import { useLazor, LazorErrorCode } from '../context';
import type { LazorError } from '../context';

// ============================================================================
// TYPES
// ============================================================================

interface SessionKey {
  id: string;
  name: string;
  permissions: string[];
  expiresAt: Date;
  usageCount: number;
  maxUsage: number | null;
  isActive: boolean;
  createdAt: Date;
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

// ============================================================================
// MOCK DATA (Devnet Simulation)
// ============================================================================

// USDC Devnet mint address - used for production integration
const _USDC_DEVNET_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';
void _USDC_DEVNET_MINT; // Reserved for future use

const mockSessionKeys: SessionKey[] = [
  {
    id: 'sk_001',
    name: 'USDC Subscription',
    permissions: ['transfer:usdc', 'max:5'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    usageCount: 3,
    maxUsage: null,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

// ============================================================================
// COMPONENTS
// ============================================================================

export function SubscriptionManager() {
  const { 
    isConnected, 
    walletInfo, 
    isLoading,
    error,
    createPasskeyWallet,
    clearError,
  } = useLazor();

  const [currentStep, setCurrentStep] = useState<Step>('wallet');
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

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

  // Handle wallet creation
  const handleCreateWallet = async () => {
    try {
      await createPasskeyWallet('My Subscription Wallet');
    } catch (err) {
      // Error is already handled by the context
      console.error('Wallet creation failed:', err);
    }
  };

  // Handle subscription creation (simulated)
  const handleCreateSubscription = async () => {
    setIsCreatingSubscription(true);
    setSubscriptionError(null);

    try {
      // Simulate subscription creation with session key
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Create a session key with limited permissions
      // 2. Store the session key on-chain
      // 3. Set up recurring payment authorization
      
      setSessionKeys(mockSessionKeys);
      setSubscription(mockSubscription);
      setCurrentStep('dashboard');
    } catch (err) {
      setSubscriptionError('Failed to create subscription. Please try again.');
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = () => {
    setSubscription(null);
    setSessionKeys([]);
    setCurrentStep('subscription');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-700 border border-dark-500 mb-6">
          <Zap className="w-4 h-4 text-solana-teal" />
          <span className="text-sm text-gray-300">Gasless Subscriptions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">Subscription Manager</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Set up automatic payments using Session Keys. No biometric prompts for recurring charges—just one-time approval.
        </p>
      </div>

      {/* Progress Steps */}
      <ProgressSteps currentStep={currentStep} />

      {/* Error Display */}
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={clearError} 
        />
      )}

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 'wallet' && (
          <WalletStep 
            isLoading={isLoading}
            onCreateWallet={handleCreateWallet}
          />
        )}

        {currentStep === 'subscription' && (
          <SubscriptionStep
            walletAddress={walletInfo?.smartWallet.toBase58() || ''}
            isLoading={isCreatingSubscription}
            error={subscriptionError}
            onCreateSubscription={handleCreateSubscription}
          />
        )}

        {currentStep === 'dashboard' && subscription && (
          <DashboardStep
            subscription={subscription}
            sessionKeys={sessionKeys}
            onCancel={handleCancelSubscription}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS STEPS
// ============================================================================

function ProgressSteps({ currentStep }: { currentStep: Step }) {
  const steps = [
    { id: 'wallet', label: 'Create Wallet', icon: Wallet },
    { id: 'subscription', label: 'Approve Subscription', icon: CreditCard },
    { id: 'dashboard', label: 'Manage', icon: Key },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-solana-teal text-dark-900' 
                    : isCurrent 
                      ? 'bg-gradient-to-br from-solana-purple to-solana-teal text-white animate-pulse-glow' 
                      : 'bg-dark-700 text-gray-500 border border-dark-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`
                mt-2 text-xs font-medium hidden sm:block
                ${isCurrent ? 'text-white' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-0.5 mx-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-solana-teal' : 'bg-dark-600'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// WALLET STEP
// ============================================================================

function WalletStep({ 
  isLoading, 
  onCreateWallet 
}: { 
  isLoading: boolean;
  onCreateWallet: () => void;
}) {
  return (
    <div className="card max-w-lg mx-auto text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 border border-dark-500 flex items-center justify-center">
        <Fingerprint className="w-10 h-10 text-solana-purple" />
      </div>

      <h2 className="text-2xl font-bold mb-3">Create Your Smart Wallet</h2>
      
      <p className="text-gray-400 mb-6">
        Use your device's biometrics (FaceID, TouchID, or Windows Hello) to create a secure passkey wallet. No seed phrases needed!
      </p>

      <div className="space-y-4 mb-8">
        <FeatureItem 
          icon={Shield} 
          text="Hardware-level security with Secure Enclave" 
        />
        <FeatureItem 
          icon={Zap} 
          text="Gasless transactions—we cover the fees" 
        />
        <FeatureItem 
          icon={Key} 
          text="Session Keys for automatic payments" 
        />
      </div>

      <button
        onClick={onCreateWallet}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Wallet...
          </>
        ) : (
          <>
            <Fingerprint className="w-5 h-5" />
            One-Click Wallet Setup
          </>
        )}
      </button>

      <p className="mt-4 text-xs text-gray-500">
        Your private keys never leave your device
      </p>
    </div>
  );
}

// ============================================================================
// SUBSCRIPTION STEP
// ============================================================================

function SubscriptionStep({
  walletAddress,
  isLoading,
  error,
  onCreateSubscription,
}: {
  walletAddress: string;
  isLoading: boolean;
  error: string | null;
  onCreateSubscription: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Subscription Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-purple to-solana-teal flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Premium Plan</h3>
            <p className="text-sm text-gray-400">Gasless USDC Subscription</p>
          </div>
        </div>

        <div className="bg-dark-700 rounded-xl p-4 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-bold">$4.99</span>
            <span className="text-gray-400">USDC / month</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-solana-teal">
            <Zap className="w-4 h-4" />
            <span>Zero gas fees on all transactions</span>
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-solana-teal flex-shrink-0" />
            <span>Unlimited transactions</span>
          </li>
          <li className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-solana-teal flex-shrink-0" />
            <span>Priority support</span>
          </li>
          <li className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-solana-teal flex-shrink-0" />
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-solana-teal flex-shrink-0" />
            <span>Cancel anytime</span>
          </li>
        </ul>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={onCreateSubscription}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting Up Subscription...
            </>
          ) : (
            <>
              <Key className="w-5 h-5" />
              Approve with Session Key
            </>
          )}
        </button>
      </div>

      {/* Session Key Explainer */}
      <div className="card bg-gradient-to-br from-dark-800 to-dark-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-solana-purple/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-solana-purple" />
          </div>
          <h3 className="text-lg font-semibold">How Session Keys Work</h3>
        </div>

        <div className="space-y-6">
          <ExplainerStep
            number={1}
            title="One-Time Biometric Approval"
            description="You authenticate once with your passkey to create a limited-permission Session Key."
            icon={Fingerprint}
          />
          
          <ExplainerStep
            number={2}
            title="Session Key Created"
            description="A special key is generated that can ONLY perform specific actions—like transferring up to $5 USDC per month."
            icon={Key}
          />
          
          <ExplainerStep
            number={3}
            title="Automatic Charges"
            description="The app uses this Session Key to charge your subscription automatically. No biometric popup needed!"
            icon={RefreshCw}
          />
          
          <ExplainerStep
            number={4}
            title="Full Control"
            description="You can revoke the Session Key anytime, instantly stopping all automatic payments."
            icon={Shield}
          />
        </div>

        <div className="mt-6 p-4 bg-dark-900/50 rounded-xl border border-dark-500">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-solana-teal mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">Your Wallet Address</p>
              <p className="font-mono text-xs text-gray-400 break-all">
                {walletAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD STEP
// ============================================================================

function DashboardStep({
  subscription,
  sessionKeys,
  onCancel,
}: {
  subscription: Subscription;
  sessionKeys: SessionKey[];
  onCancel: () => void;
}) {
  const daysUntilCharge = Math.ceil(
    (subscription.nextCharge.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      {/* Active Subscription */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-teal to-solana-blue flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{subscription.name}</h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-solana-teal/20 text-solana-teal">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${subscription.amount}</p>
            <p className="text-sm text-gray-400">per {subscription.interval}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={Calendar}
            label="Next Charge"
            value={`${daysUntilCharge} days`}
            subtext={subscription.nextCharge.toLocaleDateString()}
          />
          <StatCard
            icon={DollarSign}
            label="Currency"
            value={subscription.currency}
            subtext="Devnet"
          />
          <StatCard
            icon={RefreshCw}
            label="Billing"
            value="Automatic"
            subtext="No prompts needed"
          />
        </div>

        <div className="flex gap-4">
          <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Pause Subscription
          </button>
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Session Keys Dashboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-solana-purple/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-solana-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Session Keys</h3>
              <p className="text-sm text-gray-400">Manage automatic payment permissions</p>
            </div>
          </div>
        </div>

        {/* Session Key Explainer Banner */}
        <div className="bg-gradient-to-r from-solana-purple/10 to-solana-teal/10 border border-solana-purple/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Unlock className="w-5 h-5 text-solana-teal mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white mb-1">
                Why no biometric prompts for charges?
              </p>
              <p className="text-sm text-gray-400">
                Session Keys are <span className="text-solana-teal">limited-permission keys</span> that 
                can only perform specific actions you've approved. They're stored securely and can 
                transfer up to your specified limit automatically. Your main passkey stays safe—Session 
                Keys can be revoked anytime without affecting your wallet.
              </p>
            </div>
          </div>
        </div>

        {/* Session Keys List */}
        <div className="space-y-4">
          {sessionKeys.map((key) => (
            <SessionKeyCard key={key.id} sessionKey={key} />
          ))}
        </div>

        {sessionKeys.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active Session Keys</p>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-solana-teal" />
            <h4 className="font-semibold">Security Model</h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-solana-teal mt-0.5 flex-shrink-0" />
              <span>Session Keys have spending limits ($5 max per transaction)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-solana-teal mt-0.5 flex-shrink-0" />
              <span>Keys expire automatically after 30 days</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-solana-teal mt-0.5 flex-shrink-0" />
              <span>Revoke anytime with your main passkey</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-solana-teal mt-0.5 flex-shrink-0" />
              <span>All actions logged on-chain for transparency</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-solana-purple" />
            <h4 className="font-semibold">How It Works</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-2 bg-dark-700 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-solana-purple/20 flex items-center justify-center text-xs font-bold text-solana-purple">1</span>
              <span className="text-gray-300">You approve a Session Key with limits</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-dark-700 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-solana-purple/20 flex items-center justify-center text-xs font-bold text-solana-purple">2</span>
              <span className="text-gray-300">App stores the key securely</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-dark-700 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-solana-teal/20 flex items-center justify-center text-xs font-bold text-solana-teal">3</span>
              <span className="text-gray-300">Automatic charges, no popups!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function FeatureItem({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-solana-teal" />
      </div>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}

function ExplainerStep({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: typeof Fingerprint;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-solana-purple/20 flex items-center justify-center text-sm font-bold text-solana-purple">
          {number}
        </div>
        {number < 4 && <div className="w-0.5 h-full bg-dark-600 mt-2" />}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-solana-teal" />
          <h4 className="font-medium text-white">{title}</h4>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="bg-dark-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

function SessionKeyCard({ sessionKey }: { sessionKey: SessionKey }) {
  const daysUntilExpiry = Math.ceil(
    (sessionKey.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-dark-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${sessionKey.isActive ? 'bg-solana-teal' : 'bg-gray-500'}`} />
          <span className="font-medium">{sessionKey.name}</span>
        </div>
        <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Revoke
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-1">Permissions</p>
          <div className="flex flex-wrap gap-1">
            {sessionKey.permissions.map((perm, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 text-xs bg-dark-600 rounded text-gray-300"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Usage</p>
          <p className="text-gray-300">
            {sessionKey.usageCount} {sessionKey.maxUsage ? `/ ${sessionKey.maxUsage}` : 'times'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Expires</p>
          <p className="text-gray-300">{daysUntilExpiry} days</p>
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ 
  error, 
  onDismiss 
}: { 
  error: LazorError;
  onDismiss: () => void;
}) {
  const getErrorIcon = () => {
    switch (error.code) {
      case LazorErrorCode.USER_CANCELLED:
        return <AlertCircle className="w-5 h-5" />;
      case LazorErrorCode.WEBAUTHN_NOT_SUPPORTED:
        return <Shield className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-lg mx-auto mb-6">
      <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="text-red-400 flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
        <button 
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SubscriptionManager;
