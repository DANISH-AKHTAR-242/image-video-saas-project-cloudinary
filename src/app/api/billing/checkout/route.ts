import { ensureUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, getStripePriceId } from "@/services/stripe.service";

type CheckoutRequest = {
  plan: "PRO" | "BUSINESS";
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CheckoutRequest;
  if (!body.plan || !["PRO", "BUSINESS"].includes(body.plan)) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  const profile = await currentUser();
  const user = await ensureUser(userId, profile?.primaryEmailAddress?.emailAddress);

  const stripe = getStripeClient();
  let customerId = user.stripeCustomerId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.primaryEmailAddress?.emailAddress ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing?canceled=true`,
    line_items: [
      {
        price: getStripePriceId(body.plan),
        quantity: 1,
      },
    ],
    metadata: { userId, plan: body.plan },
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
