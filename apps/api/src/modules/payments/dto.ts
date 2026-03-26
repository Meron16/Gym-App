export interface CheckoutSessionRequestDto {
  packageId: string;
  userId: string;
}

export interface CheckoutSessionResponseDto {
  checkoutUrl: string;
  provider: "stripe";
}

