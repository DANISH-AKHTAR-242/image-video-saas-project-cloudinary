import { prisma } from "@/lib/prisma";
import { setUserPlan } from "@/lib/user";
import { Plan, SubscriptionStatus } from "@/prisma/generated/prisma";
import { getStripeClient } from "@/services/stripe.service";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function parsePlanFromPrice(priceId?: string | null): Plan {
  if (!priceId) return Plan.FREE;
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return Plan.BUSINESS;
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return Plan.PRO;
  return Plan.FREE;
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active") return SubscriptionStatus.ACTIVE;
  if (status === "canceled") return SubscriptionStatus.CANCELED;
  if (status === "past_due" || status === "unpaid")
    return SubscriptionStatus.PAST_DUE;
  if (status === "trialing") return SubscriptionStatus.TRIALING;
  return SubscriptionStatus.INCOMPLETE;
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const customerId = String(subscription.customer);
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const plan = parsePlanFromPrice(priceId);
  const currentPeriodEndUnix = (subscription as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? "",
      status: mapStatus(subscription.status),
      currentPeriodEnd: currentPeriodEndUnix
        ? new Date(currentPeriodEndUnix * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? "",
      status: mapStatus(subscription.status),
      currentPeriodEnd: currentPeriodEndUnix
        ? new Date(currentPeriodEndUnix * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  await setUserPlan(user.id, plan);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Invalid webhook setup" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${String(error)}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status ?? "paid",
            paidAt: new Date(),
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
