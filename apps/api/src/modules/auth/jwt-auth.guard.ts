import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as jwt from "jsonwebtoken";

export type JwtUser = { sub: string; role: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = auth.slice(7);
    const secret = this.config.get<string>("jwt.secret");
    if (!secret) {
      throw new UnauthorizedException("Server misconfigured");
    }
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload & { role?: string };
      if (!payload.sub || typeof payload.sub !== "string") {
        throw new UnauthorizedException("Invalid token payload");
      }
      req.user = { sub: payload.sub, role: payload.role ?? "user" };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
