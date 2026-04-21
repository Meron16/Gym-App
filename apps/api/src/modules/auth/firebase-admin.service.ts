import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly log = new Logger(FirebaseAdminService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('firebase.projectId');
    const clientEmail = this.config.get<string>('firebase.clientEmail');
    const privateKey = this.config.get<string>('firebase.privateKey');

    if (projectId && clientEmail && privateKey) {
      try {
        if (!admin.apps.length) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          this.app = admin.app();
        }
        this.log.log('Firebase Admin initialized');
      } catch (e) {
        this.log.warn(`Firebase Admin failed to init: ${(e as Error).message}`);
        this.app = null;
      }
    } else {
      this.log.log('Firebase Admin skipped (set FIREBASE_* env when ready)');
    }
  }

  isReady(): boolean {
    return this.app !== null;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new Error('Firebase Admin not configured');
    }
    return this.app.auth().verifyIdToken(idToken);
  }
}
