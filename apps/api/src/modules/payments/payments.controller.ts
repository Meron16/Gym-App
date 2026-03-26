import { Body, Controller, Post } from "@nestjs/common";
import type { CheckoutSessionRequestDto, CheckoutSessionResponseDto } from "./dto";

@Controller("payments")
export class PaymentsController {
  @Post("checkout-session")
  createCheckout(@Body() _dto: CheckoutSessionRequestDto): CheckoutSessionResponseDto {
    // MVP placeholder: later this will create a Stripe PaymentIntent / Checkout Session.
    return { provider: "stripe", checkoutUrl: "https://example.com/stripe-checkout" };
  }
}

