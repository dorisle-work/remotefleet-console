import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { Operator, OperatorRole } from '../../entities/operator.entity';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorsRepo: Repository<Operator>,
    private readonly tokenService: TokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultOperators();
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const operator = await this.operatorsRepo.findOne({ where: { email } });
    if (!operator) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await compare(dto.password, operator.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const token = this.tokenService.sign(operator);
    return {
      token,
      operator: this.toPublic(operator),
    };
  }

  async me(operatorId: string) {
    const operator = await this.operatorsRepo.findOne({
      where: { id: operatorId },
    });
    if (!operator) {
      throw new UnauthorizedException('Operator không tồn tại');
    }
    return this.toPublic(operator);
  }

  private toPublic(operator: Operator) {
    return {
      id: operator.id,
      email: operator.email,
      name: operator.name,
      role: operator.role,
    };
  }

  private async ensureDefaultOperators(): Promise<void> {
    const count = await this.operatorsRepo.count();
    if (count > 0) return;

    const passwordHash = await hash('password', 10);
    await this.operatorsRepo.save([
      this.operatorsRepo.create({
        email: 'admin@remotefleet.test',
        name: 'Fleet Admin',
        passwordHash,
        role: OperatorRole.ADMIN,
      }),
      this.operatorsRepo.create({
        email: 'ops@remotefleet.test',
        name: 'Console Operator',
        passwordHash,
        role: OperatorRole.OPERATOR,
      }),
    ]);
  }
}
