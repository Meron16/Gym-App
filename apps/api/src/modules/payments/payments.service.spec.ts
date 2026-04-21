import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';

jest.mock('stripe', () => {
  return class MockStripe {
    webhooks = {
      constructEvent: jest.fn(() => ({
        id: 'evt_duplicate',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            metadata: { userId: 'u1', packageId: 'p1' },
            amount_total: 1000,
          },
        },
      })),
    };
  };
});

describe('PaymentsService.handleStripeWebhook', () => {
  let service: PaymentsService;
  const createProcessed = jest.fn();

  beforeEach(async () => {
    createProcessed.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'stripe.webhookSecret') return 'whsec_test';
              if (key === 'stripe.secretKey') return 'sk_test';
              return '';
            },
          },
        },
        {
          provide: PrismaService,
          useValue: {
            processedStripeEvent: { create: createProcessed },
            paymentRecord: { create: jest.fn() },
            subscription: { upsert: jest.fn() },
          },
        },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  it('returns idempotent when event id was already processed (unique constraint)', async () => {
    const err = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
    });
    createProcessed.mockRejectedValueOnce(err);

    const raw = Buffer.from('{}');
    const res = await service.handleStripeWebhook('sig', raw);

    expect(res).toMatchObject({ received: true, idempotent: true });
  });
});
