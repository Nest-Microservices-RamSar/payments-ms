import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      // Add here the order ID
      payment_intent_data: {
        metadata: {},
      },

      line_items: lineItems,
      mode: 'payment',
      // Redirecciones cuando se realizan los pagos.
      success_url: 'http://localhost:3000/payments/success',
      cancel_url: 'http://localhost:3000/payments/cancel',
    });

    return session;
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    // Testing
    // const endpointSecret = 'whsec_b72e73c3b3c0e2cc9111b6ca0b8659c54f54ac02af79fcf15e7d9b899dd851a1';

    // Prod
    const endpointSecret = 'whsec_DQURm3dROaWow5YIYfuYYvF6yGPRbjOM';

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        console.log(event);
        break;
      default:
        console.log(`event  ${event.type} not handled`);
    }

    console.log({ event });

    return res.status(200).json({
      sig,
    });
  }
}
