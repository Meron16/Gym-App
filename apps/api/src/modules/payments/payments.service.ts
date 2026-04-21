import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import type {
  CheckoutSessionRequestDto,
  CheckoutSessionResponseDto,
  PaymentHistoryItemDto,
} from './dto';

function stripeIntervalForBilling(
  billing: string,
): 'day' | 'week' | 'month' | 'year' {
  const b = billing.trim().toLowerCase();
  if (b === 'daily') return 'day';
  if (b === 'weekly') return 'week';
  if (b === 'annual' || b === 'yearly') return 'year';
  return 'month';
}

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createCheckoutSession(
    dto: CheckoutSessionRequestDto,
    authenticatedUserId: string,
  ): Promise<CheckoutSessionResponseDto> {
    const placeholder = this.config.get<string>(
      'stripe.checkoutPlaceholderUrl',
    )!;
    const secretKey = this.config.get<string>('stripe.secretKey');
    const fallbackPriceId = (process.env.STRIPE_CHECKOUT_PRICE_ID ?? '').trim();

    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const priceId = (pkg.stripePriceId?.trim() || fallbackPriceId).trim();

    if (!secretKey) {
      this.log.log(
        'Stripe checkout: using placeholder (set STRIPE_SECRET_KEY and optionally stripePriceId/STRIPE_CHECKOUT_PRICE_ID)',
      );
      return {
        provider: 'stripe',
        checkoutUrl: placeholder,
        liveCheckout: false,
      };
    }

    try {
      const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' });
      const user = await this.prisma.user.findUnique({
        where: { id: authenticatedUserId },
        select: { email: true },
      });

      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: pkg.priceCents,
              recurring: { interval: stripeIntervalForBilling(pkg.billing) },
              product_data: {
                name: pkg.name,
                description: `Gym membership (${pkg.billing})`,
              },
            },
          };

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: this.config.get<string>('stripe.successUrl')!,
        cancel_url: this.config.get<string>('stripe.cancelUrl')!,
        line_items: [lineItem],
        client_reference_id: authenticatedUserId,
        customer_email: user?.email ?? undefined,
        subscription_data: {
          metadata: {
            userId: authenticatedUserId,
            packageId: dto.packageId,
          },
        },
        metadata: { userId: authenticatedUserId, packageId: dto.packageId },
      });
      const url = session.url ?? placeholder;
      return {
        provider: 'stripe',
        checkoutUrl: url,
        liveCheckout: Boolean(session.url),
      };
    } catch (e) {
      this.log.warn(`Stripe session error: ${(e as Error).message}`);
      return {
        provider: 'stripe',
        checkoutUrl: placeholder,
        liveCheckout: false,
      };
    }
  }

  async getPaymentHistory(userId: string): Promise<PaymentHistoryItemDto[]> {
    try {
      const rows = await this.prisma.paymentRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
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

  async handleStripeWebhook(
    signature: string | undefined,
    rawBody: Buffer,
  ): Promise<Record<string, unknown>> {
    const secret = this.config.get<string>('stripe.webhookSecret');
    const secretKey = this.config.get<string>('stripe.secretKey');

    if (!secret || !secretKey) {
      return {
        received: true,
        placeholder: true,
        message: 'Set STRIPE_WEBHOOK_SECRET + STRIPE_SECRET_KEY',
      };
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature ?? '', secret);
    } catch (err) {
      this.log.warn(`Webhook signature: ${(err as Error).message}`);
      return { received: false };
    }

    try {
      await this.prisma.processedStripeEvent.create({
        data: { stripeEventId: event.id, eventType: event.type },
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        return { received: true, idempotent: true };
      }
      throw e;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId =
        session.metadata?.userId ?? session.client_reference_id ?? undefined;
      const packageId = session.metadata?.packageId;
      const amountCents = session.amount_total ?? 0;
      const stripeSubId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

      if (userId && packageId) {
        try {
          const existingPayment = await this.prisma.paymentRecord.findFirst({
            where: { externalId: session.id },
            select: { id: true },
          });
          if (!existingPayment) {
            await this.prisma.paymentRecord.create({
              data: {
                userId,
                provider: 'stripe',
                amountCents,
                externalId: session.id,
              },
            });
          }

          await this.activateSubscription({
            userId,
            packageId,
            localSubscriptionId: `stripe_sub_${stripeSubId ?? session.id}`,
          });
        } catch (e) {
          this.log.warn(`Webhook DB write failed: ${(e as Error).message}`);
        }
      }
    }
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      const packageId = subscription.metadata?.packageId;
      if (userId && packageId) {
        try {
          await this.activateSubscription({
            userId,
            packageId,
            localSubscriptionId: `stripe_sub_${subscription.id}`,
          });
        } catch (e) {
          this.log.warn(
            `Subscription update sync failed: ${(e as Error).message}`,
          );
        }
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const id = `stripe_sub_${subscription.id}`;
      try {
        await this.prisma.subscription.update({
          where: { id },
          data: { active: false },
        });
      } catch {
        // Ignore if we don't have a corresponding local record yet.
      }
    }
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const userId = invoice.metadata?.userId;
      const externalId = invoice.id;
      const amountCents = invoice.amount_paid ?? invoice.amount_due ?? 0;
      if (userId && externalId) {
        const existing = await this.prisma.paymentRecord.findFirst({
          where: { externalId },
          select: { id: true },
        });
        if (!existing) {
          await this.prisma.paymentRecord.create({
            data: {
              userId,
              provider: 'stripe',
              amountCents,
              externalId,
            },
          });
        }
      }
    }

    this.log.log(`Stripe event ${event.type}`);
    return { received: true, type: event.type };
  }

  private async activateSubscription(input: {
    userId: string;
    packageId: string;
    localSubscriptionId: string;
  }) {
    // Keep only one active subscription per user so "current plan" is deterministic.
    await this.prisma.subscription.updateMany({
      where: { userId: input.userId, active: true },
      data: { active: false },
    });

    await this.prisma.subscription.upsert({
      where: { id: input.localSubscriptionId },
      create: {
        id: input.localSubscriptionId,
        userId: input.userId,
        packageId: input.packageId,
        active: true,
      },
      update: {
        active: true,
        packageId: input.packageId,
      },
    });
  }
}
