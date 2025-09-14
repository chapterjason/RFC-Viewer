import type {ParagraphNode} from "../Tree/Node/ParagraphNode.js";

export function paragraphFromLines(lines: string[]): ParagraphNode {
    return {
        type: "Paragraph",
        lines,
    };
}
