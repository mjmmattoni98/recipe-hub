import {
  parseAssistantAnswer,
  type InlineNode,
} from "@/components/recipes/assistant-answer";

const InlineText = ({ nodes }: { nodes: InlineNode[] }) =>
  nodes.map((node, index) => {
    if (node.type === "text") {
      return <span key={index}>{node.text}</span>;
    }

    if (node.type === "strong") {
      return (
        <strong key={index} className="font-semibold">
          <InlineText nodes={node.children} />
        </strong>
      );
    }

    if (node.type === "emphasis") {
      return (
        <em key={index}>
          <InlineText nodes={node.children} />
        </em>
      );
    }

    if (node.type === "code") {
      return (
        <code
          key={index}
          className="bg-background rounded px-1 py-0.5 text-[0.85em]"
        >
          {node.text}
        </code>
      );
    }

    return (
      <a
        key={index}
        href={node.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary decoration-primary/40 underline underline-offset-2"
      >
        {node.text}
      </a>
    );
  });

export const AssistantAnswer = ({ answer }: { answer: string }) => {
  const blocks = parseAssistantAnswer(answer);

  return (
    <div
      className="bg-muted/60 mt-4 space-y-4 rounded-xl px-4 py-4 leading-relaxed"
      aria-live="polite"
    >
      {blocks.length === 0 ? (
        <p className="text-foreground font-body whitespace-pre-wrap">
          {answer}
        </p>
      ) : (
        blocks.map((block, index) => {
          if (block.type === "paragraph") {
            return (
              <p key={index} className="text-foreground font-body text-pretty">
                <InlineText nodes={block.children} />
              </p>
            );
          }

          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className="space-y-3">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  {block.ordered ? (
                    <span
                      aria-hidden="true"
                      className="bg-primary text-primary-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      {itemIndex + 1}
                    </span>
                  ) : (
                    <span
                      className="bg-primary/15 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full"
                      aria-hidden="true"
                    >
                      <span className="bg-primary size-1.5 rounded-full" />
                    </span>
                  )}
                  <div className="min-w-0">
                    {item.label ? (
                      <p className="text-foreground font-body font-semibold text-pretty">
                        <InlineText nodes={item.label} />
                      </p>
                    ) : null}
                    {item.body.length > 0 ? (
                      <p
                        className={
                          item.label
                            ? "text-foreground font-body mt-0.5 text-pretty"
                            : "text-foreground font-body text-pretty"
                        }
                      >
                        <InlineText nodes={item.body} />
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ListTag>
          );
        })
      )}
    </div>
  );
};
