"use client";

import axios from "axios";
import { useEffect, useState } from "react";

type AdminMetrics = {
  totalUsers: number;
  paidUsers: number;
  activeSubscriptions: number;
  revenueCents: number;
  recentUploads: Array<{
    id: string;
    title: string;
    type: "IMAGE" | "VIDEO";
    createdAt: string;
    user: { email: string | null };
  }>;
};

export default function AdminPage() {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get<AdminMetrics>("/api/admin/metrics");
        setData(response.data);
      } catch (loadError) {
        if (axios.isAxiosError(loadError) && loadError.response?.status === 403) {
          setError("Admin access required.");
          return;
        }
        setError("Unable to load admin metrics.");
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

  if (!data) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total users" value={data.totalUsers} />
        <MetricCard label="Paid users" value={data.paidUsers} />
        <MetricCard label="Active subscriptions" value={data.activeSubscriptions} />
        <MetricCard
          label="Revenue"
          value={`$${(data.revenueCents / 100).toLocaleString()}`}
        />
      </div>

      <div className="card border border-base-300 p-4">
        <h2 className="font-semibold">Recent uploads</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>User</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUploads.map((upload) => (
                <tr key={upload.id}>
                  <td>{upload.title}</td>
                  <td>{upload.type}</td>
                  <td>{upload.user.email ?? "Unknown"}</td>
                  <td>{new Date(upload.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card bg-base-200 p-4">
      <p className="text-xs uppercase opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

