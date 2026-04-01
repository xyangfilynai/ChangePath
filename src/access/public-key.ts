/**
 * Updated by scripts/generate-keypair.mjs.
 * Keep the private key outside the frontend repo; only the public key belongs here.
 */
export const ACCESS_PASS_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAs0W4G7G0VDtORoL1EhtYF0TbtsGosvZ4j7vFR6yMWGA=
-----END PUBLIC KEY-----`;

export const hasConfiguredAccessPassPublicKey = (
  publicKeyPem: string = ACCESS_PASS_PUBLIC_KEY_PEM,
): boolean =>
  publicKeyPem.includes('BEGIN PUBLIC KEY') && !publicKeyPem.includes('REPLACE_WITH_ACCESS_PASS_PUBLIC_KEY');
