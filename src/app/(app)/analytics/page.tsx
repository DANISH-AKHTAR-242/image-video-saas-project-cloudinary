"use client";

import axios from "axios";
import { useEffect, useState } from "react";

type AnalyticsPayload = {
  dailyActiveUsers: number;
  uploadCount24h: number;
  conversionRate: number;
  recentEvents: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get<AnalyticsPayload>("/api/analytics");
        setAnalytics(response.data);
      } catch {
        setError("Unable to load analytics.");
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!analytics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card bg-base-200 p-4">
          <div className="text-sm opacity-70">Daily Active Users</div>
          <div className="text-3xl font-bold">{analytics.dailyActiveUsers}</div>
        </div>
        <div className="card bg-base-200 p-4">
          <div className="text-sm opacity-70">Uploads (24h)</div>
          <div className="text-3xl font-bold">{analytics.uploadCount24h}</div>
        </div>
        <div className="card bg-base-200 p-4">
          <div className="text-sm opacity-70">Free → Paid Conversion</div>
          <div className="text-3xl font-bold">{analytics.conversionRate}%</div>
        </div>
      </div>

      <div className="card border border-base-300 p-4">
        <h2 className="font-semibold">Recent events</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {analytics.recentEvents.map((event) => (
            <li key={event.id} className="flex justify-between border-b border-base-300 pb-2">
              <span>{event.name}</span>
              <span className="opacity-70">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

