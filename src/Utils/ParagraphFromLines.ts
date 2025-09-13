import type {Position} from "../Tree/Position.js";
import type {ParagraphNode} from "../Tree/Node/ParagraphNode.js";

export function paragraphFromLines(lines: string[], startLine: number, startPosition?: Position): ParagraphNode {
    const start = startPosition ?? {line: startLine, column: 0, offset: null};
    return {
        type: "Paragraph",
        lines,
        position: {start, end: {line: startLine + lines.length, column: 0, offset: null}}
    };
}