import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Fingerprint, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WalletButton() {
  const { connect, disconnect, isConnected, isConnecting, smartWalletPubkey } = useWallet();
  const [showWelcome, setShowWelcome] = useState(false);

  // Shortened address for display
  const shortAddress = smartWalletPubkey
    ? `${smartWalletPubkey.toBase58().slice(0, 4)}...${smartWalletPubkey.toBase58().slice(-4)}`
    : '';

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-600"
        >
          <div className="w-2 h-2 rounded-full bg-solana-green animate-pulse" />
          <span className="text-sm font-mono text-gray-300">{shortAddress}</span>
        </motion.div>

        <button
          onClick={disconnect}
          className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowWelcome(true)}
        disabled={isConnecting}
        className={`
          relative overflow-hidden group btn-primary 
          ${isConnecting ? 'cursor-wait opacity-90' : ''}
        `}
      >
        {isConnecting ? (
          <>
            <div className="absolute inset-0 animate-scanline pointer-events-none" />
            <Fingerprint className="w-5 h-5 animate-pulse" />
            <span className="font-medium">Verifying Biometrics...</span>
          </>
        ) : (
          <>
            <Fingerprint className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {/* Mobile Text */}
            <span className="md:hidden">Sign In</span>
            {/* Desktop Text */}
            <span className="hidden md:inline">Create Account</span>
          </>
        )}
      </button>

      {/* Welcome / Onboarding Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-solana-purple/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-solana-purple" />
                </div>

                <h3 className="text-xl font-bold mb-2">Create Passkey Wallet</h3>
                <p className="text-gray-400 mb-6">
                  LazorKit uses your device's biometrics (FaceID, TouchID) to create a secure, non-custodial wallet. No seed phrases to lose.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      try {
                        setShowWelcome(false);
                        await connect();
                      } catch (error: any) {
                        console.error('Connection failed:', error);

                        // Handle common WebAuthn errors
                        if (error.name === 'NotAllowedError' || error.message?.includes('not allowed')) {
                          alert("Passkey access denied. \n\nIf you're on Brave:\n1. Check the 'Lion' shield icon in URL bar\n2. Allow 'Device Recognition'\n3. Or try Chrome/Safari.");
                        } else if (error.name === 'SecurityError') {
                          alert("Security Error: Passkeys require HTTPS or localhost.");
                        } else {
                          alert(`Connection failed: ${error.message}`);
                        }

                        // Re-open welcome to let them try again
                        setShowWelcome(true);
                      }
                    }}
                    className="w-full btn-primary justify-center py-3"
                  >
                    <Fingerprint className="w-5 h-5" />
                    Continue with Biometrics
                  </button>

                  <button
                    onClick={() => setShowWelcome(false)}
                    className="w-full py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 bg-dark-800 border-t border-dark-700 text-xs text-center text-gray-500">
                Powered by Solana Network &bull; Secure Enclave Technology
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
