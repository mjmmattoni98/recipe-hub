// Ingredients are free text ("450g ricotta", "1/2 taza de leche", "sal al
// gusto"), so scaling only touches a quantity at the very start of the line
// and leaves everything else as written.

const UNICODE_FRACTIONS: Record<string, number> = {
  "⅛": 1 / 8,
  "¼": 1 / 4,
  "⅓": 1 / 3,
  "½": 1 / 2,
  "⅔": 2 / 3,
  "¾": 3 / 4,
};

// Order matters: the regex takes the first alternative that matches, so the
// longer forms come before the plain number they start with.
const QUANTITY = [
  String.raw`\d+\s+\d+\/\d+`, // 1 1/2
  String.raw`\d+\/\d+`, // 1/2
  String.raw`\d+\s?[⅛¼⅓½⅔¾]`, // 1½, 1 ½
  String.raw`\d{1,3}(?:\.\d{3})+(?![\d,])`, // 1.000 (thousands separator)
  String.raw`\d+(?:[.,]\d+)?`, // 2, 1.5, 1,5
  String.raw`[⅛¼⅓½⅔¾]`, // ½
].join("|");

const LEADING_QUANTITY = new RegExp(
  String.raw`^(\s*)(${QUANTITY})(?:(\s*[-–]\s*)(${QUANTITY}))?`,
);

// Common kitchen fractions, shown as glyphs when a result lands near one
const FRACTION_GLYPHS: [number, string][] = [
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];

const decimalFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
});

function parseQuantity(text: string): number {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const glyph = /^(\d*)\s?([⅛¼⅓½⅔¾])$/.exec(text);
  if (glyph) return Number(glyph[1] || 0) + (UNICODE_FRACTIONS[glyph[2]!] ?? 0);

  if (/^\d{1,3}(?:\.\d{3})+$/.test(text)) {
    return Number(text.replaceAll(".", ""));
  }

  return Number(text.replace(",", "."));
}

function formatQuantity(value: number): string {
  // Nobody measures 337.5 g; past 10 whole units are precise enough
  if (value >= 10) return String(Math.round(value));

  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder > 0.95) return String(whole + 1);
  if (remainder < 0.05 && whole > 0) return String(whole);

  const glyph = FRACTION_GLYPHS.find(
    ([fraction]) => Math.abs(remainder - fraction) < 0.04,
  );
  if (glyph) return whole > 0 ? `${whole}${glyph[1]}` : glyph[1];

  return decimalFormat.format(value);
}

export function scaleIngredient(ingredient: string, factor: number): string {
  if (factor === 1 || !Number.isFinite(factor) || factor <= 0) {
    return ingredient;
  }

  const match = LEADING_QUANTITY.exec(ingredient);
  if (!match) return ingredient;

  const [whole, leading = "", from = "", separator, to] = match;
  const amount = parseQuantity(from);
  if (!Number.isFinite(amount)) return ingredient;

  const scaledFrom = formatQuantity(amount * factor);
  const scaledTo =
    separator !== undefined && to !== undefined
      ? `${separator}${formatQuantity(parseQuantity(to) * factor)}`
      : "";

  return `${leading}${scaledFrom}${scaledTo}${ingredient.slice(whole.length)}`;
}
