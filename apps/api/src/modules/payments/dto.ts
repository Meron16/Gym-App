export interface CheckoutSessionRequestDto {
  packageId: string;
  /** Optional from client; server should trust JWT subject over this when available */
  userId?: string;
}

export interface CheckoutSessionResponseDto {
  checkoutUrl: string;
  provider: "stripe";
  /** False when STRIPE_SECRET_KEY / Price ID are missing or Stripe errored — URL is a demo placeholder, not real Checkout. */
  liveCheckout: boolean;
}

export interface PaymentHistoryItemDto {
  id: string;
  provider: string;
  amountCents: number;
  externalId?: string;
  createdAt: string;
}
