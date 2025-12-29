import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';

interface SignResult {
  signature: string;
  signedPayload: string;
}

export function useSignMessage() {
  const { signMessage, isConnected } = useWallet();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<SignResult | null>(null);

  const sign = useCallback(
    async (message: string): Promise<SignResult | null> => {
      if (!isConnected) {
        setError('Wallet not connected');
        return null;
      }

      setIsSigning(true);
      setError(null);

      try {
        const result = await signMessage(message);
        setLastSignature(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Signing failed';
        setError(errorMessage);
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [signMessage, isConnected]
  );

  return {
    sign,
    isSigning,
    error,
    lastSignature,
    clearError: () => setError(null),
  };
}
