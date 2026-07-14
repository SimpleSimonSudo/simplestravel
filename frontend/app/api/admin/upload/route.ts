import { NextRequest, NextResponse } from "next/server";
import { AwsClient } from "aws4fetch";

const r2 = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  service: "s3",
  region: "auto",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Generate a unique filename to prevent overwrites
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name}`;
    
    // Store in media/ prefix
    const key = `media/${uniqueFilename}`;

    const r2Endpoint = process.env.R2_ENDPOINT || "";
    const r2Bucket = process.env.R2_BUCKET_NAME || "";
    const r2Url = `${r2Endpoint}/${r2Bucket}/${key}`;

    const fileBuffer = await file.arrayBuffer();

    console.log(`Server-side uploading ${file.name} to R2...`);
    const uploadRes = await r2.fetch(r2Url, {
      method: "PUT",
      body: fileBuffer,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      throw new Error(`R2 upload failed: ${uploadRes.status} ${uploadRes.statusText}. Response: ${text}`);
    }

    const publicUrl = `${process.env.R2_PUBLIC_URL || "https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev"}/${key}`;

    return NextResponse.json({ success: true, key, publicUrl });
  } catch (error: any) {
    console.error("Error in server-side R2 upload:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to upload file to R2" }, { status: 500 });
  }
}
