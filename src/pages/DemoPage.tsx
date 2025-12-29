import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Terminal,
  Send,
  Shield,
  Zap,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/Badge';

// Types
interface DebugLogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
  data?: any;
}

const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';

export function DemoPage() {
  const {
    isConnected,
    signMessage,
    signAndSendTransaction,
    smartWalletPubkey
  } = useWallet();

  // State
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  // Inputs
  const [messageInput, setMessageInput] = useState('Hello LazorKit!');
  const [amountInput, setAmountInput] = useState('0.001');
  const [recipientInput, setRecipientInput] = useState(''); // Empty initially, defaults to self

  const [balance, setBalance] = useState<number | null>(null);

  // Fetch Balance
  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    try {
      const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
      const bal = await connection.getBalance(smartWalletPubkey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error('Failed to fetch balance', e);
    }
  }, [smartWalletPubkey]);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchBalance]);

  // Helper to add logs
  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, data?: any) => {
    const entry: DebugLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    setDebugLogs(prev => [entry, ...prev]);
  }, []);

  // Clear logs
  const clearLogs = () => setDebugLogs([]);

  // Trigger Confetti
  const triggerSuccess = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9945FF', '#14F195', '#007AFF']
    });
  };

  // Actions
  const handleSignMessage = async () => {
    if (!isConnected) {
      addLog('error', 'Wallet not connected');
      return;
    }

    try {
      setLoadingAction('sign');
      addLog('info', 'Initiating message signature...', { message: messageInput });

      const result = await signMessage(messageInput);

      addLog('success', 'Message signed successfully', { signature: result.signature });

      setLastSignature(result.signature);
      triggerSuccess();
    } catch (error: any) {
      console.error(error);
      addLog('error', 'Failed to sign message', { error: error.message || 'Unknown error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendTransaction = async () => {
    if (!isConnected || !smartWalletPubkey) {
      addLog('error', 'Wallet not connected');
      return;
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      addLog('error', 'Invalid amount');
      return;
    }

    if (amount > 2) {
      addLog('error', 'Amount exceeds maximum limit of 2 SOL');
      return;
    }

    try {
      setLoadingAction('tx');

      const recipientKey = recipientInput
        ? new PublicKey(recipientInput)
        : smartWalletPubkey;

      addLog('info', 'Preparing transaction...', {
        amount: `${amountInput} SOL`,
        recipient: recipientInput ? 'External Address' : 'Self (Demo)',
        address: recipientKey.toBase58()
      });

      // Construct instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientKey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      addLog('info', 'Requesting wallet signature...');

      // Use LazorKit's simplified send hook which handles blockhash/signing/sending
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        // options can be used for compute units etc.
      });

      addLog('success', 'Transaction sent!', {
        signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      });

      setLastSignature(signature);
      triggerSuccess();

      // Optional: Confirm logic
      if (signature) {
        addLog('info', 'Confirming transaction...');
        const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
        await connection.confirmTransaction(signature, 'confirmed');
        addLog('success', 'Transaction confirmed on-chain');
      }

    } catch (error: any) {
      console.error(error);
      addLog('error', 'Transaction failed', { error: error.message || 'Unknown error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAirdrop = async () => {
    if (!smartWalletPubkey) {
      addLog('error', 'Wallet not connected');
      return;
    }

    try {
      setLoadingAction('airdrop');
      addLog('info', 'Requesting 1 SOL Airdrop...', { address: smartWalletPubkey.toBase58() });

      const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
      const signature = await connection.requestAirdrop(smartWalletPubkey, 1 * LAMPORTS_PER_SOL);

      addLog('info', 'Airdrop requested, confirming...');
      await connection.confirmTransaction(signature, 'confirmed');

      addLog('success', 'Airdrop successful! You received 1 SOL.');
      triggerSuccess();
    } catch (error: any) {
      console.error(error);
      addLog('error', 'Airdrop failed', { error: error.message || 'Rate limit exceeded? Try faucet.solana.com' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <Badge label="Interactive Demo" variant="solana" />
          <h1 className="text-4xl font-bold mt-4">Smart Wallet Playground</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-400">Test real transactions and signatures on Solana Devnet.</p>
            <span className="text-xs font-mono text-solana-teal bg-solana-teal/10 px-2 py-0.5 rounded border border-solana-teal/20">v2.0 Live</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAirdrop}
            disabled={!isConnected || !!loadingAction}
            className="flex items-center gap-2 bg-solana-blue/10 text-solana-blue border border-solana-blue/20 px-4 py-2 rounded-xl hover:bg-solana-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loadingAction === 'airdrop' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            Get Devnet SOL
          </button>

          <div className="flex items-center gap-3 bg-dark-800 p-2 rounded-xl border border-dark-600">
            <span className={`text-sm font-medium ${debugMode ? 'text-white' : 'text-gray-500'}`}>
              Debug Mode
            </span>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${debugMode ? 'bg-solana-green' : 'bg-dark-600'
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${debugMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Actions Column */}
        <div className="space-y-6">
          {/* Wallet Balance Card */}
          {isConnected && (
            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-solana-blue/20 rounded-xl text-solana-blue border border-solana-blue/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Wallet Balance</h3>
                  <p className="text-2xl font-bold font-mono">
                    {balance !== null ? balance.toFixed(4) : '---'} <span className="text-sm text-gray-500">SOL</span>
                  </p>
                </div>
              </div>
              <button
                onClick={fetchBalance}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                title="Refresh Balance"
              >
                <ArrowRight className="w-4 h-4 text-gray-400 rotate-[-45deg]" />
              </button>
            </div>
          )}

          {/* Sign Message Card */}
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <Shield className="w-24 h-24 text-white/5" />
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="p-3 bg-solana-purple/20 rounded-xl text-solana-purple border border-solana-purple/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Sign Message</h3>
                <p className="text-gray-400 text-sm"> Authenticate without fees</p>
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-xl p-4 mb-6 border border-white/5">
              <label className="text-xs text-gray-500 font-mono mb-2 block">Message to Sign</label>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full bg-transparent border-none text-gray-300 font-mono text-sm focus:ring-0 p-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-solana-green bg-solana-green/10 px-3 py-1 rounded-full border border-solana-green/20">
                <Zap className="w-3 h-3" />
                Zero Cost
              </div>

              <button
                onClick={handleSignMessage}
                disabled={!isConnected || !!loadingAction}
                className="btn-primary"
              >
                {loadingAction === 'sign' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Sign</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Send Transaction Card */}
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <Send className="w-24 h-24 text-white/5" />
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="p-3 bg-solana-green/20 rounded-xl text-solana-green border border-solana-green/20">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Send Transaction</h3>
                <p className="text-gray-400 text-sm">Real Devnet SOL Transfer</p>
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-xl p-4 mb-6 border border-white/5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-mono mb-1 block">Amount (SOL) <span className="text-gray-600">• Max 2 SOL</span></label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  step="0.001"
                  min="0.001"
                  max="2"
                  className="w-full bg-transparent border-none text-gray-300 font-mono text-sm focus:ring-0 p-0"
                />
                {parseFloat(amountInput) > 2 && (
                  <p className="text-red-400 text-xs mt-1">Maximum 2 SOL per transaction</p>
                )}
              </div>
              <div className="pt-2 border-t border-white/5">
                <label className="text-xs text-gray-500 font-mono mb-1 block">Recipient</label>
                <div className="flex items-center gap-2 bg-transparent text-gray-300 w-full">
                  <Wallet className="w-3 h-3 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    placeholder={isConnected ? "Self (Leave empty)" : "Connect Wallet"}
                    maxLength={44}
                    className="w-full bg-transparent border-none text-gray-300 font-mono text-xs focus:ring-0 p-0 placeholder:text-gray-600"
                  />
                </div>
                {/* Quick Fill Helpers */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setRecipientInput(smartWalletPubkey?.toBase58() || '')}
                    className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-gray-400 transition-colors"
                  >
                    Fill My Address
                  </button>
                  <button
                    onClick={() => setRecipientInput('G2zmxMfPMcJCUtVv9Uaa81T89Qo4B3K8bM5b6X97zXq')}
                    className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-gray-400 transition-colors"
                  >
                    Random Devnet Address
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-solana-green bg-solana-green/10 px-3 py-1 rounded-full border border-solana-green/20">
                <Zap className="w-3 h-3" />
                Devnet Chain
              </div>

              <button
                onClick={handleSendTransaction}
                disabled={!isConnected || !!loadingAction}
                className="btn-primary"
              >
                {loadingAction === 'tx' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Send</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Info/Hint Section */}
          {lastSignature && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-dark-800/50 border border-dark-600 rounded-xl flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-solana-green mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Action Completed</h4>
                <p className="text-gray-400 text-sm break-all">
                  Hash: {lastSignature.slice(0, 20)}...
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Debug Console Column */}
        <div className={`
          flex flex-col h-[600px] glass-panel rounded-2xl overflow-hidden
          ${!debugMode ? '' : ''} 
          transition-all duration-500
        `}>
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-dark-800/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-400" />
              <span className="font-mono text-sm font-medium">Debug Console</span>
            </div>
            <button
              onClick={clearLogs}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm relative">
            {debugLogs.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <div className="mb-2">Waiting for interactions...</div>
                {!debugMode && <div className="text-xs text-solana-green">Enable Debug Mode to see details</div>}
              </div>
            ) : (
              debugLogs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-b border-white/5 pb-4 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-xs">[{log.timestamp}]</span>
                    <span className={`
                       text-xs font-bold px-2 py-0.5 rounded
                       ${log.type === 'success' ? 'bg-solana-green/20 text-solana-green' : ''}
                       ${log.type === 'error' ? 'bg-red-500/20 text-red-500' : ''}
                       ${log.type === 'info' ? 'bg-blue-500/20 text-blue-500' : ''}
                     `}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-300 mb-2">{log.message}</div>
                  {log.data && (
                    <pre className="bg-black/40 p-2 rounded text-xs text-gray-400 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
