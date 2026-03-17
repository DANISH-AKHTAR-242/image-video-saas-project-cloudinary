"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VideoCard from "@/components/VideoCard";
import { Asset, UsageSnapshot } from "@/types";

function Home() {
  const [videos, setVideos] = useState<Asset[]>([]);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get("/api/videos");
      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await axios.get("/api/usage");
      setUsage(response.data);
    } catch (fetchError) {
      console.error(fetchError);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchUsage();
  }, [fetchUsage, fetchVideos]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Videos</h1>
          <p className="text-sm text-gray-500">
            Your recent uploads and compressed assets.
          </p>
        </div>
        {usage && (
          <div className="bg-base-200 rounded-lg p-3 shadow-sm w-full md:w-auto">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-gray-500">Plan</div>
                <div className="font-semibold">{usage.plan}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Uploads</div>
                <div className="font-semibold">
                  {usage.uploadsToday}/{usage.freeTierLimit} today
                </div>
              </div>
            </div>
            <progress
              className="progress progress-primary mt-2 w-full"
              value={usage.uploadsToday}
              max={usage.freeTierLimit}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center text-lg text-gray-500">
          No videos available
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
