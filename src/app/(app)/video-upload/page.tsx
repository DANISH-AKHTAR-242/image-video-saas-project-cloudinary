import { MediaUploader } from "@/features/uploader/MediaUploader";

export default function VideoUploadPage() {
  return (
    <MediaUploader
      title="Video"
      description="Upload videos for optimization, format conversion, and content delivery."
      accept="video/*"
      endpoint="/api/video-upload"
      maxFileSize={70 * 1024 * 1024}
    />
  );
}

