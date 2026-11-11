import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EncryptedCredential } from './interfaces/credential.interface';

@Injectable()
export class VaultService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('MASTER_VAULT_KEY', '');
    this.masterKey = Buffer.from(keyHex, 'hex');
  }

  encryptCredential(rawText: string): EncryptedCredential {
    if (this.masterKey.length !== 32) {
      throw new Error(
        'MASTER_VAULT_KEY phải có độ dài chính xác 32 bytes (64 ký tự hex).',
      );
    }

    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(rawText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedPayload: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  decryptCredential(
    encryptedPayload: string,
    ivHex: string,
    authTagHex: string,
  ): string {
    if (this.masterKey.length !== 32) {
      throw new Error(
        'MASTER_VAULT_KEY phải có độ dài chính xác 32 bytes (64 ký tự hex).',
      );
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
