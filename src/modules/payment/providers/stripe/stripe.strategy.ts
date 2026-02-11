import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  InitDataRequest,
  PaymentStrategy,
} from '../../interfaces/payment-strategy/payment-strategy.interface'; // Assuming interface location
import { PaymentStatus } from '../../payment-api/entities/payment-api.entity';
import { PaymentApiService } from '../../payment-api/payment-api.service';
import { STRIPE_INSTANCE } from './stripe.constant'; // Your constant file

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  private readonly logger = new Logger(StripePaymentStrategy.name);
  constructor(
    @Inject(STRIPE_INSTANCE) private readonly stripe: Stripe,
    private readonly configService: ConfigService,
  ) {}

  async checkout(amount: number): Promise<string> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd', // Should likely be configurable
      automatic_payment_methods: { enabled: true },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent');
    }

    return paymentIntent.client_secret;
  }

  async init(data: InitDataRequest): Promise<{ url: string; tran_id: string }> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: 'Payment for Order', // You might want to pass this in InitDataRequest
              description: `Customer: ${data.cus_name || 'Guest'}`,
            },
            unit_amount: Math.round(data.total_amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: data.cus_email,
      mode: 'payment',

      metadata: {
        customer_phone: data.cus_phone,
        customer_address: data.cus_add1 || '',
        customer_name: data.cus_name || '',
      },
      success_url: `${this.configService.getOrThrow('paymentFrontend.successUrl')}?tran_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${this.configService.getOrThrow('paymentFrontend.failUrl')}?tran_id={CHECKOUT_SESSION_ID}&status=cancel`,
    });

    if (!session.url) {
      throw new Error('Failed to create Stripe checkout session');
    }

    return {
      url: session.url,
      tran_id: session.id,
    };
  }

  async validate(data: any): Promise<boolean> {
    if (!data || !data.session_id) {
      return false;
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(
        data.session_id,
      );
      return session.payment_status === 'paid';
    } catch (error) {
      return false;
    }
  }

  async handleCallback(
    data: {
      rawBody: Buffer<ArrayBufferLike>;
      signature: string;
    },
    paymentService: PaymentApiService, // Ideally, define an interface for this service
  ): Promise<{ url: string; tran_id: string }> {
    const { rawBody, signature } = data;

    // 1. Handle Cancellation
    await this.processWebhook(signature, rawBody, paymentService);
    return { url: '', tran_id: '' };
  }

  async processWebhook(
    signature: string,
    rawBody: Buffer<ArrayBufferLike>,
    paymentService: PaymentApiService,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // 1. Construct the Event
    let event: Stripe.Event;

    try {
      // We must use req.rawBody, NOT req.body!
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('stripe.webhook_secret'),
      );
    } catch (err) {
      this.logger.error(
        `Webhook Signature Verification Failed: ${err.message}`,
      );
      throw new BadRequestException('Webhook Error: Invalid Signature');
    }

    // 2. Handle the specific event type
    // Stripe sends many events, we only care about the ones that affect order status
    switch (event.type) {
      // A. The User Paid Successfully
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session, paymentService);
        break;

      // B. The Payment Failed (Optional but good for analytics)
      case 'payment_intent.payment_failed':
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.handleCheckoutSessionFailed(intent, paymentService);
        this.logger.warn(`Payment failed for intent: ${intent.id}`);
        break;

      default:
      // Handle other event types or ignore them
      // console.log(`Unhandled event type ${event.type}`);
    }

    // 3. Return 200 OK to Stripe immediately
    // If you don't return 200, Stripe will think you failed and retry later.
    return { received: true };
  }

  /**
   * Helper method to handle the business logic
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
    paymentService: PaymentApiService,
  ) {
    this.logger.log(`💰 Payment succeeded for Session: ${session.id}`);

    const transId = session.id;
    const payment = await paymentService.findOneByTranId(transId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${transId}" not found`);
    }
    payment.status = PaymentStatus.SUCCESSFUL;
    await paymentService.update(payment.id, payment);
  }
  private async handleCheckoutSessionFailed(
    intent: Stripe.PaymentIntent,
    paymentService: PaymentApiService,
  ) {
    this.logger.log(`💰 Payment failed for Session: ${intent.id}`);

    const transId = intent.id;
    console.log({ transId, intent });
    // const payment = await paymentService.findOneByTranId(transId);
    // if (!payment) {
    //   throw new NotFoundException(`Payment with ID "${transId}" not found`);
    // }
    // payment.status = PaymentStatus.FAILED;
    // await paymentService.update(payment.id, payment);
  }
}
