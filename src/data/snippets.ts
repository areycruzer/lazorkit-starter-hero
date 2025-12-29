export const SNIPPETS = {
    PROVIDER_SETUP: `import { LazorkitProvider } from '@lazorkit/wallet';

function App() {
  return (
    <LazorkitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      paymasterConfig={{
        paymasterUrl: "https://kora.devnet.lazorkit.com"
      }}
    >
      <YourApp />
    </LazorkitProvider>
  );
}`,
    USE_WALLET: `import { useWallet } from '@lazorkit/wallet';

function WalletComponent() {
  const {
    connect,
    disconnect,
    isConnected,
    smartWalletPubkey,
    signMessage,
    signAndSendTransaction,
  } = useWallet();

  // Your wallet logic here
}`,
    REACT_HOOK_MINIMAL: `const { connect } = useWallet();`
};
