import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { LazorkitProvider } from '@lazorkit/wallet';

// Configuration for LazorKit
const LAZORKIT_CONFIG = {
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com',
  portalUrl: import.meta.env.VITE_PORTAL_URL || 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: import.meta.env.VITE_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com',
  },
};

interface WalletProviderProps {
  children: ReactNode;
}

// Extended context for app-specific wallet state
interface WalletContextType {
  config: typeof LAZORKIT_CONFIG;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <WalletContext.Provider value={{ config: LAZORKIT_CONFIG }}>
        {children}
      </WalletContext.Provider>
    </LazorkitProvider>
  );
}

export function useWalletConfig() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletConfig must be used within a WalletProvider');
  }
  return context;
}

export { LAZORKIT_CONFIG };
