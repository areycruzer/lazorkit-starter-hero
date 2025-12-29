import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransferParams {
  recipient: string;
  amount: number; // in SOL
}

interface TransferResult {
  signature: string;
  success: boolean;
}

export function useTransfer() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = useCallback(
    async ({ recipient, amount }: TransferParams): Promise<TransferResult | null> => {
      if (!isConnected || !smartWalletPubkey) {
        setError('Wallet not connected');
        return null;
      }

      setIsTransferring(true);
      setError(null);

      try {
        const recipientPubkey = new PublicKey(recipient);
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: recipientPubkey,
          lamports,
        });

        const signature = await signAndSendTransaction({
          instructions: [instruction],
        });

        return { signature, success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transfer failed';
        setError(message);
        return null;
      } finally {
        setIsTransferring(false);
      }
    },
    [signAndSendTransaction, smartWalletPubkey, isConnected]
  );

  return {
    transfer,
    isTransferring,
    error,
    clearError: () => setError(null),
  };
}
