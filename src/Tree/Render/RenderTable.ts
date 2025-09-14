import type {TableNode} from "../Node/TableNode.js";
import {applyIndent} from "../../Utils/ApplyIndent.js";

export function renderTable(node: TableNode): string[] {
    return applyIndent(node.lines, node.indent);
}

