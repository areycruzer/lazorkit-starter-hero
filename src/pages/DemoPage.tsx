import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { WalletCard } from '../components';
import { useSignMessage } from '../hooks';
import { 
  Send, 
  PenTool, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';

export function DemoPage() {
  const { isConnected, connect, isConnecting } = useWallet();
  const { sign, isSigning, lastSignature, error: signError } = useSignMessage();
  
  const [messageToSign, setMessageToSign] = useState('Hello from LazorKit Starter!');
  const [copied, setCopied] = useState(false);

  const handleSign = async () => {
    await sign(messageToSign);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Interactive Demo</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to try the demo features</p>
          <button
            onClick={() => connect()}
            disabled={isConnecting}
            className="btn-primary animate-pulse-glow"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Interactive</span> Demo
        </h1>
        <p className="text-gray-400">
          Test LazorKit features with your connected passkey wallet
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Wallet Info */}
        <div className="lg:col-span-1">
          <WalletCard />
        </div>

        {/* Demo Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sign Message */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple to-solana-blue flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Sign Message</h3>
                <p className="text-sm text-gray-400">Cryptographically sign a message with your passkey</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Message to Sign</label>
                <textarea
                  value={messageToSign}
                  onChange={(e) => setMessageToSign(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-500 rounded-xl p-4 text-white focus:border-solana-purple focus:outline-none resize-none"
                  rows={3}
                  placeholder="Enter a message to sign..."
                />
              </div>

              <button
                onClick={handleSign}
                disabled={isSigning || !messageToSign}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing with Passkey...
                  </>
                ) : (
                  <>
                    <PenTool className="w-5 h-5" />
                    Sign Message
                  </>
                )}
              </button>

              {signError && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{signError}</span>
                </div>
              )}

              {lastSignature && (
                <div className="bg-dark-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-solana-teal">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Message Signed Successfully!</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Signature</span>
                      <button
                        onClick={() => copyToClipboard(lastSignature.signature)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-mono text-xs text-gray-300 break-all bg-dark-900 p-2 rounded-lg">
                      {lastSignature.signature.slice(0, 64)}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Demo (Placeholder) */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-teal to-solana-blue flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Send Transaction</h3>
                <p className="text-sm text-gray-400">Transfer SOL with gasless transactions</p>
              </div>
            </div>

            <div className="bg-dark-700 rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-4">
                Transaction demo coming soon! Check the tutorials for implementation details.
              </p>
              <a
                href="https://docs.lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-solana-teal hover:text-solana-blue transition-colors"
              >
                <span>View Documentation</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-8 right-8 bg-solana-teal text-dark-900 px-4 py-2 rounded-xl font-semibold animate-pulse">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
