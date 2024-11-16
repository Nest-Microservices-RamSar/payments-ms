import { Inject, Injectable } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

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
        metadata: {
          orderId,
        },
      },

      line_items: lineItems,
      mode: 'payment',
      // Redirecciones cuando se realizan los pagos.
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
    });

    //  ya no retornamos toda la session porque no lo necesitamos
    return {
      cancelUrl: session.cancel_url,
      succerssUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    const endpointSecret = envs.STRIPE_ENDPOINT_SECRET;

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

    console.log({ event });
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object as Stripe.Charge;

        const payload = {
          orderId: chargeSucceeded.metadata.orderId,
          stripePaymentId: chargeSucceeded.id,
          receiptUrl: chargeSucceeded.receipt_url,
        };

        this.client.emit('payment.succeeded', payload);

        break;
      default:
        console.log(`event  ${event.type} not handled`);
    }

    return res.status(200).json({
      sig,
    });
  }
}
