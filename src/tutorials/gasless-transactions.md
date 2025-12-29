# Going Gasless: How to Sponsor USDC Transactions with Smart Wallets

**Estimated reading time: 12 minutes**

Imagine if every time you paid for coffee, you needed a second currency just for the "privilege" of paying. That's the reality of blockchain fees—until now. In this tutorial, we'll explore how LazorKit's smart wallets enable truly gasless transactions, letting users pay in stablecoins like USDC while sponsors cover the SOL fees.

---

## The Gas Problem in Web3

Every Solana transaction requires SOL to pay for network fees. This creates a frustrating onboarding barrier:

1. **User wants to buy an NFT with USDC** → Needs SOL first
2. **New user receives USDC airdrop** → Can't move it without SOL
3. **App wants to subsidize users** → Complex relayer infrastructure needed

LazorKit solves this with **smart wallet accounts** that can accept sponsored transactions, making the user experience feel like traditional fintech apps.

---

## How Gasless Transactions Work

LazorKit's architecture enables fee sponsorship through a clever combination of:

```
┌─────────────────────────────────────────────────────────────────┐
│                     GASLESS TRANSACTION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐     ┌─────────────────┐     ┌────────────────┐  │
│   │   User   │────▶│  LazorKit SDK   │────▶│   Paymaster    │  │
│   │ (Passkey)│     │ (Sign with P256)│     │ (Sponsor Fees) │  │
│   └──────────┘     └─────────────────┘     └────────────────┘  │
│                                                    │            │
│                                                    ▼            │
│                                           ┌───────────────┐    │
│                                           │ Solana Network│    │
│                                           │ (Verify + Exec)│    │
│                                           └───────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Three Actors

1. **User**: Signs transaction intents with their passkey (no SOL required)
2. **LazorKit Smart Wallet**: On-chain program that verifies P-256 signatures
3. **Paymaster**: Backend service that wraps user intents and pays SOL fees

---

## Setting Up Gasless Transactions

Let's implement a gasless USDC transfer step by step.

### Step 1: Configure the Paymaster

First, ensure your LazorKit provider includes paymaster configuration:

```tsx
import { LazorkitProvider } from '@lazorkit/wallet';

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
}
```

### Step 2: Build the Transfer Instruction

Create a USDC transfer instruction:

```tsx
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
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
  
  // Get associated token accounts
  const senderTokenAccount = await getAssociatedTokenAddress(
    USDC_DEVNET_MINT,
    senderWallet,
    true // Allow owner off-curve (for PDAs)
  );
  
  const recipientTokenAccount = await getAssociatedTokenAddress(
    USDC_DEVNET_MINT,
    recipient
  );
  
  // USDC has 6 decimals, so $4.99 = 4_990_000
  const amount = amountInCents * 10_000;
  
  return createTransferInstruction(
    senderTokenAccount,
    recipientTokenAccount,
    senderWallet,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );
}
```

### Step 3: Send the Gasless Transaction

Now the magic—send without SOL:

```tsx
import { useWallet } from '@lazorkit/wallet';

function SendUsdcButton() {
  const { 
    smartWalletPubkey, 
    signAndSendTransaction,
    isConnected 
  } = useWallet();

  const handleSend = async () => {
    if (!smartWalletPubkey || !isConnected) return;

    try {
      // Build the USDC transfer instruction
      const instruction = await buildUsdcTransferInstruction(
        smartWalletPubkey,
        'RECIPIENT_WALLET_ADDRESS',
        499 // $4.99
      );

      // Sign and send - LazorKit handles the gasless magic! ✨
      const result = await signAndSendTransaction([instruction]);
      
      console.log('Transaction signature:', result.signature);
      console.log('Success!');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <button onClick={handleSend} disabled={!isConnected}>
      Send $4.99 USDC (Gasless!)
    </button>
  );
}
```

**That's it!** The user never needs SOL. The paymaster sponsors the transaction fees automatically.

---

## Deep Dive: Transaction Size Optimization

Not all transactions are created equal. LazorKit automatically optimizes based on transaction size.

### The 1232-Byte Limit

Solana transactions have a maximum serialized size of **1,232 bytes**. This includes:
- Signatures
- Account keys
- Instructions
- Blockhash

For simple transfers, we use **Direct Execute**. For complex operations, we use **CreateChunk + ExecuteChunk**.

```tsx
const SOLANA_TX_SIZE_LIMIT = 1232;

function determineExecutionFlow(
  instructions: TransactionInstruction[],
  payer: PublicKey
): 'direct' | 'chunked' {
  // Single instruction can often use direct execute
  if (instructions.length === 1) {
    try {
      const size = estimateTransactionSize(instructions, payer);
      // Use direct if under limit with safety margin
      if (size < SOLANA_TX_SIZE_LIMIT - 200) {
        return 'direct';
      }
    } catch {
      return 'chunked';
    }
  }
  
  return 'chunked';
}
```

### Direct Execute Flow

```
User → Sign Intent → Paymaster → Single Transaction → Solana
```

Perfect for:
- Simple token transfers
- Single NFT purchases
- Basic interactions

### Chunked Execution Flow

```
User → Sign Intent → Paymaster → Create Chunk TX → Execute Chunk TX → Solana
```

Required for:
- Complex multi-instruction operations
- Large payload data
- Batch operations

The SDK handles this automatically—you never need to think about it!

---

## Building the Authorization Message

Every gasless transaction needs a signed authorization. Here's how LazorKit constructs it:

```tsx
type SmartWalletAction = 'Execute' | 'CreateChunk' | 'ExecuteChunk';

function buildAuthorizationMessage(params: {
  action: SmartWalletAction;
  timestamp: BN;
  smartWallet: PublicKey;
  cpiHash?: number[];
}): Uint8Array {
  const { action, timestamp, smartWallet, cpiHash } = params;
  
  // Action byte encoding
  const actionByte = action === 'Execute' ? 0 
                   : action === 'CreateChunk' ? 1 
                   : 2;
  
  const parts: Uint8Array[] = [
    new Uint8Array([actionByte]),
    timestamp.toArrayLike(Uint8Array, 'le', 8),
    smartWallet.toBytes(),
  ];
  
  // Include CPI hash for chunked operations
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
}
```

The timestamp prevents replay attacks, and the CPI hash binds the signature to specific instructions.

---

## Complete Gasless Transaction Implementation

Here's our full implementation from `LazorContext.tsx`:

```tsx
const sendGaslessTransaction = async (
  instructions: TransactionInstruction[]
): Promise<TransactionResult> => {
  if (!walletInfo) {
    throw new LazorError(
      LazorErrorCode.PASSKEY_NOT_FOUND, 
      'No wallet connected'
    );
  }

  const timestamp = new BN(Math.floor(Date.now() / 1000));
  
  // Automatically determine optimal execution flow
  const flow = determineExecutionFlow(
    instructions, 
    walletInfo.smartWallet
  );
  console.log(`Using ${flow} execution flow`);

  // Build authorization message
  const action: SmartWalletAction = flow === 'direct' 
    ? 'Execute' 
    : 'CreateChunk';
  
  // For chunked execution, hash the instructions
  const cpiHash: number[] | undefined = flow === 'chunked'
    ? Array.from(sha256(serializeInstructions(instructions)))
    : undefined;

  const authMessage = buildAuthorizationMessage({
    action,
    timestamp,
    smartWallet: walletInfo.smartWallet,
    cpiHash,
  });

  // Sign with passkey (triggers FaceID/TouchID)
  const passkeySig = await signWithPasskey(authMessage);
  
  // Send to paymaster for fee sponsorship
  const result = await submitToPaymaster({
    instructions,
    signature: passkeySig,
    walletInfo,
    timestamp,
    flow,
  });

  return result;
};
```

---

## Creating a Subscription Payment Flow

Let's put it all together with a real-world example: a gasless subscription payment.

```tsx
import { useState } from 'react';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { useWallet } from '@lazorkit/wallet';

interface SubscriptionPlan {
  name: string;
  priceInCents: number;
  recipient: string;
}

const PLANS: SubscriptionPlan[] = [
  { 
    name: 'Pro Monthly', 
    priceInCents: 499, // $4.99
    recipient: 'MERCHANT_WALLET_ADDRESS' 
  },
  { 
    name: 'Pro Yearly', 
    priceInCents: 4999, // $49.99
    recipient: 'MERCHANT_WALLET_ADDRESS' 
  },
];

function SubscriptionManager() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } = useWallet();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!smartWalletPubkey || !isConnected) return;

    setSelectedPlan(plan);
    setStatus('processing');

    try {
      // Build the USDC transfer instruction
      const instruction = await buildUsdcTransferInstruction(
        smartWalletPubkey,
        plan.recipient,
        plan.priceInCents
      );

      // Execute gasless transaction
      const result = await signAndSendTransaction([instruction]);

      if (result.success) {
        setStatus('success');
        console.log(`Subscribed to ${plan.name}!`, result.signature);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setStatus('error');
      console.error('Subscription failed:', error);
    }
  };

  return (
    <div className="subscription-manager">
      <h2>Choose Your Plan</h2>
      
      {PLANS.map(plan => (
        <button
          key={plan.name}
          onClick={() => handleSubscribe(plan)}
          disabled={status === 'processing'}
          className={selectedPlan?.name === plan.name ? 'selected' : ''}
        >
          <span className="plan-name">{plan.name}</span>
          <span className="plan-price">
            ${(plan.priceInCents / 100).toFixed(2)}/mo
          </span>
          {status === 'processing' && selectedPlan?.name === plan.name && (
            <span className="processing">Processing...</span>
          )}
        </button>
      ))}

      {status === 'success' && (
        <div className="success-message">
          ✅ Payment successful! No SOL required.
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          ❌ Payment failed. Please try again.
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling for Gasless Transactions

Gasless transactions can fail for various reasons. Here's robust error handling:

```tsx
const LazorErrorCode = {
  USER_CANCELLED: 'USER_CANCELLED',
  TRANSACTION_TOO_LARGE: 'TRANSACTION_TOO_LARGE',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PAYMASTER_ERROR: 'PAYMASTER_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
} as const;

async function sendGaslessWithRetry(
  instructions: TransactionInstruction[],
  maxRetries = 3
): Promise<TransactionResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendGaslessTransaction(instructions);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry user cancellations
      if (error instanceof LazorError) {
        if (error.code === LazorErrorCode.USER_CANCELLED) {
          throw error;
        }
        
        // Don't retry insufficient funds
        if (error.code === LazorErrorCode.INSUFFICIENT_FUNDS) {
          throw error;
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}
```

---

## Understanding Paymasters

The paymaster is the hero that makes gasless possible. Here's what it does:

### Paymaster Responsibilities

1. **Receive signed intents** from users
2. **Validate signatures** against the smart wallet
3. **Wrap instructions** in a proper Solana transaction
4. **Pay SOL fees** from its own balance
5. **Submit to network** and return result

### Paymaster Security

The paymaster never has access to user funds! It can only:
- Pay for transaction fees
- Submit pre-signed user intents

The smart wallet verifies that the P-256 signature came from the registered passkey before executing any instruction.

```
┌─────────────────────────────────────────────────────────────┐
│              PAYMASTER SECURITY MODEL                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Paymaster CAN:                                            │
│   ✅ Pay transaction fees                                   │
│   ✅ Submit signed transactions                             │
│   ✅ Rate limit requests                                    │
│                                                              │
│   Paymaster CANNOT:                                         │
│   ❌ Modify transaction instructions                        │
│   ❌ Access user funds                                      │
│   ❌ Forge user signatures                                  │
│   ❌ Change recipient addresses                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Business Models for Gasless Transactions

How do you sustainably offer gasless transactions?

### 1. Platform Sponsorship
```tsx
// Platform pays all fees
const paymasterConfig = {
  sponsorAll: true,
  maxDailySpend: 100, // SOL
};
```

### 2. User Pays in Token
```tsx
// Deduct fee equivalent from USDC transfer
const feeInUsdc = 0.01; // $0.01 per transaction
const netAmount = userAmount - feeInUsdc;
```

### 3. Subscription Model
```tsx
// Free gasless for premium users
if (user.subscription === 'premium') {
  await sendGaslessTransaction(instructions);
} else {
  await sendTransaction(instructions); // User pays SOL
}
```

### 4. Volume-Based
```tsx
// Free up to N transactions/month
if (user.monthlyTxCount < 100) {
  await sendGaslessTransaction(instructions);
}
```

---

## Best Practices for Gasless UX

1. **Never mention "gas" to users**
   ```tsx
   // ❌ Bad
   "Your transaction was sponsored (gas paid by us)"
   
   // ✅ Good  
   "Payment successful!"
   ```

2. **Handle all states gracefully**
   ```tsx
   {isProcessing && <Spinner />}
   {isSuccess && <SuccessAnimation />}
   {isError && <RetryButton />}
   ```

3. **Show clear feedback**
   ```tsx
   // FaceID prompt
   "Confirm with FaceID to complete payment"
   
   // Processing
   "Sending $4.99 USDC..."
   
   // Success
   "✅ Payment complete!"
   ```

4. **Provide transaction receipts**
   ```tsx
   <a href={`https://solscan.io/tx/${signature}`}>
     View on Solscan
   </a>
   ```

---

## What's Next?

You've learned how gasless transactions work! Continue your journey:

1. **[Session Keys](/tutorials/session-keys)** - Automate recurring payments
2. **[From Seed Phrases to FaceID](/tutorials/passkey-wallet-setup)** - Deep dive on passkeys
3. **[Live Demo](/demo)** - Try gasless transfers yourself

---

## Key Takeaways

1. **Gasless = no SOL required** for end users
2. **Paymasters sponsor fees** without accessing user funds
3. **Transaction size optimization** is automatic (direct vs chunked)
4. **Authorization messages** prevent replay attacks
5. **P-256 signatures** are verified on-chain by the smart wallet

Build the fintech-grade UX your users deserve! 🚀

---

*Built with ❤️ for the Superteam Vietnam LazorKit Bounty*
