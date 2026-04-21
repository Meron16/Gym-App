import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, JwtUser } from '../auth/jwt-auth.guard';
import type {
  CheckoutSessionRequestDto,
  CheckoutSessionResponseDto,
  PaymentHistoryItemDto,
} from './dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  checkoutSession(
    @Body() dto: CheckoutSessionRequestDto,
    @Req() req: Request & { user: JwtUser },
  ): Promise<CheckoutSessionResponseDto> {
    return this.paymentsService.createCheckoutSession(dto, req.user.sub);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  history(
    @Req() req: Request & { user: JwtUser },
  ): Promise<PaymentHistoryItemDto[]> {
    return this.paymentsService.getPaymentHistory(req.user.sub);
  }

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(200)
  async stripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.paymentsService.handleStripeWebhook(signature, raw);
  }
}
