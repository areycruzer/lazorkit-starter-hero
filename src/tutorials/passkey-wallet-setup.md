# From Seed Phrases to FaceID: Setting Up Your First LazorKit Wallet

**Estimated reading time: 10 minutes**

Welcome to the future of Web3 authentication! If you've ever worried about losing your seed phrase or having it stolen, LazorKit offers a revolutionary alternative. In this tutorial, we'll explore why passkeys are the next evolution in wallet security and walk you through creating your first passkey-powered Solana wallet.

---

## The Problem with Seed Phrases

Let's be honest: seed phrases are a user experience nightmare.

Traditional Solana wallets like Phantom or Backpack generate a 12 or 24-word seed phrase that you must:

1. **Write down perfectly** (one typo = lost funds)
2. **Store securely forever** (fire, theft, degradation)
3. **Never share with anyone** (yet phishing attacks trick millions)
4. **Remember which wallet uses which phrase** (if you have multiple)

Studies show that **over $100 billion** in cryptocurrency has been lost due to forgotten or compromised seed phrases. That's not a security model—that's a liability.

---

## Enter Passkeys: Security Meets Simplicity

Passkeys leverage the **WebAuthn** standard, the same technology that powers "Sign in with FaceID" on your favorite apps. Here's what makes them special:

### How Passkeys Work

When you create a passkey wallet with LazorKit:

1. Your device generates a **secp256r1 (P-256) key pair** in its secure enclave
2. The **private key never leaves your device**—not even to LazorKit's servers
3. Authentication happens via biometrics (FaceID, TouchID, Windows Hello)
4. The public key is registered on-chain as your wallet's signer

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR DEVICE                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SECURE ENCLAVE                              │ │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐ │ │
│  │  │  Private Key    │────│  Biometric Verification     │ │ │
│  │  │  (Never Leaves) │    │  (FaceID / TouchID)         │ │ │
│  │  └─────────────────┘    └─────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│              ┌─────────────────────┐                        │
│              │  Signed Transaction │                        │
│              └─────────────────────┘                        │
└──────────────────────────│──────────────────────────────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │   Solana Network    │
                 └─────────────────────┘
```

### Why secp256r1 (P-256)?

You might wonder: "Solana uses ed25519, why use a different curve?"

Great question! The P-256 curve is **natively supported by every secure enclave** in modern devices:

| Platform | Hardware Support |
|----------|-----------------|
| iOS | Secure Enclave (A7+ chips) |
| Android | StrongBox / TEE |
| macOS | Secure Enclave |
| Windows | TPM 2.0 |
| ChromeOS | Titan C chip |

LazorKit's smart contracts bridge this gap, verifying P-256 signatures on-chain while giving you the security of hardware-backed keys.

---

## Setting Up Your First LazorKit Wallet

Let's get hands-on! We'll create a passkey wallet using our implementation.

### Step 1: Install Dependencies

```bash
npm install @lazorkit/wallet @solana/web3.js @coral-xyz/anchor
```

### Step 2: Configure the LazorKit Provider

First, wrap your app with the LazorKit provider:

```tsx
import { LazorkitProvider } from '@lazorkit/wallet';

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
}
```

### Step 3: Create a Passkey Wallet

Here's the magic moment—creating a wallet with just biometrics:

```tsx
import { useWallet } from '@lazorkit/wallet';

function CreateWalletButton() {
  const { connect, isConnecting, smartWalletPubkey } = useWallet();

  const handleCreate = async () => {
    try {
      await connect();
      // That's it! The wallet is created and connected
    } catch (error) {
      console.error('Wallet creation failed:', error);
    }
  };

  if (smartWalletPubkey) {
    return (
      <div className="wallet-created">
        ✅ Wallet: {smartWalletPubkey.toBase58().slice(0, 8)}...
      </div>
    );
  }

  return (
    <button onClick={handleCreate} disabled={isConnecting}>
      {isConnecting ? (
        <>🔐 Authenticating...</>
      ) : (
        <>✨ Create Wallet with FaceID</>
      )}
    </button>
  );
}
```

### What Happens Behind the Scenes

When you click "Create Wallet," LazorKit orchestrates a beautiful dance:

1. **WebAuthn Credential Creation**
   ```tsx
   const credential = await navigator.credentials.create({
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
   });
   ```

2. **Smart Wallet PDA Derivation**
   
   Your on-chain wallet address is deterministically derived:
   ```tsx
   const [smartWallet] = PublicKey.findProgramAddressSync(
     [Buffer.from('smart_wallet'), walletId.toArrayLike(Buffer, 'le', 8)],
     LAZORKIT_PROGRAM_ID
   );
   ```

3. **Credential Hash Generation**
   
   We hash your credential ID for on-chain storage:
   ```tsx
   function getCredentialHash(credentialIdBase64: string): number[] {
     const credentialIdBytes = Uint8Array.from(
       atob(credentialIdBase64), 
       c => c.charCodeAt(0)
     );
     return Array.from(sha256(credentialIdBytes));
   }
   ```

---

## Understanding S-Normalization

Here's a critical security detail that LazorKit handles automatically.

WebAuthn signatures use the **secp256r1** curve, which produces signatures in `(r, s)` format. However, for any valid signature, `(r, n - s)` is also mathematically valid (where `n` is the curve order). This creates a **signature malleability** vulnerability.

Solana's on-chain verifier requires **"low-S"** signatures—where `s` must be less than `n/2`.

Here's how we normalize signatures:

```tsx
// secp256r1 curve order
const SECP256R1_ORDER = new Uint8Array([
  0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
  0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51
]);

// Half of curve order (threshold for low-S)
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
}
```

This normalization is **automatic** in LazorKit—you never have to think about it!

---

## Handling WebAuthn Errors Gracefully

Real-world apps need robust error handling. Here's our error classification:

```tsx
const LazorErrorCode = {
  USER_CANCELLED: 'USER_CANCELLED',
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  PASSKEY_NOT_FOUND: 'PASSKEY_NOT_FOUND',
  BIOMETRICS_DISABLED: 'BIOMETRICS_DISABLED',
  SECURITY_ERROR: 'SECURITY_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

class LazorError extends Error {
  static fromWebAuthnError(error: unknown): LazorError {
    if (!(error instanceof Error)) {
      return new LazorError(LazorErrorCode.UNKNOWN, String(error));
    }

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
      : new LazorError(LazorErrorCode.UNKNOWN, error.message, error);
  }
}
```

---

## Passkeys vs. Seed Phrases: The Complete Comparison

| Feature | Seed Phrases | Passkeys (LazorKit) |
|---------|-------------|---------------------|
| **Backup Required** | ❌ Yes (12-24 words) | ✅ No (synced via iCloud/Google) |
| **Phishing Risk** | ❌ High (can be typed) | ✅ None (biometric + domain-bound) |
| **Device Loss** | ❌ Funds lost if no backup | ✅ Restore via cloud sync |
| **User Experience** | ❌ Confusing for newcomers | ✅ Familiar (like Apple Pay) |
| **Hardware Security** | ❌ Software-only by default | ✅ Secure Enclave backed |
| **Multi-device** | ⚠️ Manual sync required | ✅ Automatic via passkey sync |
| **Recovery** | ❌ Social engineering risk | ✅ Standard device recovery |

---

## What's Next?

Now that you've created your first LazorKit wallet, you're ready to:

1. **[Going Gasless](/tutorials/gasless-transactions)** - Learn how to send transactions without paying SOL fees
2. **[Sign Messages](/tutorials/sign-messages)** - Authenticate users with cryptographic signatures
3. **[Build a Subscription Manager](/subscription)** - Create real-world payment flows

---

## Key Takeaways

1. **Passkeys eliminate seed phrases** while improving security
2. **Hardware-backed keys** in secure enclaves protect your assets
3. **S-normalization** is handled automatically—LazorKit abstracts the complexity
4. **WebAuthn errors** are gracefully mapped to user-friendly messages
5. **Smart wallet PDAs** are deterministically derived from your credentials

Welcome to the passkey-powered future of Solana! 🚀

