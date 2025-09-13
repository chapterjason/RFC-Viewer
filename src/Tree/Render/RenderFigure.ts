import type {FigureNode} from "../Node/FigureNode.js";

export function renderFigure(node: FigureNode): string[] {
    // Preserve lines exactly as parsed to maintain formatting fidelity
    return node.lines.slice();
}

