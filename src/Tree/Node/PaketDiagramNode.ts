import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface PaketDiagramNode extends BaseTreeNode {
    type: "PaketDiagram";
    indent: number;
    lines: string[];
}

