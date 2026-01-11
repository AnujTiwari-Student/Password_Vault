import * as bip39 from "bip39";

const PBKDF2_ITERATIONS = 100000;
const AES_GCM_KEY_LENGTH = 256;
const VERIFIER_LENGTH_BYTES = 32;
const UMK_SALT_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const RSA_MODULUS_LENGTH = 2048;

interface UMKData {
  umk_salt: string;
  master_passphrase_verifier: string;
  umkCryptoKey: CryptoKey;
}

export const generateMnemonicPassphrase = (): string => {
  return bip39.generateMnemonic(256);
};

export const generateRandomBytes = (length: number): Uint8Array => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  throw new Error("Secure random number generation is not supported.");
};

export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  let binary = "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const deriveUMKData = async (
  masterKey: string,
  storedSaltBase64?: string
): Promise<UMKData> => {
  let saltBuffer: Uint8Array;
  let umk_salt: string;

  if (storedSaltBase64) {
    umk_salt = storedSaltBase64;
    saltBuffer = new Uint8Array(base64ToArrayBuffer(umk_salt));
  } else {
    saltBuffer = generateRandomBytes(UMK_SALT_BYTES);
    umk_salt = bufferToBase64(saltBuffer);
  }

  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const umkCryptoKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_GCM_KEY_LENGTH },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  const exportedKey = await window.crypto.subtle.exportKey("raw", umkCryptoKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", exportedKey);

  const master_passphrase_verifier = bufferToBase64(
    new Uint8Array(hashBuffer).slice(0, VERIFIER_LENGTH_BYTES)
  );

  return {
    umk_salt,
    master_passphrase_verifier,
    umkCryptoKey,
  };
};

export const wrapKey = async (
  keyToWrap: string,
  wrappingKey: CryptoKey
): Promise<string> => {
  const keyBuffer = base64ToArrayBuffer(keyToWrap);
  const iv = generateRandomBytes(IV_LENGTH_BYTES);

  const wrappedKeyBuffer = await crypto.subtle.encrypt(
    // @ts-expect-error -- FIX: iv.buffer converts Uint8Array to ArrayBuffer
    { name: "AES-GCM", iv: iv },
    wrappingKey,
    keyBuffer
  );

  const combined = new Uint8Array(iv.byteLength + wrappedKeyBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrappedKeyBuffer), iv.byteLength);

  return bufferToBase64(combined.buffer);
};

export const unwrapKey = async (
  wrappedKeyBase64: string,
  wrappingKey: CryptoKey | string
): Promise<CryptoKey> => {
  if (typeof wrappingKey === "string") {
    const privateKeyBuffer = base64ToArrayBuffer(wrappingKey);
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const wrappedBuffer = base64ToArrayBuffer(wrappedKeyBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      wrappedBuffer
    );

    return await window.crypto.subtle.importKey(
      "raw",
      decryptedBuffer,
      { name: "AES-GCM", length: AES_GCM_KEY_LENGTH },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }

  const wrappedKeyWithIv = base64ToArrayBuffer(wrappedKeyBase64);
  const wrappedKeyView = new Uint8Array(wrappedKeyWithIv);

  if (wrappedKeyView.byteLength > 500) {
    if (wrappedKeyView.byteLength < IV_LENGTH_BYTES + 1) {
      throw new Error("Wrapped private key data too short");
    }

    const iv = wrappedKeyView.slice(0, IV_LENGTH_BYTES);
    const wrappedKey = wrappedKeyView.slice(IV_LENGTH_BYTES);

    const decryptedPrivateKeyBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      wrappingKey as CryptoKey,
      wrappedKey
    );

    return await window.crypto.subtle.importKey(
      "pkcs8",
      decryptedPrivateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  } else {
    if (wrappedKeyView.byteLength < IV_LENGTH_BYTES + 1) {
      throw new Error("Wrapped AES key data too short");
    }

    const iv = wrappedKeyView.slice(0, IV_LENGTH_BYTES);
    const wrappedKey = wrappedKeyView.slice(IV_LENGTH_BYTES);

    const decryptedKeyBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      wrappingKey as CryptoKey,
      wrappedKey
    );

    return await window.crypto.subtle.importKey(
      "raw",
      decryptedKeyBuffer,
      { name: "AES-GCM", length: AES_GCM_KEY_LENGTH },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }
};

export const decryptData = async (
  encryptedDataBase64: string,
  itemKey: CryptoKey
): Promise<string> => {
  const encryptedWithIv = base64ToArrayBuffer(encryptedDataBase64);
  const encryptedView = new Uint8Array(encryptedWithIv);

  if (encryptedView.byteLength < IV_LENGTH_BYTES + 1) {
    throw new Error("Encrypted data too short");
  }

  const iv = encryptedView.slice(0, IV_LENGTH_BYTES);
  const ciphertext = encryptedView.slice(IV_LENGTH_BYTES);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    itemKey,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
};

export const generateRSAKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: RSA_MODULUS_LENGTH,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: bufferToBase64(publicKeyBuffer),
    privateKey: bufferToBase64(privateKeyBuffer),
  };
};

export const importRSAPublicKey = async (
  publicKeyBase64: string
): Promise<CryptoKey> => {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  return await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
};

export const importRSAPrivateKey = async (
  privateKeyBase64: string
): Promise<CryptoKey> => {
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
};

export const encryptWithRSA = async (
  data: string,
  publicKeyBase64: string
): Promise<string> => {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const dataBuffer = base64ToArrayBuffer(data);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    dataBuffer
  );

  return bufferToBase64(encryptedBuffer);
};

export const decryptWithRSA = async (
  encryptedData: string,
  privateKeyBase64: string
): Promise<string> => {
  const privateKey = await importRSAPrivateKey(privateKeyBase64);
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );

  return bufferToBase64(decryptedBuffer);
};