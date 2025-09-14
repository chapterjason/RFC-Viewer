import type {ParagraphNode} from "../Node/ParagraphNode.js";
import {applyIndent} from "../../Utils/ApplyIndent.js";

export function renderParagraph(node: ParagraphNode): string[] {
    return applyIndent(node.lines, node.indent);
}
