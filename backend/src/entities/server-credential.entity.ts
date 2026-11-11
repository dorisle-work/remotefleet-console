import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Server } from './server.entity';

@Entity('server_credentials')
export class ServerCredential {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'server_id', type: 'bigint' })
  serverId!: string;

  @Column({ name: 'encrypted_payload', type: 'text' })
  encryptedPayload!: string;

  @Column({ length: 32 })
  iv!: string;

  @Column({ name: 'auth_tag', length: 32 })
  authTag!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => Server, (server) => server.credential, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server!: Server;
}
