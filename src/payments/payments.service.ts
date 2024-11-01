import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  async createPaymentSession() {
    const session = await this.stripe.checkout.sessions.create({
      // Add here the order ID
      payment_intent_data: {
        metadata: {},
      },

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'T-Shirt',
            },
            unit_amount: 2000, // 20 dolares
          },
          quantity: 2,
        },
      ],
      mode: 'payment',
      // Redirecciones cuando se realizan los pagos.
      success_url: 'http://localhost:3000/payments/success',
      cancel_url: 'http://localhost:3000/payments/cancel',
    });

    return session;
  }
}
