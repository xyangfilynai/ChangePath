/**
 * Updated by scripts/generate-keypair.mjs.
 * Keep the private key outside the frontend repo; only the public key belongs here.
 */
export const ACCESS_PASS_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEANqDzaNat+zUlm3Em7eihzddbldh8zYrT7GhrRJ004q0=
-----END PUBLIC KEY-----`;

export const hasConfiguredAccessPassPublicKey = (
  publicKeyPem: string = ACCESS_PASS_PUBLIC_KEY_PEM,
): boolean =>
  publicKeyPem.includes('BEGIN PUBLIC KEY') && !publicKeyPem.includes('REPLACE_WITH_ACCESS_PASS_PUBLIC_KEY');
