/**
 * LazorContext.tsx - Advanced LazorKit Wallet Management
 * 
 * This context provides low-level control over LazorKit smart wallets with:
 * - Passkey wallet creation
 * - Gasless transaction execution
 * - S-normalization for secp256r1 signatures
 * - Optimized transaction flow (Direct Execute vs CreateChunk)
 * - Robust WebAuthn error handling
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo,
  useEffect 
} from 'react';
import type { ReactNode } from 'react';
import { 
  Connection, 
  PublicKey, 
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

// ============================================================================
// SHA256 IMPLEMENTATION
// ============================================================================

/**
 * Synchronous SHA256 implementation
 * We implement this ourselves to avoid module resolution issues
 */
function sha256(data: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  const rotr = (x: number, n: number): number => ((x >>> n) | (x << (32 - n))) >>> 0;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const bitLength = data.length * 8;
  const padLength = ((data.length + 9 + 63) & ~63) - data.length;
  const padded = new Uint8Array(data.length + padLength);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLength, false);

  const w = new Uint32Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j-15], 7) ^ rotr(w[j-15], 18) ^ (w[j-15] >>> 3);
      const s1 = rotr(w[j-2], 17) ^ rotr(w[j-2], 19) ^ (w[j-2] >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, h0, false); resultView.setUint32(4, h1, false);
  resultView.setUint32(8, h2, false); resultView.setUint32(12, h3, false);
  resultView.setUint32(16, h4, false); resultView.setUint32(20, h5, false);
  resultView.setUint32(24, h6, false); resultView.setUint32(28, h7, false);
  return result;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// LazorKit Program IDs
export const LAZORKIT_PROGRAM_ID = new PublicKey('Gsuz7YcA5sbMGVRXT3xSYhJBessW4xFC4xYsihNCqMFh');
export const DEFAULT_POLICY_PROGRAM_ID = new PublicKey('BiE9vSdz9MidUiyjVYsu3PG4C1fbPZ8CVPADA9jRfXw7');

// PDA Seeds
const SMART_WALLET_SEED = 'smart_wallet';
const WALLET_STATE_SEED = 'wallet_state';
const WALLET_DEVICE_SEED = 'wallet_device';
const CHUNK_SEED = 'chunk';

// secp256r1 curve constants for S-normalization
// The order n of the secp256r1 curve
const SECP256R1_ORDER = new Uint8Array([
  0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
  0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51
]);

// Half of the curve order (n/2) - threshold for low-S normalization
const SECP256R1_HALF_ORDER = new Uint8Array([
  0x7f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00,
  0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xde, 0x73, 0x7d, 0x56, 0xd3, 0x8b, 0xcf, 0x42,
  0x79, 0xdc, 0xe5, 0x61, 0x7e, 0x31, 0x92, 0xa8
]);

// Solana transaction size limit
const SOLANA_TX_SIZE_LIMIT = 1232;

// ============================================================================
// TYPES
// ============================================================================

export type SmartWalletAction = 'Execute' | 'CreateChunk' | 'ExecuteChunk';

export interface PasskeyCredential {
  credentialId: string;        // Base64-encoded credential ID
  credentialHash: number[];    // SHA256 of credential ID (32 bytes)
  passkeyPubkey: number[];     // Compressed public key (33 bytes)
}

export interface SmartWalletInfo {
  smartWallet: PublicKey;
  walletState: PublicKey;
  walletDevice: PublicKey;
  credential: PasskeyCredential;
}

export interface PasskeySignature {
  passkeyPublicKey: number[];       // 33 bytes compressed
  signature64: number[];            // 64 bytes (r || s, normalized)
  clientDataJsonRaw: number[];      // Raw client data JSON bytes
  authenticatorDataRaw: number[];   // Raw authenticator data bytes
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface LazorContextType {
  // State
  connection: Connection | null;
  walletInfo: SmartWalletInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  error: LazorError | null;
  hasStoredSession: boolean;
  
  // Actions
  createPasskeyWallet: (accountName?: string) => Promise<SmartWalletInfo>;
  connectExistingWallet: (credentialId: string, passkeyPubkey: number[]) => Promise<SmartWalletInfo>;
  sendGaslessTransaction: (instructions: TransactionInstruction[]) => Promise<TransactionResult>;
  signMessage: (message: string) => Promise<PasskeySignature>;
  disconnect: () => void;
  clearError: () => void;
  recoverWallet: () => Promise<SmartWalletInfo | null>;
  tryAutoRestore: () => Promise<void>;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export const LazorErrorCode = {
  USER_CANCELLED: 'USER_CANCELLED',
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  PASSKEY_NOT_FOUND: 'PASSKEY_NOT_FOUND',
  BIOMETRICS_DISABLED: 'BIOMETRICS_DISABLED',
  SECURITY_ERROR: 'SECURITY_ERROR',
  TIMEOUT: 'TIMEOUT',
  TRANSACTION_TOO_LARGE: 'TRANSACTION_TOO_LARGE',
  SIGNATURE_FAILED: 'SIGNATURE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type LazorErrorCode = typeof LazorErrorCode[keyof typeof LazorErrorCode];

export class LazorError extends Error {
  code: LazorErrorCode;
  originalError?: Error;

  constructor(code: LazorErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'LazorError';
    this.code = code;
    this.originalError = originalError;
  }

  static fromWebAuthnError(error: unknown): LazorError {
    if (!(error instanceof Error)) {
      return new LazorError(LazorErrorCode.UNKNOWN, String(error));
    }

    const errorMap: Record<string, { code: LazorErrorCode; message: string }> = {
      NotAllowedError: {
        code: LazorErrorCode.USER_CANCELLED,
        message: 'Authentication was cancelled or blocked. Please try again.',
      },
      NotSupportedError: {
        code: LazorErrorCode.WEBAUTHN_NOT_SUPPORTED,
        message: 'Passkeys are not supported on this device or browser.',
      },
      NotReadableError: {
        code: LazorErrorCode.BIOMETRICS_DISABLED,
        message: 'Unable to read biometrics. Please check your device settings.',
      },
      SecurityError: {
        code: LazorErrorCode.SECURITY_ERROR,
        message: 'Security error. Please ensure you are using HTTPS.',
      },
      AbortError: {
        code: LazorErrorCode.TIMEOUT,
        message: 'The operation timed out. Please try again.',
      },
      InvalidStateError: {
        code: LazorErrorCode.PASSKEY_NOT_FOUND,
        message: 'Passkey already exists or is in an invalid state.',
      },
    };

    const mapped = errorMap[error.name];
    if (mapped) {
      return new LazorError(mapped.code, mapped.message, error);
    }

    return new LazorError(LazorErrorCode.UNKNOWN, error.message, error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compare two big-endian byte arrays
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareBigEndian(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

/**
 * Subtract two big-endian byte arrays: result = a - b
 * Assumes a >= b
 */
function subtractBigEndian(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length);
  let borrow = 0;
  
  for (let i = a.length - 1; i >= 0; i--) {
    const diff = a[i] - b[i] - borrow;
    if (diff < 0) {
      result[i] = diff + 256;
      borrow = 1;
    } else {
      result[i] = diff;
      borrow = 0;
    }
  }
  
  return result;
}

/**
 * CRITICAL: Normalize the S value of a secp256r1 signature to low-S form
 * 
 * Solana's secp256r1 signature verification requires "low-S" signatures.
 * If S > n/2, we need to compute S' = n - S to get the normalized form.
 * 
 * This prevents signature malleability attacks.
 */
export function normalizeSignatureS(signature: Uint8Array): Uint8Array {
  if (signature.length !== 64) {
    throw new LazorError(
      LazorErrorCode.SIGNATURE_FAILED,
      `Invalid signature length: expected 64, got ${signature.length}`
    );
  }

  // Split signature into R (first 32 bytes) and S (last 32 bytes)
  const r = signature.slice(0, 32);
  const s = signature.slice(32, 64);

  // Check if S > n/2 (half order)
  if (compareBigEndian(s, SECP256R1_HALF_ORDER) > 0) {
    // S is too high, compute S' = n - S
    const normalizedS = subtractBigEndian(SECP256R1_ORDER, s);
    
    // Return R || S'
    const normalized = new Uint8Array(64);
    normalized.set(r, 0);
    normalized.set(normalizedS, 32);
    return normalized;
  }

  // S is already in low-S form
  return signature;
}

/**
 * Parse DER-encoded signature to raw R || S format
 * WebAuthn returns DER-encoded signatures that need to be converted
 */
export function parseDERSignature(derSignature: Uint8Array): Uint8Array {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  let offset = 0;
  
  if (derSignature[offset++] !== 0x30) {
    throw new LazorError(LazorErrorCode.SIGNATURE_FAILED, 'Invalid DER signature: missing SEQUENCE tag');
  }
  
  const totalLen = derSignature[offset++];
  if (totalLen > 127) {
    // Handle extended length (unlikely for ECDSA signatures)
    offset += (totalLen & 0x7f);
  }
  
  // Parse R
  if (derSignature[offset++] !== 0x02) {
    throw new LazorError(LazorErrorCode.SIGNATURE_FAILED, 'Invalid DER signature: missing INTEGER tag for R');
  }
  
  let rLen = derSignature[offset++];
  let rStart = offset;
  
  // Skip leading zero if present (used for positive number representation)
  if (derSignature[rStart] === 0x00 && rLen > 32) {
    rStart++;
    rLen--;
  }
  
  offset += derSignature[offset - 1]; // Move past R (use original length)
  if (derSignature[rStart - 1] === 0x00) offset--; // Adjust if we skipped zero
  offset = rStart + rLen;
  
  // Parse S
  if (derSignature[offset++] !== 0x02) {
    throw new LazorError(LazorErrorCode.SIGNATURE_FAILED, 'Invalid DER signature: missing INTEGER tag for S');
  }
  
  let sLen = derSignature[offset++];
  let sStart = offset;
  
  // Skip leading zero if present
  if (derSignature[sStart] === 0x00 && sLen > 32) {
    sStart++;
    sLen--;
  }
  
  // Build 64-byte signature (R || S), padding to 32 bytes each
  const signature = new Uint8Array(64);
  
  // Copy R (right-aligned in 32 bytes)
  const rPadding = 32 - Math.min(rLen, 32);
  signature.set(derSignature.slice(rStart, rStart + Math.min(rLen, 32)), rPadding);
  
  // Copy S (right-aligned in 32 bytes)
  const sPadding = 32 - Math.min(sLen, 32);
  signature.set(derSignature.slice(sStart, sStart + Math.min(sLen, 32)), 32 + sPadding);
  
  return signature;
}

/**
 * Get credential hash from credential ID
 */
export function getCredentialHash(credentialIdBase64: string): number[] {
  const credentialIdBytes = Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0));
  return Array.from(sha256(credentialIdBytes));
}

/**
 * Derive Smart Wallet PDA
 */
export function deriveSmartWalletPda(walletId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SMART_WALLET_SEED),
      walletId.toArrayLike(Buffer, 'le', 8)
    ],
    LAZORKIT_PROGRAM_ID
  );
}

/**
 * Derive Wallet State PDA
 */
export function deriveWalletStatePda(smartWallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(WALLET_STATE_SEED),
      smartWallet.toBuffer()
    ],
    LAZORKIT_PROGRAM_ID
  );
}

/**
 * Derive Wallet Device PDA
 */
export function deriveWalletDevicePda(
  smartWallet: PublicKey, 
  credentialHash: number[]
): [PublicKey, number] {
  // Create device hash from smartWallet + credentialHash
  const deviceHashInput = new Uint8Array([
    ...smartWallet.toBytes(),
    ...new Uint8Array(credentialHash)
  ]);
  const deviceHash = sha256(deviceHashInput);
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(WALLET_DEVICE_SEED),
      Buffer.from(deviceHash)
    ],
    LAZORKIT_PROGRAM_ID
  );
}

/**
 * Derive Chunk PDA for deferred execution
 */
export function deriveChunkPda(smartWallet: PublicKey, nonce: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(CHUNK_SEED),
      smartWallet.toBuffer(),
      nonce.toArrayLike(Buffer, 'le', 8)
    ],
    LAZORKIT_PROGRAM_ID
  );
}

/**
 * Estimate transaction size
 */
function estimateTransactionSize(
  instructions: TransactionInstruction[],
  payer: PublicKey
): number {
  // Build a dummy transaction to estimate size
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: '11111111111111111111111111111111', // Dummy blockhash
    instructions,
  }).compileToV0Message();
  
  const tx = new VersionedTransaction(message);
  return tx.serialize().length;
}

/**
 * Determine optimal execution flow based on transaction size
 */
export function determineExecutionFlow(
  instructions: TransactionInstruction[],
  payer: PublicKey
): 'direct' | 'chunked' {
  // Single instruction can use direct execute
  if (instructions.length === 1) {
    try {
      const size = estimateTransactionSize(instructions, payer);
      // Use direct if under limit with safety margin for signature overhead
      if (size < SOLANA_TX_SIZE_LIMIT - 200) {
        return 'direct';
      }
    } catch {
      // If estimation fails, fall back to chunked
      return 'chunked';
    }
  }
  
  return 'chunked';
}

/**
 * Build authorization message for passkey signing
 */
export function buildAuthorizationMessage(params: {
  action: SmartWalletAction;
  timestamp: BN;
  smartWallet: PublicKey;
  cpiHash?: number[];
}): Uint8Array {
  const { action, timestamp, smartWallet, cpiHash } = params;
  
  // Action byte: 0 = Execute, 1 = CreateChunk, 2 = ExecuteChunk
  const actionByte = action === 'Execute' ? 0 : action === 'CreateChunk' ? 1 : 2;
  
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
}

// ============================================================================
// CONTEXT
// ============================================================================

const LazorContext = createContext<LazorContextType | null>(null);

interface LazorProviderProps {
  children: ReactNode;
  rpcUrl?: string;
  portalUrl?: string;
  paymasterUrl?: string;
}

export function LazorProvider({ 
  children, 
  rpcUrl = 'https://api.devnet.solana.com',
  // portalUrl is reserved for future use with the LazorKit portal
  portalUrl: _portalUrl = 'https://portal.lazor.sh',
  paymasterUrl = 'https://kora.devnet.lazorkit.com',
}: LazorProviderProps) {
  // Suppress unused variable warning
  void _portalUrl;
  const [walletInfo, setWalletInfo] = useState<SmartWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LazorError | null>(null);

  // Memoized connection
  const connection = useMemo(() => new Connection(rpcUrl, 'confirmed'), [rpcUrl]);

  /**
   * Check if WebAuthn is supported
   */
  const checkWebAuthnSupport = useCallback(() => {
    if (!window.PublicKeyCredential) {
      throw new LazorError(
        LazorErrorCode.WEBAUTHN_NOT_SUPPORTED,
        'WebAuthn is not supported in this browser'
      );
    }
  }, []);

  /**
   * Create a new passkey wallet
   */
  const createPasskeyWallet = useCallback(async (accountName = 'LazorKit Wallet'): Promise<SmartWalletInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      checkWebAuthnSupport();

      // Generate unique wallet ID
      const walletId = new BN(Date.now());
      
      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'LazorKit',
            id: window.location.hostname,
          },
          user: {
            id: walletId.toArrayLike(Uint8Array, 'le', 8),
            name: accountName,
            displayName: accountName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256 (P-256)
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new LazorError(LazorErrorCode.USER_CANCELLED, 'Credential creation was cancelled');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extract public key from attestation
      const publicKeyBytes = extractPublicKeyFromAttestation(response);
      
      // Create credential info
      const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const credentialHash = getCredentialHash(credentialIdBase64);

      // Derive PDAs
      const [smartWallet] = deriveSmartWalletPda(walletId);
      const [walletState] = deriveWalletStatePda(smartWallet);
      const [walletDevice] = deriveWalletDevicePda(smartWallet, credentialHash);

      const info: SmartWalletInfo = {
        smartWallet,
        walletState,
        walletDevice,
        credential: {
          credentialId: credentialIdBase64,
          credentialHash,
          passkeyPubkey: Array.from(publicKeyBytes),
        },
      };

      setWalletInfo(info);
      
      // Store in localStorage for session persistence
      localStorage.setItem('lazorkit_wallet', JSON.stringify({
        credentialId: credentialIdBase64,
        passkeyPubkey: Array.from(publicKeyBytes),
        smartWallet: smartWallet.toBase58(),
      }));

      return info;
    } catch (err) {
      const lazorError = LazorError.fromWebAuthnError(err);
      setError(lazorError);
      throw lazorError;
    } finally {
      setIsLoading(false);
    }
  }, [checkWebAuthnSupport]);

  /**
   * Connect to an existing wallet using stored credentials
   */
  const connectExistingWallet = useCallback(async (
    credentialId: string, 
    passkeyPubkey: number[]
  ): Promise<SmartWalletInfo> => {
    setIsLoading(true);
    setError(null);

    try {
      const credentialHash = getCredentialHash(credentialId);
      
      // We need to derive the wallet ID from stored data or fetch from chain
      // For now, use a placeholder approach - in production, query on-chain
      const storedData = localStorage.getItem('lazorkit_wallet');
      if (!storedData) {
        throw new LazorError(LazorErrorCode.PASSKEY_NOT_FOUND, 'No stored wallet found');
      }

      const parsed = JSON.parse(storedData);
      const smartWallet = new PublicKey(parsed.smartWallet);
      const [walletState] = deriveWalletStatePda(smartWallet);
      const [walletDevice] = deriveWalletDevicePda(smartWallet, credentialHash);

      const info: SmartWalletInfo = {
        smartWallet,
        walletState,
        walletDevice,
        credential: {
          credentialId,
          credentialHash,
          passkeyPubkey,
        },
      };

      setWalletInfo(info);
      return info;
    } catch (err) {
      const lazorError = err instanceof LazorError ? err : LazorError.fromWebAuthnError(err);
      setError(lazorError);
      throw lazorError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign a message using the passkey
   */
  const signMessage = useCallback(async (message: string): Promise<PasskeySignature> => {
    if (!walletInfo) {
      throw new LazorError(LazorErrorCode.PASSKEY_NOT_FOUND, 'No wallet connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      checkWebAuthnSupport();

      // Encode message as challenge
      const encoder = new TextEncoder();
      const challenge = encoder.encode(message);

      // Request signature
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            type: 'public-key',
            id: Uint8Array.from(atob(walletInfo.credential.credentialId), c => c.charCodeAt(0)),
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new LazorError(LazorErrorCode.USER_CANCELLED, 'Signing was cancelled');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Parse DER signature and normalize S
      const rawSignature = parseDERSignature(new Uint8Array(response.signature));
      const normalizedSignature = normalizeSignatureS(rawSignature);

      return {
        passkeyPublicKey: walletInfo.credential.passkeyPubkey,
        signature64: Array.from(normalizedSignature),
        clientDataJsonRaw: Array.from(new Uint8Array(response.clientDataJSON)),
        authenticatorDataRaw: Array.from(new Uint8Array(response.authenticatorData)),
      };
    } catch (err) {
      const lazorError = LazorError.fromWebAuthnError(err);
      setError(lazorError);
      throw lazorError;
    } finally {
      setIsLoading(false);
    }
  }, [walletInfo, checkWebAuthnSupport]);

  /**
   * Send a gasless transaction via the paymaster
   * Automatically chooses between Direct Execute and CreateChunk based on transaction size
   */
  const sendGaslessTransaction = useCallback(async (
    instructions: TransactionInstruction[]
  ): Promise<TransactionResult> => {
    if (!walletInfo) {
      throw new LazorError(LazorErrorCode.PASSKEY_NOT_FOUND, 'No wallet connected');
    }

    if (instructions.length === 0) {
      throw new LazorError(LazorErrorCode.UNKNOWN, 'No instructions provided');
    }

    setIsLoading(true);
    setError(null);

    try {
      const timestamp = new BN(Math.floor(Date.now() / 1000));
      
      // Determine execution flow
      const flow = determineExecutionFlow(instructions, walletInfo.smartWallet);
      console.log(`Using ${flow} execution flow for ${instructions.length} instruction(s)`);

      // Build authorization message
      const action: SmartWalletAction = flow === 'direct' ? 'Execute' : 'CreateChunk';
      
      // Hash of CPI instructions for CreateChunk
      const cpiHash: number[] | undefined = flow === 'chunked' 
        ? Array.from(sha256(serializeInstructions(instructions))) as number[]
        : undefined;

      const authMessage = buildAuthorizationMessage({
        action,
        timestamp,
        smartWallet: walletInfo.smartWallet,
        cpiHash,
      });

      // Get passkey signature using the authorization message as challenge
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: authMessage.buffer as ArrayBuffer,
          allowCredentials: [{
            type: 'public-key',
            id: Uint8Array.from(atob(walletInfo.credential.credentialId), c => c.charCodeAt(0)),
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new LazorError(LazorErrorCode.USER_CANCELLED, 'Transaction signing was cancelled');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Parse and normalize signature (CRITICAL!)
      const rawSignature = parseDERSignature(new Uint8Array(response.signature));
      const normalizedSignature = normalizeSignatureS(rawSignature);

      console.log('Signature normalized:', {
        original: Array.from(rawSignature.slice(32, 64)).slice(0, 4),
        normalized: Array.from(normalizedSignature.slice(32, 64)).slice(0, 4),
      });

      // Build passkey signature structure
      const passkeySignature: PasskeySignature = {
        passkeyPublicKey: walletInfo.credential.passkeyPubkey,
        signature64: Array.from(normalizedSignature),
        clientDataJsonRaw: Array.from(new Uint8Array(response.clientDataJSON)),
        authenticatorDataRaw: Array.from(new Uint8Array(response.authenticatorData)),
      };

      // Send to paymaster
      const result = await submitToPaymaster({
        paymasterUrl,
        flow,
        instructions,
        smartWallet: walletInfo.smartWallet,
        credentialHash: walletInfo.credential.credentialHash,
        passkeySignature,
        timestamp,
        connection,
      });

      return result;
    } catch (err) {
      const lazorError = err instanceof LazorError ? err : LazorError.fromWebAuthnError(err);
      setError(lazorError);
      throw lazorError;
    } finally {
      setIsLoading(false);
    }
  }, [walletInfo, paymasterUrl, connection]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setWalletInfo(null);
    setError(null);
    localStorage.removeItem('lazorkit_wallet');
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if there's a stored session available
   */
  const hasStoredSession = useMemo(() => {
    try {
      const stored = localStorage.getItem('lazorkit_wallet');
      return stored !== null;
    } catch {
      return false;
    }
  }, []);

  /**
   * Recover wallet from stored session (requires user biometric confirmation)
   * This is used when switching devices - passkeys sync via iCloud/Google
   */
  const recoverWallet = useCallback(async (): Promise<SmartWalletInfo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      checkWebAuthnSupport();

      // Attempt discoverable credential flow (passkeys synced across devices)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: 'required',
          timeout: 60000,
          // Empty allowCredentials enables discoverable credentials
        },
        mediation: 'optional',
      }) as PublicKeyCredential | null;

      if (!credential) {
        // User cancelled or no discoverable credentials
        return null;
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Extract credential ID
      const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const credentialHash = getCredentialHash(credentialIdBase64);

      // For recovery, we need to query the chain for wallet info
      // or use the userHandle if available
      let smartWalletAddress: string | null = null;
      
      // Check if there's stored data we can use
      const storedData = localStorage.getItem('lazorkit_wallet');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.credentialId === credentialIdBase64) {
          smartWalletAddress = parsed.smartWallet;
        }
      }

      // If no stored data, try to extract from userHandle (wallet ID)
      if (!smartWalletAddress && response.userHandle) {
        const walletIdBytes = new Uint8Array(response.userHandle);
        const walletId = new BN(walletIdBytes, 'le');
        const [smartWallet] = deriveSmartWalletPda(walletId);
        smartWalletAddress = smartWallet.toBase58();
      }

      if (!smartWalletAddress) {
        throw new LazorError(
          LazorErrorCode.PASSKEY_NOT_FOUND,
          'Could not recover wallet. Please create a new wallet.'
        );
      }

      const smartWallet = new PublicKey(smartWalletAddress);
      const [walletState] = deriveWalletStatePda(smartWallet);
      const [walletDevice] = deriveWalletDevicePda(smartWallet, credentialHash);

      // We need the public key - extract from response if possible
      // In recovery flow, we may need to fetch from chain
      const passkeyPubkey = storedData 
        ? JSON.parse(storedData).passkeyPubkey 
        : new Array(33).fill(0); // Placeholder - should fetch from chain

      const info: SmartWalletInfo = {
        smartWallet,
        walletState,
        walletDevice,
        credential: {
          credentialId: credentialIdBase64,
          credentialHash,
          passkeyPubkey,
        },
      };

      setWalletInfo(info);

      // Update stored session
      localStorage.setItem('lazorkit_wallet', JSON.stringify({
        credentialId: credentialIdBase64,
        passkeyPubkey,
        smartWallet: smartWallet.toBase58(),
      }));

      return info;
    } catch (err) {
      const lazorError = err instanceof LazorError ? err : LazorError.fromWebAuthnError(err);
      // Don't set error for user cancellation - that's expected
      if (lazorError.code !== LazorErrorCode.USER_CANCELLED) {
        setError(lazorError);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkWebAuthnSupport]);

  /**
   * Try to auto-restore session from localStorage on app load
   * This silently restores the session without requiring biometric confirmation
   * until the user performs an action that requires signing
   */
  const tryAutoRestore = useCallback(async () => {
    try {
      const storedData = localStorage.getItem('lazorkit_wallet');
      if (!storedData) return;

      const parsed = JSON.parse(storedData);
      if (!parsed.credentialId || !parsed.smartWallet || !parsed.passkeyPubkey) {
        // Invalid stored data, clean up
        localStorage.removeItem('lazorkit_wallet');
        return;
      }

      const credentialHash = getCredentialHash(parsed.credentialId);
      const smartWallet = new PublicKey(parsed.smartWallet);
      const [walletState] = deriveWalletStatePda(smartWallet);
      const [walletDevice] = deriveWalletDevicePda(smartWallet, credentialHash);

      const info: SmartWalletInfo = {
        smartWallet,
        walletState,
        walletDevice,
        credential: {
          credentialId: parsed.credentialId,
          credentialHash,
          passkeyPubkey: parsed.passkeyPubkey,
        },
      };

      setWalletInfo(info);
    } catch (err) {
      console.warn('Failed to auto-restore session:', err);
      // Clear invalid session data
      localStorage.removeItem('lazorkit_wallet');
    }
  }, []);

  // Auto-restore session on mount
  useEffect(() => {
    tryAutoRestore();
  }, [tryAutoRestore]);

  const value: LazorContextType = useMemo(() => ({
    connection,
    walletInfo,
    isConnected: walletInfo !== null,
    isLoading,
    error,
    hasStoredSession,
    createPasskeyWallet,
    connectExistingWallet,
    sendGaslessTransaction,
    signMessage,
    disconnect,
    clearError,
    recoverWallet,
    tryAutoRestore,
  }), [
    connection,
    walletInfo,
    isLoading,
    error,
    hasStoredSession,
    createPasskeyWallet,
    connectExistingWallet,
    sendGaslessTransaction,
    signMessage,
    disconnect,
    clearError,
    recoverWallet,
    tryAutoRestore,
  ]);

  return (
    <LazorContext.Provider value={value}>
      {children}
    </LazorContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useLazor(): LazorContextType {
  const context = useContext(LazorContext);
  if (!context) {
    throw new Error('useLazor must be used within a LazorProvider');
  }
  return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract compressed public key from attestation response
 */
function extractPublicKeyFromAttestation(response: AuthenticatorAttestationResponse): Uint8Array {
  // For simplicity, try to use getPublicKey if available (modern browsers)
  if (response.getPublicKey) {
    const spki = response.getPublicKey();
    if (spki) {
      // SPKI format - extract the raw key
      const spkiBytes = new Uint8Array(spki);
      // P-256 uncompressed key is 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
      // We need to compress it to 33 bytes
      const uncompressedKey = spkiBytes.slice(-65);
      return compressPublicKey(uncompressedKey);
    }
  }
  
  // Fallback: parse CBOR from attestation object
  // This is a simplified extraction - production code should use a CBOR library
  console.warn('Using fallback public key extraction');
  return new Uint8Array(33); // Placeholder
}

/**
 * Compress an uncompressed secp256r1 public key
 * Input: 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
 * Output: 33 bytes (0x02/0x03 + 32 bytes X)
 */
function compressPublicKey(uncompressed: Uint8Array): Uint8Array {
  if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
    // Already compressed or invalid
    if (uncompressed.length === 33) {
      return uncompressed;
    }
    throw new LazorError(LazorErrorCode.SIGNATURE_FAILED, 'Invalid public key format');
  }
  
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  
  // Prefix is 0x02 if Y is even, 0x03 if Y is odd
  const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
  
  const compressed = new Uint8Array(33);
  compressed[0] = prefix;
  compressed.set(x, 1);
  
  return compressed;
}

/**
 * Serialize instructions for hashing
 */
function serializeInstructions(instructions: TransactionInstruction[]): Uint8Array {
  const parts: Uint8Array[] = [];
  
  for (const ix of instructions) {
    parts.push(ix.programId.toBytes());
    parts.push(new Uint8Array([ix.keys.length]));
    for (const key of ix.keys) {
      parts.push(key.pubkey.toBytes());
      parts.push(new Uint8Array([key.isSigner ? 1 : 0, key.isWritable ? 1 : 0]));
    }
    parts.push(new Uint8Array([ix.data.length & 0xff, (ix.data.length >> 8) & 0xff]));
    parts.push(ix.data);
  }
  
  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

/**
 * Submit transaction to paymaster for gasless execution
 */
async function submitToPaymaster(params: {
  paymasterUrl: string;
  flow: 'direct' | 'chunked';
  instructions: TransactionInstruction[];
  smartWallet: PublicKey;
  credentialHash: number[];
  passkeySignature: PasskeySignature;
  timestamp: BN;
  connection: Connection;
}): Promise<TransactionResult> {
  const { 
    paymasterUrl, 
    flow, 
    instructions, 
    smartWallet, 
    credentialHash,
    passkeySignature, 
    timestamp,
    connection,
  } = params;

  try {
    // Prepare request payload
    const payload = {
      flow,
      smartWallet: smartWallet.toBase58(),
      credentialHash,
      timestamp: timestamp.toString(),
      instructions: instructions.map(ix => ({
        programId: ix.programId.toBase58(),
        keys: ix.keys.map(k => ({
          pubkey: k.pubkey.toBase58(),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        data: Buffer.from(ix.data).toString('base64'),
      })),
      signature: {
        passkeyPublicKey: passkeySignature.passkeyPublicKey,
        signature64: Buffer.from(passkeySignature.signature64).toString('base64'),
        clientDataJson: Buffer.from(passkeySignature.clientDataJsonRaw).toString('base64'),
        authenticatorData: Buffer.from(passkeySignature.authenticatorDataRaw).toString('base64'),
      },
    };

    // Submit to paymaster
    const response = await fetch(`${paymasterUrl}/v1/transaction/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new LazorError(
        LazorErrorCode.NETWORK_ERROR,
        `Paymaster error: ${errorData.error || response.statusText}`
      );
    }

    const result = await response.json();
    
    // Wait for confirmation if we got a signature
    if (result.signature) {
      await connection.confirmTransaction(result.signature, 'confirmed');
    }

    return {
      signature: result.signature,
      success: true,
    };
  } catch (err) {
    if (err instanceof LazorError) {
      throw err;
    }
    throw new LazorError(
      LazorErrorCode.NETWORK_ERROR,
      `Failed to submit transaction: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LazorProvider;
