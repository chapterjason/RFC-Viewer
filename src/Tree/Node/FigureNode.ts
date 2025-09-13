import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface FigureNode extends BaseTreeNode {
    type: "Figure";
    // Full chunk including diagram lines, any internal blank lines,
    // optional note lines, and the caption line when present.
    lines: string[];
}

