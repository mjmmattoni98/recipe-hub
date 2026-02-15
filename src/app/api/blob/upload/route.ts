import { env } from "@/env";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const toSafeFilename = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9.-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

const getPutOptions = () => {
  const token = env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    return {
      access: "public" as const,
      token,
    };
  }

  return {
    access: "public" as const,
  };
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Image file is required" },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are supported" },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const baseName = file.name.replace(/\.[^/.]+$/, "") || "recipe-image";
  const safeName = toSafeFilename(baseName) || "recipe-image";
  const blobPath = `recipes/${safeName}-${Date.now()}.${extension}`;

  const blob = await put(blobPath, file, getPutOptions());

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
  });
}
