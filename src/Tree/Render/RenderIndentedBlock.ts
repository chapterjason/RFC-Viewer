import type {IndentedBlockNode} from "../Node/IndentedBlockNode.js";
import {applyIndent} from "../../Utils/ApplyIndent.js";

export function renderIndentedBlock(node: IndentedBlockNode): string[] {
    return applyIndent(node.lines, node.indent);
}
