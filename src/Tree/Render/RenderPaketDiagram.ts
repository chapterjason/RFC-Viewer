import {applyIndent} from "../../Utils/ApplyIndent.js";
import type {PaketDiagramNode} from "../Node/PaketDiagramNode.js";

export function renderPaketDiagram(node: PaketDiagramNode): string[] {
    return applyIndent(node.lines, node.indent);
}

