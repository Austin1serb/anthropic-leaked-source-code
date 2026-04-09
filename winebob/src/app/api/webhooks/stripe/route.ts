import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler.
 * Processes subscription events to keep our Subscription model in sync.
 *
 * Setup:
 *   1. Set STRIPE_WEBHOOK_SECRET in .env
 *   2. In Stripe Dashboard → Webhooks → Add endpoint: https://yoursite.com/api/webhooks/stripe
 *   3. Subscribe to: customer.subscription.created, updated, deleted, checkout.session.completed
 */
export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, any> } };

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as any;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return Response.json({ error: msg }, { status: 400 });
  }

  const obj = event.data.object;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const userId = obj.metadata?.userId;
        const subscriptionId = obj.subscription as string;
        const customerId = obj.customer as string;

        if (userId && subscriptionId) {
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: "active",
              plan: "scanner",
              currentPeriodStart: new Date(),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              status: "active",
              currentPeriodStart: new Date(),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subId = obj.id as string;
        const status = obj.status as string;
        const cancelAtPeriodEnd = obj.cancel_at_period_end as boolean;
        const periodEnd = obj.current_period_end
          ? new Date((obj.current_period_end as number) * 1000)
          : null;

        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: status === "active" ? "active" : status === "past_due" ? "past_due" : "inactive",
              cancelAtPeriodEnd,
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subId = obj.id as string;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subId },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "cancelled" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
