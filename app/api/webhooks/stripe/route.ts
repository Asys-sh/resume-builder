import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Disable body parsing for webhook routes
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature to ensure request is from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle different event types
  try {
    switch (event.type) {
      /**
       * Subscription Activation Handler
       *
       * This webhook event is triggered when a user successfully completes checkout.
       * It activates the subscription by:
       * - Setting subscriptionStatus to ACTIVE
       * - Resetting usageCount to 0 for the new billing period
       * - Setting usageLimit to unlimited for Pro tier
       * - Recording the billing period start and end dates
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract userId from session metadata
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in checkout session metadata:', session.id);
          return NextResponse.json(
            { error: 'Missing required metadata' },
            { status: 400 }
          );
        }

        // Handle subscription checkout completion
        if (session.mode === 'subscription' && session.subscription) {
          const user = await prisma.user.findUnique({
            where: { userId },
          });

          if (!user) {
            console.error('User not found:', userId);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }

          // Retrieve subscription to get billing period
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Update user subscription status
          await prisma.user.update({
            where: { userId },
            data: {
              subscriptionStatus: 'ACTIVE',
              usageCount: 0, // Reset usage on new subscription
              usageLimit: 999999, // Set to unlimited or high limit for Pro tier
              billingPeriodStart: new Date(subscription.current_period_start * 1000),
              billingPeriodEnd: new Date(subscription.current_period_end * 1000),
              stripeCustomerId: session.customer as string,
            },
          });

          console.log(`✅ Activated subscription for user ${userId} (Session: ${session.id})`);
        }
        break;
      }

      /**
       * Subscription Renewal Handler
       *
       * This webhook event is triggered when a subscription is renewed or updated.
       * It handles subscription renewals by:
       * - Resetting usageCount to 0 for the new billing period
       * - Updating billing period start and end dates
       * - Maintaining subscription status (ACTIVE or INACTIVE based on Stripe status)
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata:', subscription.id);
          break;
        }

        // Update billing period on subscription renewal
        await prisma.user.update({
          where: { userId },
          data: {
            subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            usageCount: 0, // Reset usage on period renewal
            billingPeriodStart: new Date(subscription.current_period_start * 1000),
            billingPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        console.log(`✅ Updated subscription for user ${userId}`);
        break;
      }

      /**
       * Subscription Cancellation Handler
       *
       * This webhook event is triggered when a subscription is cancelled or deleted.
       * It deactivates the subscription by:
       * - Setting subscriptionStatus to INACTIVE
       * - Reverting usageLimit to free tier limit (100 AI assists)
       * - Resetting usageCount to 0 for the new free tier period
       * - User retains access to free tier features
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata:', subscription.id);
          break;
        }

        // Deactivate subscription
        await prisma.user.update({
          where: { userId },
          data: {
            subscriptionStatus: 'INACTIVE',
            usageCount: 0, // Reset usage count for free tier
            usageLimit: 5, // Revert to free tier limit
          },
        });

        console.log(`❌ Cancelled subscription for user ${userId}`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        // Optional: Handle expired sessions
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        // Optional: Handle failed payments
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
