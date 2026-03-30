import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";
import { FirebaseAdminService } from "./firebase-admin.service";
import { AuthProfileDto, FirebaseLoginRequestDto, FirebaseLoginResponseDto } from "./dto";

const DEV_USER_ID = "user_dev_1";

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
    const placeholders = ["dev", "placeholder", "test"];
    if (allowDev && placeholders.includes(token.toLowerCase())) {
      await this.ensureDevUser();
      const accessToken = this.signAppJwt(DEV_USER_ID, "user");
      const profile: AuthProfileDto = { id: DEV_USER_ID, role: "user" };
      return { accessToken, profile };
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

  private async ensureDevUser() {
    try {
      await this.prisma.user.upsert({
        where: { id: DEV_USER_ID },
        create: { id: DEV_USER_ID, role: "user" },
        update: {},
      });
    } catch {
      /* DB optional */
    }
  }
}
