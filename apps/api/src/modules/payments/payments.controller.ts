import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { CheckoutSessionRequestDto, CheckoutSessionResponseDto } from "./dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("checkout-session")
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  checkoutSession(@Body() dto: CheckoutSessionRequestDto): Promise<CheckoutSessionResponseDto> {
    return this.paymentsService.createCheckoutSession(dto);
  }

  @Post("webhook")
  @SkipThrottle()
  @HttpCode(200)
  stripeWebhook(
    @Headers("stripe-signature") signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.paymentsService.handleStripeWebhook(signature, raw);
  }
}
