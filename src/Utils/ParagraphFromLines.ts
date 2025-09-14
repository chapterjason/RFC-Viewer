import type {ParagraphNode} from "../Tree/Node/ParagraphNode.js";
import {getCommonIndentation} from "./GetCommonIndentation.js";

export function paragraphFromLines(lines: string[]): ParagraphNode {
    const indent = getCommonIndentation(lines);

    const content = lines.map((line) => {
        if (line.length === 0) {
            return "";
        }

        // Do not emit spaces on otherwise blank lines; remove common indent from non-blank lines only
        return line.slice(indent);
    });

    return {
        type: "Paragraph",
        indent,
        lines: content,
    };
}
