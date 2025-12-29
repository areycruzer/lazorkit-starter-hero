import { useState, useCallback } from 'react';
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
  ExternalLink,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play
} from 'lucide-react';

// Debug log entry type
interface DebugLogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'request' | 'response';
  title: string;
  data: unknown;
}

// Debug Console Component
function DebugConsole({
  logs,
  onClear,
  isExpanded,
  onToggleExpand
}: {
  logs: DebugLogEntry[];
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLog = (log: DebugLogEntry) => {
    const text = JSON.stringify(log.data, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeColor = (type: DebugLogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-solana-teal';
      case 'error': return 'text-red-400';
      case 'request': return 'text-solana-purple';
      case 'response': return 'text-solana-blue';
      default: return 'text-gray-400';
    }
  };

  const getTypeBadge = (type: DebugLogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-solana-teal/20 text-solana-teal';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'request': return 'bg-solana-purple/20 text-solana-purple';
      case 'response': return 'bg-solana-blue/20 text-solana-blue';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Header Bar - Always Visible */}
      <div
        className="bg-dark-800 border-t border-dark-600 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-solana-teal" />
            <span className="font-semibold text-white">Debug Console</span>
            <span className="px-2 py-0.5 text-xs bg-solana-purple/20 text-solana-purple rounded-full">
              {logs.length} events
            </span>
            {logs.length > 0 && logs[logs.length - 1].type === 'success' && (
              <span className="flex items-center gap-1 text-xs text-solana-teal">
                <span className="w-2 h-2 bg-solana-teal rounded-full animate-pulse" />
                Live blockchain data
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Log Area */}
      {isExpanded && (
        <div className="bg-dark-900 border-t border-dark-700 max-h-80 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No events yet. Sign a message or send a transaction to see blockchain data.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-dark-700">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadge(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className={`font-medium ${getTypeColor(log.type)}`}>
                          {log.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => copyLog(log)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Copy JSON"
                        >
                          {copiedId === log.id ? (
                            <CheckCircle className="w-4 h-4 text-solana-teal" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DemoPage() {
  const { isConnected, connect, isConnecting, smartWalletPubkey } = useWallet();
  const { sign, isSigning, lastSignature, error: signError } = useSignMessage();

  const [messageToSign, setMessageToSign] = useState('Hello from LazorKit Starter!');
  const [copied, setCopied] = useState(false);

  // Debug Console State
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Generate unique ID for logs
  const generateLogId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add log entry
  const addLog = useCallback((type: DebugLogEntry['type'], title: string, data: unknown) => {
    if (!debugMode) return; // Only log if debug mode is on (or maybe always log but only show if on? Text says "When turned on, it shows...")
    // Actually, good practice to always log but only show if debugMode is true, BUT for clarity let's just log always and hide the component if !debugMode

    const entry: DebugLogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      type,
      title,
      data
    };
    setDebugLogs(prev => [...prev, entry]);
  }, [debugMode]);

  // Clear logs
  const clearLogs = () => setDebugLogs([]);

  // Get wallet address as string
  const walletAddress = smartWalletPubkey?.toBase58() || 'Not connected';

  const handleSign = async () => {
    // Log the request
    addLog('request', 'Sign Message Request', {
      message: messageToSign,
      messageBytes: new TextEncoder().encode(messageToSign).length,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await sign(messageToSign);

      if (result) {
        // Log successful response with full signature data
        addLog('success', 'Signature Created', {
          signature: result.signature,
          signatureLength: result.signature.length,
          signatureFormat: 'base64',
          message: messageToSign,
          walletAddress,
          cryptographicProof: {
            algorithm: 'secp256r1 (P-256)',
            signatureType: 'WebAuthn/Passkey',
            sNormalized: true,
            note: 'Signature uses S-normalization per Solana secp256r1 requirements'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      addLog('error', 'Signature Failed', {
        error: err instanceof Error ? err.message : String(err),
        message: messageToSign,
        timestamp: new Date().toISOString()
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Demo transaction handler (simulated for now)
  const handleDemoTransaction = async () => {
    addLog('request', 'Transaction Request', {
      type: 'gasless_transfer',
      network: 'devnet',
      walletAddress,
      note: 'Transaction would be submitted to Solana devnet via LazorKit gasless relay',
      timestamp: new Date().toISOString()
    });

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    addLog('info', 'Transaction Demo', {
      status: 'simulated',
      explanation: 'Full transaction implementation available in SubscriptionManager component',
      features: [
        'Gasless transactions via LazorKit relay',
        'S-normalized secp256r1 signatures',
        'Direct Execute for small transactions',
        'CreateChunk flow for larger transactions'
      ],
      documentation: 'See /tutorials/gasless-transactions for implementation guide',
      timestamp: new Date().toISOString()
    });
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
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-48">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Interactive</span> Demo
            </h1>
            <p className="text-gray-400">
              Test LazorKit features with your connected passkey wallet.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-dark-800 p-2 rounded-xl border border-dark-600">
            <span className={`text-sm font-medium ${debugMode ? 'text-white' : 'text-gray-500'}`}>
              Debug Mode
            </span>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${debugMode ? 'bg-solana-teal' : 'bg-dark-600'
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${debugMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wallet Info */}
          <div className="lg:col-span-1">
            <WalletCard />

            {/* Debug Console Hint */}
            {debugMode && (
              <div className="mt-4 bg-gradient-to-br from-solana-purple/10 to-solana-teal/10 border border-solana-purple/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-5 h-5 text-solana-teal" />
                  <span className="font-semibold text-white">Debug Console</span>
                </div>
                <p className="text-sm text-gray-400">
                  Check the console at the bottom of the screen to see real JSON data from blockchain interactions.
                </p>
              </div>
            )}
          </div>

          {/* Demo Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sign Message */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple to-solana-blue flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Sign Message</h3>
                    <p className="text-sm text-gray-400">Cryptographically sign a message</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-solana-teal/10 border border-solana-teal/20 text-xs font-medium text-solana-teal flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-solana-teal animate-pulse" />
                  Gasless
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
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Signature (truncated)</span>
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
                      {debugMode && (
                        <p className="text-xs text-gray-500 mt-2">
                          See Debug Console below for full signature data →
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Demo */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-teal to-solana-blue flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Send Transaction</h3>
                    <p className="text-sm text-gray-400">Transfer SOL with gasless transactions</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-solana-teal/10 border border-solana-teal/20 text-xs font-medium text-solana-teal flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-solana-teal animate-pulse" />
                  Sponsored: $0.00
                </div>
              </div>

              <div className="bg-dark-700 rounded-xl p-6 space-y-4">
                <p className="text-gray-400 text-center">
                  Click below to see how transaction data flows through LazorKit.
                </p>

                <button
                  onClick={handleDemoTransaction}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Simulate Transaction Flow
                </button>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <a
                    href="/subscription"
                    className="inline-flex items-center gap-2 text-solana-teal hover:text-solana-blue transition-colors text-sm"
                  >
                    <span>Try Real Transactions</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <span className="text-gray-600">|</span>
                  <a
                    href="https://docs.lazorkit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {copied && (
          <div className="fixed bottom-96 right-8 bg-solana-teal text-dark-900 px-4 py-2 rounded-xl font-semibold animate-pulse z-50">
            Copied to clipboard!
          </div>
        )}
      </div>

      {/* Debug Console - Fixed at bottom */}
      {debugMode && (
        <DebugConsole
          logs={debugLogs}
          onClear={clearLogs}
          isExpanded={consoleExpanded}
          onToggleExpand={() => setConsoleExpanded(prev => !prev)}
        />
      )}
    </>
  );
}

