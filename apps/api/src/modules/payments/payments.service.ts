import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { CheckoutSessionRequestDto, CheckoutSessionResponseDto } from "./dto";

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly processedStripeEvents = new Set<string>();

  constructor(private readonly config: ConfigService) {}

  async createCheckoutSession(dto: CheckoutSessionRequestDto): Promise<CheckoutSessionResponseDto> {
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
        metadata: { userId: dto.userId, packageId: dto.packageId },
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

  handleStripeWebhook(signature: string | undefined, rawBody: Buffer): Record<string, unknown> {
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

    // TODO: activate Subscription in DB from event (Phase 5)
    this.log.log(`Stripe event ${event.type} (activate subscription here)`);

    return { received: true, type: event.type };
  }
}
