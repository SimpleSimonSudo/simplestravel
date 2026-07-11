"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  try {
    // Generate a unique filename to prevent overwrites
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${filename}`;
    
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
