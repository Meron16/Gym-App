import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";
import { FirebaseAdminService } from "./firebase-admin.service";
import { AuthProfileDto, FirebaseLoginRequestDto, FirebaseLoginResponseDto } from "./dto";

const DEV_USER_ID = "user_dev_1";
const DEV_OPERATOR_ID = "operator_dev_1";
const DEV_ADMIN_ID = "admin_dev_1";

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly firebase: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  async firebaseLogin(dto: FirebaseLoginRequestDto): Promise<FirebaseLoginResponseDto> {
    const token = (dto.idToken ?? "").trim();
    if (!token) {
      throw new UnauthorizedException("idToken required");
    }

    if (this.firebase.isReady()) {
      try {
        const decoded = await this.firebase.verifyIdToken(token);
        const email = decoded.email ?? undefined;
        const { id, role } = await this.resolveFirebaseUser(decoded.uid, email);
        const accessToken = this.signAppJwt(id, role);
        const profile: AuthProfileDto = {
          id,
          role: role as AuthProfileDto["role"],
          email,
        };
        return { accessToken, profile };
      } catch (e) {
        if (e instanceof UnauthorizedException) throw e;
        this.log.warn(`Firebase verify failed: ${(e as Error).message}`);
        throw new UnauthorizedException("Invalid Firebase token");
      }
    }

    const allowDev = this.config.get<boolean>("auth.devAllowPlaceholder");
    if (allowDev) {
      const lowered = token.toLowerCase();
      if (["admin", "dev-admin"].includes(lowered)) {
        await this.ensureDevUser(DEV_ADMIN_ID, "admin");
        return {
          accessToken: this.signAppJwt(DEV_ADMIN_ID, "admin"),
          profile: { id: DEV_ADMIN_ID, role: "admin" },
        };
      }
      if (["operator", "dev-operator"].includes(lowered)) {
        await this.ensureDevUser(DEV_OPERATOR_ID, "operator");
        return {
          accessToken: this.signAppJwt(DEV_OPERATOR_ID, "operator"),
          profile: { id: DEV_OPERATOR_ID, role: "operator" },
        };
      }
      if (["dev", "placeholder", "test", "user", "dev-user"].includes(lowered)) {
        await this.ensureDevUser(DEV_USER_ID, "user");
        return {
          accessToken: this.signAppJwt(DEV_USER_ID, "user"),
          profile: { id: DEV_USER_ID, role: "user" },
        };
      }
    }

    throw new UnauthorizedException(
      "Firebase is not configured and dev placeholder token is disabled or invalid",
    );
  }

  private signAppJwt(userId: string, role: string): string {
    const secret = this.config.get<string>("jwt.secret");
    const expiresIn = this.config.get<string>("jwt.expiresIn") ?? "7d";
    if (!secret) {
      throw new Error("JWT_SECRET missing");
    }
    return jwt.sign({ sub: userId, role }, secret, { expiresIn } as jwt.SignOptions);
  }

  private async resolveFirebaseUser(
    firebaseUid: string,
    email?: string,
  ): Promise<{ id: string; role: string }> {
    try {
      const user = await this.prisma.user.upsert({
        where: { firebaseUid },
        create: { firebaseUid, email: email ?? null, role: "user" },
        update: { email: email ?? undefined },
      });
      return { id: user.id, role: user.role };
    } catch (e) {
      this.log.warn(`Prisma user upsert failed: ${(e as Error).message}`);
      return { id: `firebase_${firebaseUid}`, role: "user" };
    }
  }

  private async ensureDevUser(userId: string, role: "user" | "operator" | "admin") {
    try {
      await this.prisma.user.upsert({
        where: { id: userId },
        create: { id: userId, role },
        update: { role },
      });
    } catch {
      /* DB optional */
    }
  }
}
