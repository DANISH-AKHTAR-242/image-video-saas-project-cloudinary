"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MediaUploaderProps = {
  title: string;
  description: string;
  accept: string;
  endpoint: "/api/image-upload" | "/api/video-upload";
  maxFileSize: number;
};

export function MediaUploader({
  title,
  description,
  accept,
  endpoint,
  maxFileSize,
}: MediaUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxFileSizeMb = useMemo(
    () => Math.round(maxFileSize / 1024 / 1024),
    [maxFileSize]
  );

  const onPickFile = (candidate: File | null) => {
    if (!candidate) return;
    if (candidate.size > maxFileSize) {
      setError(`File is too large. Max allowed is ${maxFileSizeMb}MB.`);
      return;
    }
    setError(null);
    setFile(candidate);
    if (!name) {
      setName(candidate.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError(null);
    setToast(null);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", name);
    formData.append("description", details);
    formData.append("originalSize", String(file.size));

    try {
      await axios.post(endpoint, formData, {
        onUploadProgress(progressEvent) {
          if (!progressEvent.total) return;
          const nextProgress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          setProgress(nextProgress);
        },
      });
      setToast(`${title} uploaded successfully.`);
      setTimeout(() => router.push("/home"), 800);
    } catch (uploadError) {
      if (axios.isAxiosError(uploadError) && uploadError.response?.data?.error) {
        setError(uploadError.response.data.error);
      } else {
        setError("Upload failed. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-lg">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm opacity-70">{description}</p>

      {toast && (
        <div className="alert alert-success mt-4">
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error mt-4">
          <span>{error}</span>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-base-300 p-8 text-center hover:border-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPickFile(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm font-semibold">
            Drag & drop file here or click to browse
          </span>
          <span className="mt-2 text-xs opacity-70">
            Max {maxFileSizeMb}MB • Accepted: {accept}
          </span>
          {file && (
            <span className="mt-2 text-xs text-primary">Selected: {file.name}</span>
          )}
        </label>

        <label className="form-control">
          <span className="label-text">Asset title</span>
          <input
            className="input input-bordered mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="form-control">
          <span className="label-text">Description</span>
          <textarea
            className="textarea textarea-bordered mt-1"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what this media will be used for"
          />
        </label>

        {isUploading && (
          <progress className="progress progress-primary w-full" value={progress} max={100} />
        )}

        <button className="btn btn-primary w-full" type="submit" disabled={isUploading}>
          {isUploading ? `Uploading ${progress}%...` : `Upload ${title}`}
        </button>
      </form>
    </div>
  );
}

