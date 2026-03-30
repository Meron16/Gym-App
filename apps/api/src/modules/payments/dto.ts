export interface CheckoutSessionRequestDto {
  packageId: string;
  /** Optional from client; server should trust JWT subject over this when available */
  userId?: string;
}

export interface CheckoutSessionResponseDto {
  checkoutUrl: string;
  provider: "stripe";
}

export interface PaymentHistoryItemDto {
  id: string;
  provider: string;
  amountCents: number;
  externalId?: string;
  createdAt: string;
}
