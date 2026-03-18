import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing Cloudinary configuration: ${missing.join(", ")}. Check your environment variables.`
    );
  }
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadResult = {
  public_id: string;
  bytes: number;
  duration?: number;
  format?: string;
};

class CloudinaryService {
  async uploadVideo(buffer: Buffer) {
    assertEnv();
    return this.upload(buffer, {
      resource_type: "video",
      folder: "video-uploads",
      transformation: [{ quality: "auto", fetch_format: "mp4" }],
    });
  }

  async uploadImage(buffer: Buffer) {
    assertEnv();
    return this.upload(buffer, {
      resource_type: "image",
      folder: "image-uploads",
    });
  }

  async deleteAsset(publicId: string, resourceType: "image" | "video") {
    assertEnv();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  transformMedia(
    publicId: string,
    options: {
      resourceType?: "image" | "video";
      width?: number;
      height?: number;
      crop?: "fill" | "fit" | "thumb" | "scale";
      quality?: "auto" | number;
      format?: string;
    }
  ) {
    assertEnv();
    const transformations = [
      {
        width: options.width,
        height: options.height,
        crop: options.crop ?? "fill",
        quality: options.quality ?? "auto",
        fetch_format: options.format,
      },
    ];

    return cloudinary.url(publicId, {
      resource_type: options.resourceType ?? "image",
      secure: true,
      transformation: transformations,
    });
  }

  generateOptimizedUrl(
    publicId: string,
    resourceType: "image" | "video" = "image"
  ) {
    assertEnv();
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      quality: "auto",
      fetch_format: "auto",
    });
  }

  private upload(
    buffer: Buffer,
    options: UploadApiOptions
  ) {
    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Unknown Cloudinary error"));
          }
          resolve(result as UploadResult);
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
