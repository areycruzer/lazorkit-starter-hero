import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const tutorialContent: Record<string, {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    code?: string;
  }>;
}> = {
  'passkey-wallet-setup': {
    title: 'From Seed Phrases to FaceID: Setting Up Your First LazorKit Wallet',
    sections: [
      {
        heading: 'The Problem with Seed Phrases',
        content: 'Traditional wallets generate 12-24 word seed phrases that you must write down perfectly, store securely forever, and never share with anyone. Studies show over $100 billion in cryptocurrency has been lost due to forgotten or compromised seed phrases. Passkeys eliminate this problem entirely by using hardware-backed security.',
      },
      {
        heading: 'Why Passkeys Are Better',
        content: 'Passkeys leverage WebAuthn, the same technology that powers "Sign in with FaceID." Your device generates a secp256r1 (P-256) key pair in its secure enclave—the private key never leaves your device. Authentication happens via biometrics (FaceID, TouchID, Windows Hello), and the public key is registered on-chain as your wallet\'s signer.',
      },
      {
        heading: 'Setting Up the Provider',
        content: 'First, wrap your app with the LazorKit provider to enable wallet functionality:',
        code: `import { LazorkitProvider } from '@lazorkit/wallet';

const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
  },
};

function App() {
  return (
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <YourApp />
    </LazorkitProvider>
  );
}`,
      },
      {
        heading: 'Creating a Passkey Wallet',
        content: 'Creating a wallet is as simple as calling connect(). The browser prompts for biometric authentication, and a new on-chain smart wallet is created:',
        code: `import { useWallet } from '@lazorkit/wallet';

function CreateWalletButton() {
  const { connect, isConnecting, smartWalletPubkey } = useWallet();

  const handleCreate = async () => {
    try {
      await connect();
      // That's it! Wallet is created and connected
    } catch (error) {
      console.error('Wallet creation failed:', error);
    }
  };

  if (smartWalletPubkey) {
    return <div>✅ Wallet: {smartWalletPubkey.toBase58().slice(0, 8)}...</div>;
  }

  return (
    <button onClick={handleCreate} disabled={isConnecting}>
      {isConnecting ? '🔐 Authenticating...' : '✨ Create Wallet with FaceID'}
    </button>
  );
}`,
      },
      {
        heading: 'Understanding WebAuthn Credential Creation',
        content: 'Behind the scenes, LazorKit uses the WebAuthn API to create a secure credential. The ES256 algorithm (alg: -7) specifies the P-256 curve, which is natively supported by every secure enclave:',
        code: `const credential = await navigator.credentials.create({
  publicKey: {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: 'LazorKit', id: window.location.hostname },
    user: {
      id: walletId.toArrayLike(Uint8Array, 'le', 8),
      name: 'LazorKit Wallet',
      displayName: 'LazorKit Wallet',
    },
    // ES256 = secp256r1/P-256 curve
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required',
    },
  },
});`,
      },
      {
        heading: 'S-Normalization: Critical Security Detail',
        content: 'WebAuthn signatures use the secp256r1 curve, which can produce "high-S" signatures. Solana requires "low-S" signatures to prevent malleability attacks. LazorKit automatically normalizes every signature:',
        code: `// secp256r1 half-order threshold
const SECP256R1_HALF_ORDER = new Uint8Array([
  0x7f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00,
  0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xde, 0x73, 0x7d, 0x56, 0xd3, 0x8b, 0xcf, 0x42,
  0x79, 0xdc, 0xe5, 0x61, 0x7e, 0x31, 0x92, 0xa8
]);

function normalizeSignatureS(signature: Uint8Array): Uint8Array {
  const r = signature.slice(0, 32);
  const s = signature.slice(32, 64);

  // If S > n/2, compute S' = n - S
  if (compareBigEndian(s, SECP256R1_HALF_ORDER) > 0) {
    const normalizedS = subtractBigEndian(SECP256R1_ORDER, s);
    const normalized = new Uint8Array(64);
    normalized.set(r, 0);
    normalized.set(normalizedS, 32);
    return normalized;
  }

  return signature;
}`,
      },
      {
        heading: 'Graceful Error Handling',
        content: 'WebAuthn can fail for various reasons. LazorKit maps these to user-friendly error codes:',
        code: `const LazorErrorCode = {
  USER_CANCELLED: 'USER_CANCELLED',
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  BIOMETRICS_DISABLED: 'BIOMETRICS_DISABLED',
  SECURITY_ERROR: 'SECURITY_ERROR',
  TIMEOUT: 'TIMEOUT',
};

class LazorError extends Error {
  static fromWebAuthnError(error: Error): LazorError {
    const errorMap = {
      NotAllowedError: {
        code: LazorErrorCode.USER_CANCELLED,
        message: 'Authentication was cancelled. Please try again.',
      },
      NotSupportedError: {
        code: LazorErrorCode.WEBAUTHN_NOT_SUPPORTED,
        message: 'Passkeys are not supported on this device.',
      },
      SecurityError: {
        code: LazorErrorCode.SECURITY_ERROR,
        message: 'Security error. Ensure you are using HTTPS.',
      },
    };
    
    const mapped = errorMap[error.name];
    return mapped 
      ? new LazorError(mapped.code, mapped.message, error)
      : new LazorError('UNKNOWN', error.message, error);
  }
}`,
      },
      {
        heading: 'Passkeys vs Seed Phrases: Complete Comparison',
        content: 'Backup: Seed phrases require manual backup (12-24 words); Passkeys sync via iCloud/Google automatically. Phishing Risk: Seed phrases can be typed into fake sites; Passkeys are domain-bound and biometric-only. Device Loss: Seed phrase loss = funds lost; Passkeys restore via cloud sync. Hardware Security: Seed phrases are software-only; Passkeys use Secure Enclave. The future is passwordless!',
      },
    ],
  },
  'gasless-transactions': {
    title: 'Going Gasless: How to Sponsor USDC Transactions with Smart Wallets',
    sections: [
      {
        heading: 'The Gas Problem in Web3',
        content: 'Every Solana transaction requires SOL for fees. This creates a frustrating onboarding barrier: users who receive USDC can\'t move it without SOL first. LazorKit solves this with smart wallet accounts that accept sponsored transactions, making the UX feel like traditional fintech apps.',
      },
      {
        heading: 'How Gasless Transactions Work',
        content: 'LazorKit uses a paymaster architecture: 1) User signs transaction intent with passkey (no SOL needed), 2) LazorKit smart wallet verifies P-256 signature on-chain, 3) Paymaster wraps the intent and pays SOL fees, 4) Transaction executes on Solana. The paymaster never has access to user funds!',
      },
      {
        heading: 'Configure the Paymaster',
        content: 'Include paymaster configuration in your LazorKit provider setup:',
        code: `import { LazorkitProvider } from '@lazorkit/wallet';

export const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
  },
};

function App() {
  return (
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <YourApp />
    </LazorkitProvider>
  );
}`,
      },
      {
        heading: 'Build a USDC Transfer Instruction',
        content: 'Create a transfer instruction for USDC (or any SPL token):',
        code: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

const USDC_DEVNET_MINT = new PublicKey(
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

async function buildUsdcTransferInstruction(
  senderWallet: PublicKey,
  recipientAddress: string,
  amountInCents: number
): Promise<TransactionInstruction> {
  const recipient = new PublicKey(recipientAddress);
  
  const senderTokenAccount = await getAssociatedTokenAddress(
    USDC_DEVNET_MINT, senderWallet, true
  );
  const recipientTokenAccount = await getAssociatedTokenAddress(
    USDC_DEVNET_MINT, recipient
  );
  
  // USDC has 6 decimals
  const amount = amountInCents * 10_000;
  
  return createTransferInstruction(
    senderTokenAccount,
    recipientTokenAccount,
    senderWallet,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );
}`,
      },
      {
        heading: 'Send the Gasless Transaction',
        content: 'Now the magic—send USDC without any SOL in your wallet:',
        code: `import { useWallet } from '@lazorkit/wallet';

function SendUsdcButton() {
  const { 
    smartWalletPubkey, 
    signAndSendTransaction,
    isConnected 
  } = useWallet();

  const handleSend = async () => {
    if (!smartWalletPubkey || !isConnected) return;

    try {
      const instruction = await buildUsdcTransferInstruction(
        smartWalletPubkey,
        'RECIPIENT_WALLET_ADDRESS',
        499 // $4.99
      );

      // Sign and send - gasless! ✨
      const result = await signAndSendTransaction([instruction]);
      
      console.log('Signature:', result.signature);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <button onClick={handleSend} disabled={!isConnected}>
      Send $4.99 USDC (Gasless!)
    </button>
  );
}`,
      },
      {
        heading: 'Transaction Size Optimization',
        content: 'Solana transactions have a 1,232-byte limit. LazorKit automatically chooses the optimal execution flow: Direct Execute for simple transfers, or CreateChunk + ExecuteChunk for complex operations:',
        code: `const SOLANA_TX_SIZE_LIMIT = 1232;

function determineExecutionFlow(
  instructions: TransactionInstruction[],
  payer: PublicKey
): 'direct' | 'chunked' {
  if (instructions.length === 1) {
    try {
      const size = estimateTransactionSize(instructions, payer);
      if (size < SOLANA_TX_SIZE_LIMIT - 200) {
        return 'direct';
      }
    } catch {
      return 'chunked';
    }
  }
  
  return 'chunked';
}`,
      },
      {
        heading: 'Authorization Message Structure',
        content: 'Every gasless transaction requires a signed authorization that binds the signature to specific instructions and prevents replay attacks:',
        code: `type SmartWalletAction = 'Execute' | 'CreateChunk' | 'ExecuteChunk';

function buildAuthorizationMessage(params: {
  action: SmartWalletAction;
  timestamp: BN;
  smartWallet: PublicKey;
  cpiHash?: number[];
}): Uint8Array {
  const { action, timestamp, smartWallet, cpiHash } = params;
  
  const actionByte = action === 'Execute' ? 0 
                   : action === 'CreateChunk' ? 1 
                   : 2;
  
  const parts: Uint8Array[] = [
    new Uint8Array([actionByte]),
    timestamp.toArrayLike(Uint8Array, 'le', 8),
    smartWallet.toBytes(),
  ];
  
  if (cpiHash) {
    parts.push(new Uint8Array(cpiHash));
  }
  
  // Concatenate all parts
  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const message = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    message.set(part, offset);
    offset += part.length;
  }
  
  return message;
}`,
      },
      {
        heading: 'Paymaster Security Model',
        content: 'The paymaster is secure by design. It CAN: pay transaction fees, submit signed transactions, rate limit requests. It CANNOT: modify instructions, access user funds, forge signatures, or change recipients. The smart wallet verifies the P-256 signature came from the registered passkey before executing any instruction.',
      },
      {
        heading: 'Business Models for Gasless',
        content: 'How to sustainably offer gasless: 1) Platform Sponsorship - you pay all fees; 2) User Pays in Token - deduct small fee from USDC amount; 3) Subscription Model - free gasless for premium users; 4) Volume-Based - free up to N transactions/month. Choose what fits your product!',
      },
    ],
  },
  'getting-started': {
    title: 'Getting Started with LazorKit',
    sections: [
      {
        heading: 'Prerequisites',
        content: 'Before you begin, make sure you have Node.js 18+ installed and a basic understanding of React and TypeScript.',
      },
      {
        heading: 'Installation',
        content: 'Install the required packages using npm or yarn:',
        code: `npm install @lazorkit/wallet @solana/web3.js @coral-xyz/anchor`,
      },
      {
        heading: 'Provider Setup',
        content: 'Wrap your application with the LazorkitProvider to enable wallet functionality throughout your app:',
        code: `import { LazorkitProvider } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      <YourApplication />
    </LazorkitProvider>
  );
}`,
      },
      {
        heading: 'Basic Connection',
        content: 'Use the useWallet hook to connect users with their passkey:',
        code: `import { useWallet } from '@lazorkit/wallet';

function ConnectButton() {
  const { connect, isConnected, isConnecting } = useWallet();

  if (isConnected) {
    return <span>Connected!</span>;
  }

  return (
    <button onClick={() => connect()} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect with Passkey'}
    </button>
  );
}`,
      },
    ],
  },
  'wallet-integration': {
    title: 'Complete Wallet Integration',
    sections: [
      {
        heading: 'Understanding the useWallet Hook',
        content: 'The useWallet hook provides all the functionality you need to interact with LazorKit wallets:',
        code: `const {
  // Connection
  connect,           // Function to initiate connection
  disconnect,        // Function to disconnect wallet
  isConnected,       // Boolean - connection state
  isConnecting,      // Boolean - connection in progress
  
  // Wallet Info
  smartWalletPubkey, // PublicKey of the smart wallet
  wallet,            // Full wallet info object
  
  // Signing
  signMessage,       // Sign arbitrary messages
  signAndSendTransaction, // Sign and send transactions
  isSigning,         // Boolean - signing in progress
} = useWallet();`,
      },
      {
        heading: 'Displaying Wallet Address',
        content: 'Create a component to display the connected wallet address:',
        code: `function WalletDisplay() {
  const { smartWalletPubkey, isConnected } = useWallet();

  if (!isConnected || !smartWalletPubkey) {
    return <p>No wallet connected</p>;
  }

  const address = smartWalletPubkey.toBase58();
  const truncated = \`\${address.slice(0, 4)}...\${address.slice(-4)}\`;

  return (
    <div className="wallet-display">
      <span className="status-dot" />
      <span className="address">{truncated}</span>
    </div>
  );
}`,
      },
      {
        heading: 'Handling Connection States',
        content: 'Build a robust wallet button that handles all states:',
        code: `function WalletButton() {
  const { connect, disconnect, isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return <button disabled>Connecting...</button>;
  }

  if (isConnected) {
    return (
      <button onClick={() => disconnect()}>
        Disconnect
      </button>
    );
  }

  return (
    <button onClick={() => connect()}>
      Connect Wallet
    </button>
  );
}`,
      },
    ],
  },
  'sign-messages': {
    title: 'Signing Messages',
    sections: [
      {
        heading: 'Why Sign Messages?',
        content: 'Message signing is essential for authentication, proving ownership of a wallet, and signing off-chain data. With LazorKit, messages are signed using the device\'s secure enclave via passkey.',
      },
      {
        heading: 'Basic Message Signing',
        content: 'Use the signMessage function from useWallet:',
        code: `import { useWallet } from '@lazorkit/wallet';

function SignMessageDemo() {
  const { signMessage, isConnected } = useWallet();
  const [message, setMessage] = useState('Hello, Solana!');

  const handleSign = async () => {
    if (!isConnected) return;

    try {
      const result = await signMessage(message);
      console.log('Signature:', result.signature);
      console.log('Signed Payload:', result.signedPayload);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
      <button onClick={handleSign}>Sign Message</button>
    </div>
  );
}`,
      },
      {
        heading: 'Creating a Reusable Hook',
        content: 'Wrap the signing logic in a custom hook for better reusability:',
        code: `function useSignMessage() {
  const { signMessage, isConnected } = useWallet();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sign = async (message: string) => {
    if (!isConnected) {
      setError('Wallet not connected');
      return null;
    }

    setIsSigning(true);
    setError(null);

    try {
      const result = await signMessage(message);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsSigning(false);
    }
  };

  return { sign, isSigning, error };
}`,
      },
    ],
  },
  'transactions': {
    title: 'Sending Transactions',
    sections: [
      {
        heading: 'Transaction Overview',
        content: 'LazorKit uses a two-step process for transactions: 1) Create a chunk (deferred execution), 2) Execute with passkey signature. The SDK handles this automatically via signAndSendTransaction.',
      },
      {
        heading: 'Basic SOL Transfer',
        content: 'Send SOL from your smart wallet to another address:',
        code: `import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

function TransferSOL() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } = useWallet();

  const handleTransfer = async () => {
    if (!isConnected || !smartWalletPubkey) return;

    const recipient = new PublicKey('RECIPIENT_ADDRESS_HERE');
    const lamports = 0.1 * LAMPORTS_PER_SOL;

    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: recipient,
      lamports,
    });

    try {
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });
      console.log('Transaction sent:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return <button onClick={handleTransfer}>Send 0.1 SOL</button>;
}`,
      },
      {
        heading: 'Gasless Transactions with Paymaster',
        content: 'Use the Paymaster to sponsor transaction fees. Users don\'t need SOL for gas:',
        code: `const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    // Use a token for fees instead of SOL
    feeToken: 'USDC_MINT_ADDRESS',
  },
});`,
      },
      {
        heading: 'Error Handling',
        content: 'Always wrap transactions in try-catch and provide user feedback:',
        code: `const [status, setStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
const [error, setError] = useState<string | null>(null);

const sendTransaction = async () => {
  setStatus('signing');
  setError(null);

  try {
    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });
    setStatus('success');
    console.log('Success:', signature);
  } catch (err) {
    setStatus('error');
    setError(err instanceof Error ? err.message : 'Transaction failed');
  }
};`,
      },
    ],
  },
};

export function TutorialDetail() {
  const { tutorialId } = useParams<{ tutorialId: string }>();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const tutorial = tutorialId ? tutorialContent[tutorialId] : null;

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!tutorial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Tutorial Not Found</h1>
        <Link to="/tutorials" className="text-solana-teal hover:underline">
          ← Back to Tutorials
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/tutorials" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tutorials
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-8">
        <span className="gradient-text">{tutorial.title}</span>
      </h1>

      <div className="space-y-12">
        {tutorial.sections.map((section, index) => (
          <section key={index} className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {section.heading}
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {section.content}
            </p>
            {section.code && (
              <div className="relative">
                <button
                  onClick={() => copyCode(section.code!, index)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  {copiedIndex === index ? (
                    <CheckCircle className="w-4 h-4 text-solana-teal" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <div className="code-block">
                  <pre className="text-sm leading-relaxed overflow-x-auto">
                    <code>{section.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Try It Now CTA */}
      <div className="mt-12 p-6 bg-gradient-to-br from-solana-purple/10 to-solana-teal/10 border border-solana-purple/30 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Ready to try it yourself?</h3>
            <p className="text-gray-400">See this code in action with our interactive demo</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/demo"
              className="btn-primary flex items-center gap-2"
            >
              Try Demo
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <Link
              to="/subscription"
              className="btn-secondary flex items-center gap-2"
            >
              Subscription Flow
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-dark-600">
        <div className="flex items-center justify-between">
          <Link 
            to="/tutorials" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← More Tutorials
          </Link>
          <a
            href="https://docs.lazorkit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-solana-teal hover:text-solana-blue transition-colors"
          >
            Full Documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
