import Link from "next/link";
import { PLAN_PRICES } from "@/lib/plans";

const tiers = [
  {
    name: "Free",
    price: `$${PLAN_PRICES.FREE}`,
    description: "Perfect for creators getting started.",
    features: ["10 uploads/day", "Basic transformations", "Community support"],
  },
  {
    name: "Pro",
    price: `$${PLAN_PRICES.PRO}/mo`,
    description: "Built for agencies and growing teams.",
    features: ["250 uploads/day", "Faster processing", "Priority queue"],
  },
  {
    name: "Business",
    price: `$${PLAN_PRICES.BUSINESS}/mo`,
    description: "Scale with unlimited media workflows.",
    features: ["Unlimited uploads", "Priority support", "Advanced analytics"],
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase text-primary">
          Cloudinary-lite for creators & developers
        </p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight">
          Launch media workflows that convert.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base opacity-75">
          Imaginify helps teams upload, optimize, transform, and deliver images &
          videos with secure billing and SaaS-grade usage controls.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/home" className="btn btn-primary">
            Go to Dashboard
          </Link>
          <Link href="/billing" className="btn btn-outline">
            View Pricing
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article key={tier.name} className="rounded-2xl border border-base-300 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">{tier.name}</h2>
            <p className="mt-2 text-3xl font-bold">{tier.price}</p>
            <p className="mt-2 text-sm opacity-70">{tier.description}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {tier.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}

