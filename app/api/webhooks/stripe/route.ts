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

  // Idempotency — skip events we've already processed (Stripe delivers at-least-once)
  try {
    await prisma.processedWebhook.create({ data: { id: event.id } })
  } catch {
    // Unique constraint violation means this event was already handled
    return NextResponse.json({ received: true }, { status: 200 })
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
            where: { id: userId },
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
            where: { id: userId },
            data: {
              subscriptionStatus: 'ACTIVE',
              usageCount: 0,
              usageLimit: 999999,
              billingPeriodStart: new Date(subscription.current_period_start * 1000),
              billingPeriodEnd: new Date(subscription.current_period_end * 1000),
              stripeCustomerId: session.customer as string,
            },
          });

          await prisma.auditLog.create({
            data: {
              userId,
              action: 'subscription.activated',
              details: { sessionId: session.id, subscriptionId: subscription.id },
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

        const newStatus = subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE';

        // Update billing period on subscription renewal
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: newStatus,
            usageCount: 0,
            billingPeriodStart: new Date(subscription.current_period_start * 1000),
            billingPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: 'subscription.updated',
            details: { subscriptionId: subscription.id, status: newStatus },
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
       * - Reverting usageLimit to free tier limit (5 AI assists)
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
          where: { id: userId },
          data: {
            subscriptionStatus: 'INACTIVE',
            usageCount: 0,
            usageLimit: 5,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: 'subscription.cancelled',
            details: { subscriptionId: subscription.id },
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
