import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseAdminService } from './firebase-admin.service';
import {
  AuthProfileDto,
  FirebaseLoginRequestDto,
  FirebaseLoginResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
} from './dto';

const DEV_USER_ID = 'user_dev_1';
const DEV_OPERATOR_ID = 'operator_dev_1';
const DEV_ADMIN_ID = 'admin_dev_1';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly firebase: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Email/password registration — stores user in Postgres (no Firebase required).
   */
  async register(dto: RegisterRequestDto): Promise<FirebaseLoginResponseDto> {
    const email = dto.email.trim().toLowerCase();
    if (!email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }
    if (dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const phoneDigits = dto.phone?.replace(/\D/g, '').slice(0, 20) || null;
    const displayName = dto.fullName?.trim() || null;
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: phoneDigits || null,
        displayName,
        role: 'user',
      },
    });
    const accessToken = this.signAppJwt(user.id, user.role);
    const profile: AuthProfileDto = {
      id: user.id,
      role: user.role as AuthProfileDto['role'],
      email: user.email ?? undefined,
    };
    return { accessToken, profile };
  }

  /**
   * Email/password login for users created via register() (passwordHash set).
   */
  async login(dto: LoginRequestDto): Promise<FirebaseLoginResponseDto> {
    const email = dto.email.trim().toLowerCase();
    if (!email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = this.signAppJwt(user.id, user.role);
    const profile: AuthProfileDto = {
      id: user.id,
      role: user.role as AuthProfileDto['role'],
      email: user.email ?? undefined,
    };
    return { accessToken, profile };
  }

  async firebaseLogin(
    dto: FirebaseLoginRequestDto,
  ): Promise<FirebaseLoginResponseDto> {
    const token = (dto.idToken ?? '').trim();
    if (!token) {
      throw new UnauthorizedException('idToken required');
    }

    if (this.firebase.isReady()) {
      try {
        const decoded = await this.firebase.verifyIdToken(token);
        const email = decoded.email ?? undefined;
        const { id, role } = await this.resolveFirebaseUser(decoded.uid, email);
        const accessToken = this.signAppJwt(id, role);
        const profile: AuthProfileDto = {
          id,
          role: role as AuthProfileDto['role'],
          email,
        };
        return { accessToken, profile };
      } catch (e) {
        if (e instanceof UnauthorizedException) throw e;
        this.log.warn(`Firebase verify failed: ${(e as Error).message}`);
        throw new UnauthorizedException('Invalid Firebase token');
      }
    }

    const allowDev = this.config.get<boolean>('auth.devAllowPlaceholder');
    if (allowDev) {
      const lowered = token.toLowerCase();
      if (['admin', 'dev-admin'].includes(lowered)) {
        await this.ensureDevUser(DEV_ADMIN_ID, 'admin');
        return {
          accessToken: this.signAppJwt(DEV_ADMIN_ID, 'admin'),
          profile: { id: DEV_ADMIN_ID, role: 'admin' },
        };
      }
      if (['operator', 'dev-operator'].includes(lowered)) {
        await this.ensureDevUser(DEV_OPERATOR_ID, 'operator');
        return {
          accessToken: this.signAppJwt(DEV_OPERATOR_ID, 'operator'),
          profile: { id: DEV_OPERATOR_ID, role: 'operator' },
        };
      }
      if (
        ['dev', 'placeholder', 'test', 'user', 'dev-user'].includes(lowered)
      ) {
        await this.ensureDevUser(DEV_USER_ID, 'user');
        return {
          accessToken: this.signAppJwt(DEV_USER_ID, 'user'),
          profile: { id: DEV_USER_ID, role: 'user' },
        };
      }
    }

    throw new UnauthorizedException(
      'Firebase is not configured and dev placeholder token is disabled or invalid',
    );
  }

  private signAppJwt(userId: string, role: string): string {
    const secret = this.config.get<string>('jwt.secret');
    const expiresIn = this.config.get<string>('jwt.expiresIn') ?? '7d';
    if (!secret) {
      throw new Error('JWT_SECRET missing');
    }
    return jwt.sign({ sub: userId, role }, secret, {
      expiresIn,
    } as jwt.SignOptions);
  }

  private async resolveFirebaseUser(
    firebaseUid: string,
    email?: string,
  ): Promise<{ id: string; role: string }> {
    const user = await this.prisma.user.upsert({
      where: { firebaseUid },
      create: { firebaseUid, email: email ?? null, role: 'user' },
      update: { email: email ?? undefined },
    });
    return { id: user.id, role: user.role };
  }

  private async ensureDevUser(
    userId: string,
    role: 'user' | 'operator' | 'admin',
  ) {
    await this.prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, role },
      update: { role },
    });
  }
}
