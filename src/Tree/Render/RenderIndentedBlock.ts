import type {IndentedBlockNode} from "../Node/IndentedBlockNode.js";

export function renderIndentedBlock(node: IndentedBlockNode): string[] {
    const indent = " ".repeat(node.indent);
    return node.lines.map((line) => line.length === 0 ? "" : indent + line);
}