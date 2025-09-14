import type {ParagraphNode} from "../Node/ParagraphNode.js";

export function renderParagraph(node: ParagraphNode): string[] {
    const prefix = node.indent > 0 ? " ".repeat(node.indent) : "";
    return node.lines.map((line) => {
        if (line.length === 0) {
            // Do not emit spaces on blank lines
            return "";
        }
        return prefix + line;
    });
}
