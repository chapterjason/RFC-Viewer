import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface IndentedBlockNode extends BaseTreeNode {
    type: "IndentedBlock";
    indent: number;
    lines: string[]
}