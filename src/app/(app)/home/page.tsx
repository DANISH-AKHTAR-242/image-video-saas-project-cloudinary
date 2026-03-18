"use client";

import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import VideoCard from "@/components/VideoCard";
import { Asset, UsageSnapshot } from "@/types";
import { getCldImageUrl } from "next-cloudinary";
import Image from "next/image";

dayjs.extend(relativeTime);

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [assetsResponse, usageResponse] = await Promise.all([
        axios.get<Asset[]>("/api/assets"),
        axios.get<UsageSnapshot>("/api/usage"),
      ]);
      setAssets(assetsResponse.data);
      setUsage(usageResponse.data);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (loading) {
    return <div className="py-10 text-center">Loading dashboard...</div>;
  }

  const videos = assets.filter((asset) => asset.type === "VIDEO");
  const images = assets.filter((asset) => asset.type === "IMAGE");
  const uploadUsagePercent = usage
    ? Math.min(100, Math.round((usage.uploadsToday / usage.dailyUploadLimit) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card bg-base-200 p-4">
          <p className="text-xs uppercase opacity-70">Plan</p>
          <h2 className="text-xl font-semibold">{usage?.plan ?? "FREE"}</h2>
          <p className="text-sm opacity-70">
            {usage?.plan === "FREE"
              ? "Upgrade to unlock faster processing and bigger limits."
              : "Priority processing enabled."}
          </p>
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-xs uppercase opacity-70">Daily uploads</p>
          <h2 className="text-xl font-semibold">
            {usage?.uploadsToday ?? 0} / {usage?.dailyUploadLimit ?? 0}
          </h2>
          <progress className="progress progress-primary mt-2" value={uploadUsagePercent} max={100} />
        </div>
        <div className="card bg-base-200 p-4">
          <p className="text-xs uppercase opacity-70">Monthly transforms</p>
          <h2 className="text-xl font-semibold">
            {usage?.transformationsThisMonth ?? 0} /{" "}
            {usage?.monthlyTransformationLimit ?? 0}
          </h2>
          <p className="text-sm opacity-70">
            Last upload{" "}
            {usage?.lastUploadAt ? dayjs(usage.lastUploadAt).fromNow() : "not yet"}
          </p>
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-2xl font-semibold">Video history</h3>
        {videos.length === 0 ? (
          <p className="opacity-70">No uploaded videos yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={(url) => handleDownload(url, `${video.title}.mp4`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl font-semibold">Image history</h3>
        {images.length === 0 ? (
          <p className="opacity-70">No uploaded images yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {images.map((asset) => (
              <article key={asset.id} className="rounded-xl border border-base-300 p-3">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={getCldImageUrl({ src: asset.publicId, width: 400, height: 225, crop: "fill" })}
                    alt={asset.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <h4 className="mt-3 font-semibold">{asset.title}</h4>
                <p className="text-sm opacity-70">
                  Uploaded {dayjs(asset.createdAt).fromNow()}
                </p>
                <button
                  className="btn btn-outline btn-sm mt-3 w-full"
                  onClick={() =>
                    handleDownload(
                      getCldImageUrl({ src: asset.publicId, quality: "auto", format: "auto" }),
                      `${asset.title}.${asset.format ?? "jpg"}`
                    )
                  }
                >
                  <DownloadIcon size={14} />
                  Download
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

