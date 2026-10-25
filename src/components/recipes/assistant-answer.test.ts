import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assistantAnswerText,
  parseAssistantAnswer,
  type AnswerBlock,
} from "./assistant-answer";

const listItems = (blocks: AnswerBlock[]) => {
  const list = blocks.find((block) => block.type === "list");
  assert.ok(list && list.type === "list");
  return list.items.map((item) => ({
    label: item.label
      ? assistantAnswerText([{ type: "paragraph", children: item.label }])
      : null,
    body: assistantAnswerText([{ type: "paragraph", children: item.body }]),
  }));
};

const paragraphs = (blocks: AnswerBlock[]) =>
  blocks.flatMap((block) =>
    block.type === "paragraph" ? [assistantAnswerText([block])] : [],
  );

describe("parseAssistantAnswer", () => {
  it("turns a flattened substitution paragraph into a list", () => {
    const blocks = parseAssistantAnswer(
      "Si te falta algún ingrediente, puedes probar estas sustituciones fáciles: – **Hamburguesa** – usa carne molida (ternera, pollo o cerdo), o una opción vegetariana como tofu, seitán o una hamburguesa de legumbres. – **Arroz** – cualquier grano de cocción rápida (quinoa, arroz integral, cebada) o fideos de arroz funcionan igual de bien. – **Salsa de soja** – tamari, salsa Worcestershire o una cucharada de salsa más una pizca de sal y un chorrito de vinagre. – **Tomate concentrado o frito** – tomate frito normal, ketchup o una cucharada de puré de tomate con un poco de caldo. – **Cebolla** – cebollas moradas, chalotas o incluso ajo y un poco de cebolleta picada; también puedes saltártela si lo prefieres. – **Zanahoria en tiras** – pimiento rojo o amarillo cortado en tiras finas, apio o simplemente omítelo. – **Azúcar o miel (opcional)** – sirope de arce, agave o un toque de jugo de limón para un toque de acidez. Si necesitas ajustar el número de raciones, simplemente escala todos los ingredientes proporcionalmente (por ejemplo, para 4 raciones, duplica cada cantidad). Si omites un ingrediente opcional como el endulzante, no debería afectar mucho el sabor general.",
    );

    assert.deepEqual(paragraphs(blocks), [
      "Si te falta algún ingrediente, puedes probar estas sustituciones fáciles:",
      "Si necesitas ajustar el número de raciones, simplemente escala todos los ingredientes proporcionalmente (por ejemplo, para 4 raciones, duplica cada cantidad).",
      "Si omites un ingrediente opcional como el endulzante, no debería afectar mucho el sabor general.",
    ]);
    assert.deepEqual(
      listItems(blocks).map((item) => item.label),
      [
        "Hamburguesa",
        "Arroz",
        "Salsa de soja",
        "Tomate concentrado o frito",
        "Cebolla",
        "Zanahoria en tiras",
        "Azúcar o miel (opcional)",
      ],
    );
    assert.match(listItems(blocks)[0]?.body ?? "", /^usa carne molida/);
    assert.match(listItems(blocks)[6]?.body ?? "", /^sirope de arce/);
    assert.equal(assistantAnswerText(blocks).includes("**"), false);
  });

  it("keeps a short answer as a paragraph and renders emphasis", () => {
    const blocks = parseAssistantAnswer(
      "El horno no figura en la receta. Dora la cebolla en **sartén** a fuego *medio*.",
    );

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.type, "paragraph");
    assert.equal(
      assistantAnswerText(blocks),
      "El horno no figura en la receta. Dora la cebolla en sartén a fuego medio.",
    );
    assert.equal(
      blocks[0]?.type === "paragraph" &&
        blocks[0].children.some((node) => node.type === "strong"),
      true,
    );
  });

  it("reads markdown lists and safe links", () => {
    const blocks = parseAssistantAnswer(`Prepara esto primero:

1. **Dorar la cebolla** hasta que esté transparente.
2. Añade el arroz.

Más detalle en [la técnica](https://example.com/sofrito). No sigas [esto](javascript:alert(1)).`);

    const steps = blocks.find((block) => block.type === "list");
    assert.ok(steps && steps.type === "list" && steps.ordered);
    assert.deepEqual(
      steps.items.map((item) =>
        item.label
          ? assistantAnswerText([{ type: "paragraph", children: item.label }])
          : assistantAnswerText([{ type: "paragraph", children: item.body }]),
      ),
      ["Dorar la cebolla", "Añade el arroz."],
    );

    const closing = blocks.at(-1);
    assert.ok(closing && closing.type === "paragraph");
    const link = closing.children.find((node) => node.type === "link");
    assert.ok(link && link.type === "link");
    assert.equal(link.href, "https://example.com/sofrito");
    assert.match(assistantAnswerText([closing]), /javascript:alert/);
  });

  it("splits several bold labels written in one paragraph", () => {
    const blocks = parseAssistantAnswer(
      "Puedes adaptarlo. **Hamburguesa:** tofu o seitán. **Arroz:** quinoa. Si son 2 raciones, usa la mitad.",
    );

    assert.deepEqual(paragraphs(blocks), [
      "Puedes adaptarlo.",
      "Si son 2 raciones, usa la mitad.",
    ]);
    assert.deepEqual(listItems(blocks), [
      { label: "Hamburguesa", body: "tofu o seitán." },
      { label: "Arroz", body: "quinoa." },
    ]);
  });

  it("keeps numbered steps together when a blank line separates them", () => {
    const blocks = parseAssistantAnswer(`Empieza por aquí:

1. **Dorar la cebolla** hasta que esté transparente.

2. Añade el arroz.

Luego tapa la sartén.`);

    const steps = blocks.find((block) => block.type === "list");
    assert.ok(steps && steps.type === "list");
    assert.equal(steps.ordered, true);
    assert.equal(steps.items.length, 2);
    assert.deepEqual(paragraphs(blocks), [
      "Empieza por aquí:",
      "Luego tapa la sartén.",
    ]);
  });

  it("leaves markup as text", () => {
    const blocks = parseAssistantAnswer("Usa <strong>sal</strong> al gusto.");
    assert.equal(
      assistantAnswerText(blocks),
      "Usa <strong>sal</strong> al gusto.",
    );
  });
});
