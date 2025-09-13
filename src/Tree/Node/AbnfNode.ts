import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface AbnfNode extends BaseTreeNode {
    type: "Abnf";
    lines: string[];
}

