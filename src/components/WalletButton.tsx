import { useWallet } from '@lazorkit/wallet';
import { Fingerprint, LogOut, Wallet, Loader2 } from 'lucide-react';

export function WalletButton() {
  const { connect, disconnect, isConnected, isConnecting, smartWalletPubkey } = useWallet();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button className="btn-primary flex items-center gap-2 opacity-70 cursor-wait" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && smartWalletPubkey) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 bg-solana-teal rounded-full animate-pulse" />
          <span className="font-mono text-sm text-gray-300">
            {truncateAddress(smartWalletPubkey.toBase58())}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-3 rounded-xl bg-dark-700 border border-dark-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
          title="Disconnect"
        >
          <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect()}
      className="btn-primary flex items-center gap-2 animate-pulse-glow"
    >
      <Fingerprint className="w-5 h-5" />
      Connect with Passkey
    </button>
  );
}

export function WalletCard() {
  const { isConnected, smartWalletPubkey, wallet } = useWallet();

  if (!isConnected || !smartWalletPubkey) {
    return (
      <div className="card text-center">
        <Wallet className="w-16 h-16 mx-auto mb-4 text-dark-500" />
        <h3 className="text-xl font-semibold mb-2">No Wallet Connected</h3>
        <p className="text-gray-400">Connect your passkey wallet to get started</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solana-purple to-solana-teal flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Smart Wallet</h3>
          <p className="text-gray-400 text-sm">Passkey Protected</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-dark-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wallet Address</p>
          <p className="font-mono text-sm text-solana-teal break-all">
            {smartWalletPubkey.toBase58()}
          </p>
        </div>

        {wallet?.credentialId && (
          <div className="bg-dark-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Credential ID</p>
            <p className="font-mono text-xs text-gray-400 break-all">
              {wallet.credentialId.slice(0, 32)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
