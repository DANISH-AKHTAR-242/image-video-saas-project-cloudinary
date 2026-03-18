import { MediaUploader } from "@/features/uploader/MediaUploader";

export default function ImageUploadPage() {
  return (
    <MediaUploader
      title="Image"
      description="Upload images with secure processing and cloud optimization."
      accept="image/*"
      endpoint="/api/image-upload"
      maxFileSize={20 * 1024 * 1024}
    />
  );
}

