import { ConfigService } from '@nestjs/config';
import { VaultService } from '../src/modules/vault/vault.service';

describe('VaultService', () => {
  const masterKey =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const createService = (key = masterKey): VaultService => {
    const config = {
      get: jest.fn().mockReturnValue(key),
    } as unknown as ConfigService;
    return new VaultService(config);
  };

  it('encrypts and decrypts credentials with AES-256-GCM', () => {
    const vault = createService();
    const plaintext = '-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----';

    const encrypted = vault.encryptCredential(plaintext);
    expect(encrypted.encryptedPayload).toBeTruthy();
    expect(encrypted.iv).toHaveLength(32);
    expect(encrypted.authTag).toHaveLength(32);

    const decrypted = vault.decryptCredential(
      encrypted.encryptedPayload,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toBe(plaintext);
  });

  it('rejects invalid master key length', () => {
    const vault = createService('abcd');
    expect(() => vault.encryptCredential('secret')).toThrow(
      /MASTER_VAULT_KEY/,
    );
  });
});
