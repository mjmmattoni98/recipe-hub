/**
 * Regenerates the app icons and the default social image from the artwork in
 * `public/favicon.ico`. The PNGs it writes are committed; run it again only if
 * the artwork or the palette changes:
 *
 *   pnpm exec tsx scripts/generate-brand-images.tsx
 *
 * The wordmark is set in Instrument Serif (SIL OFL, see `scripts/fonts/`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url);
const path = (relative: string) => new URL(relative, ROOT);

// Palette from src/styles/globals.css, light theme, converted to sRGB.
const COLORS = {
  background: "#f9f6f1", // --background
  foreground: "#201914", // --foreground
  mutedForeground: "#615953", // --muted-foreground
  primary: "#496126", // --primary
};

/** Decodes the 32-bit BMP image stored in the .ico into raw RGBA pixels. */
function readIcoArtwork(file: URL) {
  const ico = readFileSync(file);
  const entryOffset = 22; // 6-byte header + one 16-byte directory entry
  const dataOffset = ico.readUInt32LE(18);
  const headerSize = ico.readUInt32LE(dataOffset);
  const width = ico.readInt32LE(dataOffset + 4);
  const height = ico.readInt32LE(dataOffset + 8) / 2; // includes the AND mask
  const bitsPerPixel = ico.readUInt16LE(dataOffset + 14);

  if (
    ico.readUInt16LE(2) !== 1 ||
    ico.readUInt16LE(4) !== 1 ||
    headerSize !== 40 ||
    bitsPerPixel !== 32 ||
    dataOffset !== entryOffset
  ) {
    throw new Error("favicon.ico is not a single 32-bit BMP icon");
  }

  const pixels = ico.subarray(
    dataOffset + headerSize,
    dataOffset + headerSize + width * height * 4,
  );
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // BMP rows run bottom to top and pixels are stored as BGRA.
      const source = ((height - 1 - y) * width + x) * 4;
      const target = (y * width + x) * 4;
      rgba[target] = pixels[source + 2]!;
      rgba[target + 1] = pixels[source + 1]!;
      rgba[target + 2] = pixels[source]!;
      rgba[target + 3] = pixels[source + 3]!;
    }
  }

  return { rgba, width, height };
}

/** Average colour of the four corners, which only show the artwork's backdrop. */
function backdropColor({
  rgba,
  width,
  height,
}: ReturnType<typeof readIcoArtwork>) {
  const block = 16;
  const sum = [0, 0, 0];
  let count = 0;
  for (const originX of [0, width - block]) {
    for (const originY of [0, height - block]) {
      for (let y = originY; y < originY + block; y++) {
        for (let x = originX; x < originX + block; x++) {
          const i = (y * width + x) * 4;
          sum[0]! += rgba[i]!;
          sum[1]! += rgba[i + 1]!;
          sum[2]! += rgba[i + 2]!;
          count++;
        }
      }
    }
  }
  const [r, g, b] = sum.map((channel) => Math.round(channel / count));
  return { r: r!, g: g!, b: b! };
}

async function main() {
  const artwork = readIcoArtwork(path("public/favicon.ico"));
  const { width, height } = artwork;
  const source = () =>
    sharp(artwork.rgba, { raw: { width, height, channels: 4 } });

  const square = (size: number) =>
    source().resize(size, size, { kernel: "lanczos3" }).png().toBuffer();

  // Standard icons: the artwork as it is, backdrop included.
  for (const [file, size] of [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/apple-touch-icon.png", 180],
  ] as const) {
    writeFileSync(path(file), await square(size));
  }

  // Maskable icon: launchers crop to a circle of 80% of the width, so the
  // artwork shrinks into the middle and its edges fade into a flat fill of the
  // artwork's own backdrop colour.
  const maskableSize = 512;
  const inner = Math.round(maskableSize * 0.78);
  const fade = 16;
  const edgeMask = await sharp({
    create: {
      width: inner,
      height: inner,
      channels: 3,
      background: "#000",
    },
  })
    .composite([
      {
        input: {
          create: {
            width: inner - fade * 4,
            height: inner - fade * 4,
            channels: 3,
            background: "#fff",
          },
        },
        left: fade * 2,
        top: fade * 2,
      },
    ])
    .blur(fade)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const fadedArtwork = await sharp(await square(inner))
    .removeAlpha()
    .joinChannel(edgeMask, {
      raw: { width: inner, height: inner, channels: 1 },
    })
    .png()
    .toBuffer();
  writeFileSync(
    path("public/icons/icon-maskable-512.png"),
    await sharp({
      create: {
        width: maskableSize,
        height: maskableSize,
        channels: 3,
        background: backdropColor(artwork),
      },
    })
      .composite([{ input: fadedArtwork, gravity: "center" }])
      .png()
      .toBuffer(),
  );

  // Default social image: the artwork beside the wordmark.
  const serif = readFileSync(path("scripts/fonts/InstrumentSerif-Regular.ttf"));
  const serifItalic = readFileSync(
    path("scripts/fonts/InstrumentSerif-Italic.ttf"),
  );
  const tile = `data:image/png;base64,${(await square(840)).toString("base64")}`;
  const og = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 96px",
        gap: 72,
        background: COLORS.background,
        color: COLORS.foreground,
        fontFamily: "Instrument Serif",
      }}
    >
      {/* Satori renders plain <img>, not next/image. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={tile}
        width={420}
        height={420}
        alt=""
        style={{ borderRadius: 72 }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          <span>Recipe&nbsp;</span>
          <span style={{ fontStyle: "italic", color: COLORS.primary }}>
            Hub
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            lineHeight: 1.2,
            color: COLORS.mutedForeground,
          }}
        >
          Descubre, organiza y cocina recetas.
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        {
          name: "Instrument Serif",
          data: serifItalic,
          style: "italic",
          weight: 400,
        },
      ],
    },
  );
  writeFileSync(
    path("public/og-default.png"),
    Buffer.from(await og.arrayBuffer()),
  );
}

await main();
