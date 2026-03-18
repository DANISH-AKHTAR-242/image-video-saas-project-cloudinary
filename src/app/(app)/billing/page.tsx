"use client";

import axios from "axios";
import { useState } from "react";
import { PLAN_PRICES } from "@/lib/plans";

type PaidPlan = "PRO" | "BUSINESS";

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (plan: PaidPlan) => {
    setError(null);
    setLoadingPlan(plan);
    try {
      const response = await axios.post("/api/billing/checkout", { plan });
      const checkoutUrl: string | undefined = response.data.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (checkoutError) {
      if (axios.isAxiosError(checkoutError) && checkoutError.response?.data?.error) {
        setError(checkoutError.response.data.error);
      } else {
        setError("Unable to start checkout. Please try again.");
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-sm opacity-70">
          Choose the plan that matches your growth stage.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card border border-base-300 bg-base-100 p-6">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-1 text-3xl font-bold">${PLAN_PRICES.FREE}</p>
          <p className="mt-2 text-sm opacity-70">10 daily uploads, basic speeds.</p>
        </div>

        <div className="card border border-primary bg-base-100 p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="mt-1 text-3xl font-bold">${PLAN_PRICES.PRO}/mo</p>
          <p className="mt-2 text-sm opacity-70">
            Higher limits, faster processing, priority queue.
          </p>
          <button
            className="btn btn-primary mt-4"
            disabled={loadingPlan !== null}
            onClick={() => startCheckout("PRO")}
          >
            {loadingPlan === "PRO" ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        </div>

        <div className="card border border-base-300 bg-base-100 p-6">
          <h2 className="text-xl font-semibold">Business</h2>
          <p className="mt-1 text-3xl font-bold">${PLAN_PRICES.BUSINESS}/mo</p>
          <p className="mt-2 text-sm opacity-70">
            Unlimited usage + priority support for teams.
          </p>
          <button
            className="btn btn-secondary mt-4"
            disabled={loadingPlan !== null}
            onClick={() => startCheckout("BUSINESS")}
          >
            {loadingPlan === "BUSINESS" ? "Redirecting..." : "Choose Business"}
          </button>
        </div>
      </div>
    </div>
  );
}

