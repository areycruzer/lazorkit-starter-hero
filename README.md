# 🚀 LazorKit Starter Hero

A production-ready starter template for building passkey-native Solana applications with **LazorKit**. No seed phrases. No browser extensions. Just biometrics.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![LazorKit](https://img.shields.io/badge/LazorKit-Passkeys-14F195?style=flat)](https://lazorkit.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)

---

## 🎯 Live Demo

**👉 [View Live Demo](https://lazorkit-starter-hero.vercel.app)**

---

## 🤔 Why LazorKit?

Traditional crypto wallets have a **terrible UX**:

| Problem | Traditional Wallets | LazorKit |
|---------|-------------------|----------|
| **Onboarding** | Write down 12-24 words | Tap FaceID once |
| **Security** | Seed phrases get phished | Hardware-backed, domain-bound |
| **Recovery** | Lost phrase = lost funds | Syncs via iCloud/Google |
| **Gas Fees** | Users need SOL first | Gasless via paymaster |
| **Mobile UX** | Clunky browser extensions | Native biometric auth |

### Technical Advantages

- **🔐 secp256r1 (P-256) Signatures**: Uses the same elliptic curve as Apple's Secure Enclave and Android's StrongBox
- **⛽ Gasless Transactions**: Users pay in USDC (or any token) while sponsors cover SOL fees
- **📱 Cross-Device Sync**: Passkeys sync automatically via iCloud Keychain or Google Password Manager
- **🛡️ No Phishing Risk**: Credentials are domain-bound and require biometric verification
- **⚡ Smart Wallets**: Programmable accounts with spending limits, session keys, and social recovery

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- A modern browser with WebAuthn support (Chrome, Safari, Firefox, Edge)
- HTTPS environment (localhost works for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lazorkit-starter-hero.git
cd lazorkit-starter-hero

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

### Environment Variables (Optional)

Create a `.env` file to customize the configuration:

```env
VITE_RPC_URL=https://api.devnet.solana.com
VITE_PORTAL_URL=https://portal.lazor.sh
VITE_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

---

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── WalletButton.tsx  # Connect/disconnect wallet button
│   ├── SubscriptionManager.tsx  # Gasless subscription demo
│   ├── Navbar.tsx        # Navigation header
│   ├── Footer.tsx        # Site footer
│   └── Layout.tsx        # Page layout wrapper
├── context/
│   ├── WalletContext.tsx # LazorkitProvider wrapper
│   └── LazorContext.tsx  # Advanced wallet management
├── hooks/
│   ├── useTransfer.ts    # SOL transfer hook
│   └── useSignMessage.ts # Message signing hook
├── pages/
│   ├── HomePage.tsx      # Landing page
│   ├── DemoPage.tsx      # Interactive demos
│   ├── SubscriptionPage.tsx  # Subscription flow
│   └── TutorialsPage.tsx # Tutorial listing
├── tutorials/
│   ├── TutorialDetail.tsx    # Tutorial viewer
│   ├── passkey-wallet-setup.md   # Passkey tutorial
│   └── gasless-transactions.md   # Gasless tutorial
└── App.tsx               # Main app with routing
```

---

## 🔑 Key Features

### 1. Passkey Wallet Creation

Create a wallet with one biometric prompt:

```tsx
import { useWallet } from '@lazorkit/wallet';

function CreateWallet() {
  const { connect, smartWalletPubkey } = useWallet();
  
  return (
    <button onClick={() => connect()}>
      {smartWalletPubkey 
        ? `Connected: ${smartWalletPubkey.toBase58().slice(0, 8)}...`
        : 'Create Wallet with FaceID'}
    </button>
  );
}
```

### 2. Gasless USDC Transfers

Send tokens without needing SOL:

```tsx
import { useWallet } from '@lazorkit/wallet';

function SendUsdc() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();
  
  const handleSend = async () => {
    const instruction = createUsdcTransferInstruction(
      smartWalletPubkey,
      recipientAddress,
      amount
    );
    
    // Paymaster sponsors the gas fee!
    await signAndSendTransaction({ instructions: [instruction] });
  };
  
  return <button onClick={handleSend}>Send USDC (Gasless)</button>;
}
```

### 3. Session Persistence & Recovery

The app automatically persists wallet sessions and supports cross-device recovery:

```tsx
import { useLazor } from './context/LazorContext';

function RecoverWallet() {
  const { hasStoredSession, recoverWallet } = useLazor();
  
  if (hasStoredSession) {
    return <p>Session will auto-restore on load</p>;
  }
  
  return (
    <button onClick={recoverWallet}>
      Recover Wallet from Passkey
    </button>
  );
}
```

---

## 🔒 Security Features

### S-Normalization

LazorKit automatically normalizes signatures to prevent malleability attacks:

```tsx
// Handled automatically by LazorContext
function normalizeSignatureS(signature: Uint8Array): Uint8Array {
  const s = signature.slice(32, 64);
  
  // If S > n/2, compute S' = n - S
  if (compareBigEndian(s, SECP256R1_HALF_ORDER) > 0) {
    return subtractAndNormalize(signature);
  }
  
  return signature;
}
```

### Signer Verification

All custom instructions include proper signer checks:

```tsx
// In serializeInstructions()
for (const key of ix.keys) {
  parts.push(key.pubkey.toBytes());
  parts.push(new Uint8Array([
    key.isSigner ? 1 : 0,   // ← Signer flag preserved
    key.isWritable ? 1 : 0
  ]));
}
```

### WebAuthn Error Handling

Comprehensive error mapping for all WebAuthn failure modes:

```tsx
const errorMap = {
  NotAllowedError: 'Authentication cancelled',
  NotSupportedError: 'Passkeys not supported',
  SecurityError: 'HTTPS required',
  AbortError: 'Operation timed out',
};
```

---

## 🌐 Network Configuration

This starter uses **Solana Devnet** by default. All RPC URLs, paymaster endpoints, and token mints are configured for Devnet.

| Service | URL |
|---------|-----|
| RPC | `https://api.devnet.solana.com` |
| Paymaster | `https://kora.devnet.lazorkit.com` |
| Portal | `https://portal.lazor.sh` |
| USDC Mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

To switch to mainnet, update the environment variables accordingly.

---

## 📚 Tutorials

Learn how to use LazorKit with our in-depth tutorials:

1. **[From Seed Phrases to FaceID](/tutorials/passkey-wallet-setup)** - Understanding passkeys and creating your first wallet
2. **[Going Gasless](/tutorials/gasless-transactions)** - Sponsoring USDC transactions with smart wallets

---

## 🛠️ Built With

- **[Vite](https://vite.dev)** - Next-generation frontend tooling
- **[React 19](https://react.dev)** - UI framework
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first styling
- **[@lazorkit/wallet](https://www.npmjs.com/package/@lazorkit/wallet)** - Passkey wallet SDK
- **[@solana/web3.js](https://solana-labs.github.io/solana-web3.js)** - Solana JavaScript SDK
- **[Lucide React](https://lucide.dev)** - Beautiful icons

---

## 🚀 Deployment

### Vercel

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[LazorKit](https://lazorkit.com)** - For the amazing passkey wallet SDK
- **[Solana](https://solana.com)** - For the blazing fast blockchain

---

<p align="center">
  Built with ❤️ by <strong>areycruzer</strong>
</p>
