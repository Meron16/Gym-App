import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import Stripe from "stripe";
import type {
  CheckoutSessionRequestDto,
  CheckoutSessionResponseDto,
  PaymentHistoryItemDto,
} from "./dto";

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly processedStripeEvents = new Set<string>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createCheckoutSession(
    dto: CheckoutSessionRequestDto,
    authenticatedUserId: string,
  ): Promise<CheckoutSessionResponseDto> {
    const placeholder = this.config.get<string>("stripe.checkoutPlaceholderUrl")!;
    const secretKey = this.config.get<string>("stripe.secretKey");
    const priceId = process.env.STRIPE_CHECKOUT_PRICE_ID ?? "";

    if (!secretKey || !priceId) {
      this.log.log("Stripe checkout: using placeholder (set STRIPE_SECRET_KEY + STRIPE_CHECKOUT_PRICE_ID)");
      return { provider: "stripe", checkoutUrl: placeholder };
    }

    try {
      const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        success_url: this.config.get<string>("stripe.successUrl")!,
        cancel_url: this.config.get<string>("stripe.cancelUrl")!,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { userId: authenticatedUserId, packageId: dto.packageId },
      });
      return {
        provider: "stripe",
        checkoutUrl: session.url ?? placeholder,
      };
    } catch (e) {
      this.log.warn(`Stripe session error: ${(e as Error).message}`);
      return { provider: "stripe", checkoutUrl: placeholder };
    }
  }

  async getPaymentHistory(userId: string): Promise<PaymentHistoryItemDto[]> {
    try {
      const rows = await this.prisma.paymentRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return rows.map((r) => ({
        id: r.id,
        provider: r.provider,
        amountCents: r.amountCents,
        externalId: r.externalId ?? undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: Buffer): Promise<Record<string, unknown>> {
    const secret = this.config.get<string>("stripe.webhookSecret");
    const secretKey = this.config.get<string>("stripe.secretKey");

    if (!secret || !secretKey) {
      return { received: true, placeholder: true, message: "Set STRIPE_WEBHOOK_SECRET + STRIPE_SECRET_KEY" };
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
    } catch (err) {
      this.log.warn(`Webhook signature: ${(err as Error).message}`);
      return { received: false };
    }

    if (this.processedStripeEvents.has(event.id)) {
      return { received: true, idempotent: true };
    }
    this.processedStripeEvents.add(event.id);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const packageId = session.metadata?.packageId;
      const amountCents = session.amount_total ?? 0;

      if (userId && packageId) {
        try {
          await this.prisma.paymentRecord.create({
            data: {
              userId,
              provider: "stripe",
              amountCents,
              externalId: session.id,
            },
          });

          await this.prisma.subscription.upsert({
            where: { id: `stripe_${session.id}` },
            create: {
              id: `stripe_${session.id}`,
              userId,
              packageId,
              active: true,
            },
            update: {
              active: true,
              packageId,
            },
          });
        } catch (e) {
          this.log.warn(`Webhook DB write failed: ${(e as Error).message}`);
        }
      }
    }

    this.log.log(`Stripe event ${event.type}`);
    return { received: true, type: event.type };
  }
}
