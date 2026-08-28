import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

/**
 * Storage abstraction for user-uploaded media (bike photos). `getStorageProvider()` picks the
 * right implementation automatically — nothing else in the app needs to change since callers
 * only ever see `save()` and a public URL back.
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

/**
 * Writes to public/uploads on the local disk. Fine for local dev, but serverless hosts (Vercel
 * included) don't have a persistent, writable filesystem in production — a file saved this way
 * during one request can vanish (or never be visible to other instances) by the next request.
 * This is why it's only ever selected when BLOB_READ_WRITE_TOKEN isn't set (see
 * getStorageProvider() below) — i.e. local dev, never a real deployment.
 */
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

/**
 * Vercel Blob — the default in production. Requires BLOB_READ_WRITE_TOKEN, which Vercel injects
 * automatically once a Blob store is attached to the project (Vercel dashboard → Storage →
 * Create Database → Blob). No separate storage account or SDK configuration needed.
 */
class VercelBlobStorageProvider implements StorageProvider {
  async save(file: { buffer: Buffer; filename: string; mimeType: string }): Promise<string> {
    const ext = extensionForMime(file.mimeType) ?? path.extname(file.filename) ?? ".bin";
    const name = `uploads/${randomUUID()}${ext}`;
    const blob = await put(name, file.buffer, {
      access: "public",
      contentType: file.mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }
}

// Alternative for anyone who'd rather use S3/R2/GCS directly instead of Vercel Blob.
class S3StorageProvider implements StorageProvider {
  async save(): Promise<string> {
    throw new Error(
      "S3 storage is not implemented. Set BLOB_READ_WRITE_TOKEN to use Vercel Blob instead (recommended, see " +
        ".env.example), or implement S3StorageProvider in src/lib/storage.ts using the AWS SDK v3 " +
        "(@aws-sdk/client-s3) with the S3_* environment variables already scaffolded in .env.example."
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
    if (process.env.STORAGE_PROVIDER === "s3") {
      providerInstance = new S3StorageProvider();
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      providerInstance = new VercelBlobStorageProvider();
    } else {
      providerInstance = new LocalDiskStorageProvider();
    }
  }
  return providerInstance;
}
