"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// Note: Install stripe package and set STRIPE_SECRET_KEY + STRIPE_PRICE_ID in .env
// npm install stripe

/**
 * Check if user has an active subscription.
 */
export async function getSubscriptionStatus() {
  const session = await requireAuth();
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  return {
    hasSubscription: sub?.status === "active",
    plan: sub?.plan ?? null,
    status: sub?.status ?? "none",
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}

/**
 * Create a Stripe Checkout session for subscribing.
 * Returns the checkout URL to redirect the user to.
 */
export async function createCheckoutSession() {
  const session = await requireAuth();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

  const priceId = process.env.STRIPE_SCANNER_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_SCANNER_PRICE_ID not configured");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Dynamic import to avoid build errors if stripe isn't installed yet
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(stripeKey);

  // Find or create Stripe customer
  let sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  let customerId: string;

  if (sub?.stripeCustomerId) {
    customerId = sub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    // Create/update subscription record
    if (sub) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          status: "inactive",
        },
      });
    }
  }

  // Create checkout session
  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/scan?subscribed=true`,
    cancel_url: `${baseUrl}/scan`,
    metadata: { userId: session.user.id },
  });

  return checkout.url;
}

/**
 * Create a Stripe Billing Portal session for managing subscription.
 */
export async function createPortalSession() {
  const session = await requireAuth();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!sub?.stripeCustomerId) throw new Error("No subscription found");

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(stripeKey);

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/scan`,
  });

  return portal.url;
}
