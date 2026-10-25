export type InlineNode =
  | { type: "text"; text: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "emphasis"; children: InlineNode[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; text: string };

export type AnswerListItem = {
  label: InlineNode[] | null;
  body: InlineNode[];
};

export type AnswerBlock =
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: AnswerListItem[] };

const LABELED_ITEM = /(?:^|\s)[–—-]\s+\*\*([^*\n]+?)\*\*\s*[–—:-]\s+/g;
const COLON_LABEL = /(?<=^|[.!?]\s|\n)\*\*([^*\n]{1,80}?)\*\*\s*:\s+/g;
const BOLD_COLON_LABEL = /\*\*([^*\n:]{1,80}):\*\*\s*/g;
const MARKDOWN_LIST_LINE = /^(?:[-*•]|\d+[.)])\s+\S/;
const UNORDERED_ITEM = /^[-*•]\s+(.+)$/;
const ORDERED_ITEM = /^\d+[.)]\s+(.+)$/;
const LINK = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/;
const SENTENCE_BREAK = /^(.*?[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿])([\s\S]+)$/u;
const OUTRO_SENTENCE = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿])/u;

const inlineText = (nodes: InlineNode[]): string =>
  nodes
    .map((node) => {
      if (
        node.type === "text" ||
        node.type === "code" ||
        node.type === "link"
      ) {
        return node.text;
      }

      return inlineText(node.children);
    })
    .join("");

const parseInline = (input: string): InlineNode[] => {
  const nodes: InlineNode[] = [];
  let buffer = "";
  let index = 0;

  const flush = () => {
    if (buffer.length === 0) {
      return;
    }

    nodes.push({ type: "text", text: buffer });
    buffer = "";
  };

  while (index < input.length) {
    if (input.startsWith("**", index)) {
      const close = input.indexOf("**", index + 2);
      if (close > index + 2) {
        flush();
        nodes.push({
          type: "strong",
          children: parseInline(input.slice(index + 2, close)),
        });
        index = close + 2;
        continue;
      }
    }

    if (input[index] === "`") {
      const close = input.indexOf("`", index + 1);
      if (close > index + 1) {
        flush();
        nodes.push({ type: "code", text: input.slice(index + 1, close) });
        index = close + 1;
        continue;
      }
    }

    if (input[index] === "[") {
      const link = LINK.exec(input.slice(index));
      if (link?.[1] && link[2]) {
        flush();
        nodes.push({ type: "link", href: link[2], text: link[1] });
        index += link[0].length;
        continue;
      }
    }

    if (input[index] === "*" && input[index + 1] !== "*") {
      const close = input.indexOf("*", index + 1);
      const content = close > index ? input.slice(index + 1, close) : "";
      if (
        content.length > 0 &&
        content.length <= 120 &&
        !content.includes("*")
      ) {
        flush();
        nodes.push({ type: "emphasis", children: parseInline(content) });
        index = close + 1;
        continue;
      }
    }

    buffer += input[index];
    index += 1;
  }

  flush();
  return nodes;
};

const trimLabel = (nodes: InlineNode[]) => {
  if (nodes.length !== 1 || nodes[0]?.type !== "text") {
    return nodes;
  }

  const text = nodes[0].text.replace(/[:：]\s*$/, "").trim();
  if (text.length === 0) {
    return nodes;
  }

  return [{ type: "text" as const, text }];
};

const splitLabel = (nodes: InlineNode[]): AnswerListItem => {
  const [first, ...rest] = nodes;
  if (!first || first.type !== "strong") {
    return { label: null, body: nodes };
  }

  const [second, ...tail] = rest;
  if (!second) {
    return { label: trimLabel(first.children), body: [] };
  }

  if (second.type !== "text") {
    return { label: trimLabel(first.children), body: rest };
  }

  const stripped = second.text.replace(/^\s*[—–:-]\s*/, "");
  const separated = stripped !== second.text || /^\s/.test(second.text);
  if (!separated) {
    return { label: null, body: nodes };
  }

  const text = stripped.trimStart();
  const body =
    text.length > 0 ? [{ type: "text" as const, text }, ...tail] : tail;
  return { label: trimLabel(first.children), body };
};

const splitDetailAndOutro = (detail: string) => {
  const match = SENTENCE_BREAK.exec(detail.trim());
  if (!match?.[1] || !match[2]) {
    return { detail: detail.trim(), outro: "" };
  }

  return { detail: match[1].trim(), outro: match[2].trim() };
};

const formatOutro = (outro: string) =>
  outro
    .split(OUTRO_SENTENCE)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .join("\n\n");

type LabelMatch = {
  index: number;
  length: number;
  name: string;
};

const collectLabels = (source: string, pattern: RegExp): LabelMatch[] =>
  [...source.matchAll(pattern)].flatMap((match) => {
    const name = match[1]?.trim().replace(/[:：]\s*$/, "");
    if (!name || match.index === undefined) {
      return [];
    }

    return [{ index: match.index, length: match[0].length, name }];
  });

const markdownListLines = (source: string) =>
  source.split("\n").filter((line) => MARKDOWN_LIST_LINE.test(line.trim()))
    .length;

const promoteFlattenedLabels = (source: string) => {
  if (markdownListLines(source) >= 2) {
    return source;
  }

  const labels = [
    collectLabels(source, LABELED_ITEM),
    collectLabels(source, COLON_LABEL),
    collectLabels(source, BOLD_COLON_LABEL),
  ].find((matches) => matches.length >= 2);
  if (!labels) {
    return source;
  }

  const first = labels[0];
  if (!first) {
    return source;
  }

  const intro = source.slice(0, first.index).trim();
  let outro = "";
  const items = labels.flatMap((label, index) => {
    const next = labels[index + 1];
    let detail = source
      .slice(label.index + label.length, next?.index ?? source.length)
      .trim();
    if (!next) {
      const split = splitDetailAndOutro(detail);
      detail = split.detail;
      outro = split.outro;
    }

    return [`- **${label.name}** ${detail}`.trim()];
  });

  return [intro, items.join("\n"), formatOutro(outro)]
    .filter((part) => part.length > 0)
    .join("\n\n");
};

const listMarker = (line: string) => {
  const unordered = UNORDERED_ITEM.exec(line);
  if (unordered?.[1]) {
    return { ordered: false, text: unordered[1] };
  }

  const ordered = ORDERED_ITEM.exec(line);
  if (ordered?.[1]) {
    return { ordered: true, text: ordered[1] };
  }

  return null;
};

const parseBlocks = (markdown: string): AnswerBlock[] => {
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let deferredListBreak = false;

  const flushParagraph = () => {
    const text = paragraph.join(" ").replaceAll(/\s+/g, " ").trim();
    paragraph = [];
    if (text.length === 0) {
      return;
    }

    blocks.push({ type: "paragraph", children: parseInline(text) });
  };

  const flushList = () => {
    if (!list || list.items.length === 0) {
      list = null;
      return;
    }

    blocks.push({
      type: "list",
      ordered: list.ordered,
      items: list.items.map((item) => splitLabel(parseInline(item))),
    });
    list = null;
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0) {
      flushParagraph();
      deferredListBreak = list !== null;
      continue;
    }

    const marker = listMarker(line);
    if (
      list &&
      deferredListBreak &&
      marker &&
      marker.ordered === list.ordered
    ) {
      deferredListBreak = false;
      list.items.push(marker.text);
      continue;
    }

    if (deferredListBreak) {
      flushList();
      deferredListBreak = false;
    }

    if (list && /^\s+/.test(rawLine)) {
      const current = list.items.at(-1);
      if (current) {
        list.items[list.items.length - 1] = `${current} ${line}`;
      }
      continue;
    }

    if (marker) {
      flushParagraph();
      if (!list || list.ordered !== marker.ordered) {
        flushList();
        list = { ordered: marker.ordered, items: [] };
      }

      list.items.push(marker.text);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
};

export const parseAssistantAnswer = (answer: string): AnswerBlock[] => {
  const normalized = promoteFlattenedLabels(
    answer.replaceAll("\r\n", "\n").trim(),
  );
  return parseBlocks(normalized);
};

export const assistantAnswerText = (blocks: AnswerBlock[]) =>
  blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return inlineText(block.children);
      }

      return block.items
        .map((item) => {
          const label = item.label ? inlineText(item.label) : "";
          const body = inlineText(item.body);
          return [label, body].filter((part) => part.length > 0).join(" ");
        })
        .join("\n");
    })
    .join("\n");
