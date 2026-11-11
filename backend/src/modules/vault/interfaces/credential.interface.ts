export interface EncryptedCredential {
  encryptedPayload: string;
  iv: string;
  authTag: string;
}
