import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const algorithm = "aes-256-ctr";

/**
 * Encrypts the provided string data using the AES-256-CTR algorithm with a generated initialization vector (IV).
 * The secret key is expanded using the scryptSync algorithm with a predefined salt.
 * 
 * @param {string} data - The plaintext data to be encrypted.
 * @param {string} secretKey - The secret key used for encryption.
 * @returns {string} The IV and the encrypted data concatenated as a hex string, separated by a colon.
 *
 * @example
 * ```typescript
 * const secretKey = 'mySecretKey';
 * const data = 'Hello, world!';
 * const encryptedData = encrypt(data, secretKey);
 * console.log(encryptedData); // Outputs: <iv>:<encryptedData>
 * ```
 */

const encrypt = (data: string, secretKey: string): string => {
  const iv = randomBytes(16);
  const key = scryptSync(secretKey, "salt", 32);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * This module provides utility functions for data encryption and decryption using AES-256-CTR algorithm.
 *
 * @function decrypt - Decrypts the provided encrypted string, which must include the IV and the encrypted data separated by a colon.
 * @param {string} encryptedData - The encrypted data including the IV, formatted as '<iv>:<encryptedData>'.
 * @param {string} secretKey - The secret key used for decryption.
 * @returns {string} The decrypted original data as a string.
 *
 * @example
 * ```typescript
 * const secretKey = 'mySecretKey';
 * const encryptedData = '<iv>:<encryptedData>';
 * const decryptedData = decrypt(encryptedData, secretKey);
 * console.log(decryptedData); // Outputs: Hello, world!
 * ```
 */
const decrypt = (encryptedData: string, secretKey: string): string => {
  const [ivHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = scryptSync(secretKey, "salt", 32);
  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString();
};

export { encrypt, decrypt };
