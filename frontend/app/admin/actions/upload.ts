"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Post media blocks are only ever images or videos (the upload <input> is
// already restricted to accept="image/*,video/*") — reject anything else
// server-side too, since the client-side accept attribute is just a UI hint.
const ALLOWED_CONTENT_TYPE = /^(image|video)\//;

// R2 keys end up embedded verbatim in the public URL we hand back to the
// client (no URL-encoding applied), so the sanitized name has to be safe both
// as a URL path segment and as an object key: no slashes (no path traversal /
// accidental nested "folders" in the bucket), no whitespace, no control
// characters, bounded length.
function sanitizeFilename(rawName: string): string {
  const lastDot = rawName.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < rawName.length - 1;
  const base = hasExt ? rawName.slice(0, lastDot) : rawName;
  const ext = hasExt ? rawName.slice(lastDot + 1) : "";

  const safeBase =
    base
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "file";

  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toLowerCase();

  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  try {
    if (!ALLOWED_CONTENT_TYPE.test(contentType || "")) {
      return { success: false, error: `Unsupported content type: ${contentType}` };
    }

    const safeFilename = sanitizeFilename(filename || "file");

    // Generate a unique filename to prevent overwrites
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${safeFilename}`;

    // In our DB architecture, the path could be stored directly
    // Let's store them in a "media/" prefix if needed, or root.
    const key = `media/${uniqueFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // URL expires in 1 hour
    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });

    return { success: true, url: presignedUrl, key };
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return { success: false, error: error.message || "Failed to generate upload URL" };
  }
}

export async function deleteObjectFromR2(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    await S3.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting object from R2:", error, "Key:", key);
    return { success: false, error: error.message };
  }
}

