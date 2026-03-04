import { env } from "@/env";
import { getSessionFromHeaders } from "@/server/auth/get-session";
import { put } from "@vercel/blob";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
const OPTIMIZED_IMAGE_MAX_DIMENSION = 1920;
const RECIPE_IMAGE_PATH_REGEX =
  /^recipes\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?-[0-9]+\.[a-z0-9]+$/;

const getOptimizedImageBuffer = async (buffer: Buffer, contentType: string) => {
  const pipeline = sharp(buffer).rotate().resize({
    width: OPTIMIZED_IMAGE_MAX_DIMENSION,
    height: OPTIMIZED_IMAGE_MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  switch (contentType) {
    case "image/jpeg":
    case "image/jpg":
      return await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    case "image/png":
      return await pipeline
        .png({ compressionLevel: 9, palette: true })
        .toBuffer();
    case "image/webp":
      return await pipeline.webp({ quality: 78 }).toBuffer();
    case "image/avif":
      return await pipeline.avif({ quality: 55 }).toBuffer();
    default:
      return null;
  }
};

export async function POST(request: Request) {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid upload payload" },
      { status: 400 },
    );
  }

  if (body.type === "blob.generate-client-token") {
    const session = await getSessionFromHeaders(request.headers);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const response = await handleUpload({
      token: env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!RECIPE_IMAGE_PATH_REGEX.test(pathname)) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: MAX_IMAGE_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        const contentType = blob.contentType.toLowerCase();
        const shouldOptimize = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/avif",
        ].includes(contentType);

        if (!shouldOptimize) {
          return;
        }

        try {
          const originalResponse = await fetch(blob.url);

          if (!originalResponse.ok) {
            throw new Error("Failed to fetch uploaded image for optimization");
          }

          const originalBytes = await originalResponse.arrayBuffer();
          const optimizedBytes = await getOptimizedImageBuffer(
            Buffer.from(originalBytes),
            contentType,
          );

          if (
            !optimizedBytes ||
            optimizedBytes.length >= originalBytes.byteLength
          ) {
            return;
          }

          await put(blob.pathname, optimizedBytes, {
            access: "public",
            token: env.BLOB_READ_WRITE_TOKEN,
            allowOverwrite: true,
            addRandomSuffix: false,
            contentType: blob.contentType,
          });
        } catch (error) {
          console.error("Image optimization failed", error);
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error processing upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
