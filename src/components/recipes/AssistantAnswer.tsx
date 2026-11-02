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
          className="bg-secondary rounded px-1 py-0.5 font-mono text-[0.85em]"
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
      className="border-primary mt-6 space-y-4 border-l-2 pl-5 leading-relaxed"
      aria-live="polite"
    >
      {blocks.length === 0 ? (
        <p className="text-foreground whitespace-pre-wrap">{answer}</p>
      ) : (
        blocks.map((block, index) => {
          if (block.type === "paragraph") {
            return (
              <p key={index} className="text-foreground text-pretty">
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
                      className="text-primary font-display mt-[-0.2rem] w-6 shrink-0 text-2xl leading-none"
                    >
                      {itemIndex + 1}
                    </span>
                  ) : (
                    <span
                      className="mt-2.5 flex w-6 shrink-0 justify-center"
                      aria-hidden="true"
                    >
                      <span className="bg-primary size-1.5 rounded-full" />
                    </span>
                  )}
                  <div className="min-w-0">
                    {item.label ? (
                      <p className="text-foreground font-semibold text-pretty">
                        <InlineText nodes={item.label} />
                      </p>
                    ) : null}
                    {item.body.length > 0 ? (
                      <p
                        className={
                          item.label
                            ? "text-foreground mt-0.5 text-pretty"
                            : "text-foreground text-pretty"
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
