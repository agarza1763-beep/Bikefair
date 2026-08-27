import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Storage abstraction for user-uploaded media (bike photos). Swap `getStorageProvider()`'s
 * returned implementation to point at S3/R2/GCS in production — nothing else in the app needs
 * to change since callers only ever see `save()` and a public URL back.
 */
export interface StorageProvider {
  save(file: { buffer: Buffer; filename: string; mimeType: string }): Promise<string>;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export function validateImageUpload(file: { size: number; mimeType: string }) {
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new Error("Unsupported file type. Please upload a JPEG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 8MB.");
  }
}

class LocalDiskStorageProvider implements StorageProvider {
  private uploadsDir = path.join(process.cwd(), "public", "uploads");

  async save(file: { buffer: Buffer; filename: string; mimeType: string }): Promise<string> {
    await mkdir(this.uploadsDir, { recursive: true });
    const ext = extensionForMime(file.mimeType) ?? path.extname(file.filename) ?? ".bin";
    const name = `${randomUUID()}${ext}`;
    await writeFile(path.join(/* turbopackIgnore: true */ this.uploadsDir, name), file.buffer);
    return `/uploads/${name}`;
  }
}

// Placeholder — implement when S3_* env vars are configured (see .env.example).
class S3StorageProvider implements StorageProvider {
  async save(): Promise<string> {
    throw new Error(
      "S3 storage is not yet implemented in this MVP. Configure STORAGE_PROVIDER=local, or " +
        "implement S3StorageProvider in src/lib/storage.ts using the AWS SDK v3 (@aws-sdk/client-s3) " +
        "with the S3_* environment variables already scaffolded in .env.example."
    );
  }
}

function extensionForMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return null;
  }
}

let providerInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!providerInstance) {
    providerInstance = process.env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider() : new LocalDiskStorageProvider();
  }
  return providerInstance;
}
