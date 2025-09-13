import type {ParagraphNode} from "../Node/ParagraphNode.js";

export function renderParagraph(node: ParagraphNode): string[] {
    return [...node.lines];
}
