# ⚡ LazorKit Starter

A production-ready starter template for building passkey-native Solana applications.

**Zero Seed Phrases. Zero Gas. Just Biometrics.**

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![LazorKit](https://img.shields.io/badge/LazorKit-Passkeys-14F195?style=flat)](https://lazorkit.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)

![LazorKit Dashboard](/public/assets/lazorkit_logo.png)

---

## 📸 Screenshots

<p align="center">
  <img src="/public/unnamed.jpg" alt="Smart Wallet UI" width="32%" />
  <img src="/public/43.jpg" alt="Transaction Success" width="32%" />
  <img src="/public/222.jpg" alt="Debug Console" width="32%" />
</p>

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **🔐 Biometric Auth** | Create wallets with FaceID, TouchID, or Windows Hello. No extensions required. |
| **⛽ Gasless Transactions** | Built-in Paymaster support. Users pay $0 SOL for gas. |
| **🛡️ Smart Accounts** | Programmable wallets with session keys, spending limits, and social recovery. |
| **📱 Mobile First** | Fully responsive layout optimized for mobile browsers and PWA installation. |

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/your-username/lazorkit-starter.git
cd lazorkit-starter
npm install
```

### 2. Development

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 3. Build for Production

```bash
npm run build
```

---

## 🧪 Testing Guide: Try the Interactive Demo

We have built a fully functional **Interactive Playground** to test real properties of LazorKit on Solana Devnet.

### Step 1: Create a Wallet
1.  Click **"Connect Wallet"** in the navbar.
2.  Follow your browser's prompt to create a **Passkey** (FaceID/TouchID).
3.  *Result*: You now have a non-custodial Solana wallet secured by your device's Secure Enclave!

### Step 2: Get Devnet SOL (Airdrop)
1.  Navigate to the **Live Demo** page (`/demo`).
2.  Your new wallet starts with 0 SOL.
3.  Click the **"Get Devnet SOL"** button at the top right.
4.  *Result*: You will receive **1 SOL** for testing.

### Step 3: Send a Real Transaction
1.  In the "Send Transaction" card:
    *   **Amount**: Enter `0.001` (or any small amount).
    *   **Recipient**: Leave empty to send to yourself (loopback) or enter a friend's address.
2.  Click **"Send"**.
3.  Authorize with your Passkey again.
4.  *Result*: The transaction is signed, sent, and confirmed on Devnet. You will see a `Transaction sent!` success message with an **Explorer Link**.

### Step 4: Sign a Message
1.  In the "Sign Message" card, type any text (e.g., "Hello World").
2.  Click **"Sign"**.
3.  *Result*: Your device cryptographically signs the message without costing any gas.

---

## 📁 Project Structure

```
src/
├── components/           # UI Components (BentoCard, Badge, etc.)
├── context/              # LazorKit Provider Setup
├── pages/                # Route Pages (Home, Demo, Tutorials)
│   ├── HomePage.tsx      # Landing Page
│   ├── DemoPage.tsx      # Interactive Playground (Real Transactions)
│   └── TutorialsPage.tsx # Guides & Documentation
├── tutorials/            # Content for Tutorial Pages
└── data/                 # Shared Snippets & Constants
```

## 🛠️ Tech Stack

*   **Framework**: React 19 + Vite
*   **Styling**: Tailwind CSS v4 + Framer Motion
*   **Blockchain**: @solana/web3.js
*   **Wallet**: @lazorkit/wallet (WebAuthn/Passkeys)

---

<p align="center">
  Built with ❤️ by <strong>LazorKit Team</strong>
</p>
