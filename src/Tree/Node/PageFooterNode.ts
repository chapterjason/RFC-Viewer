import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface PageFooterNode extends BaseTreeNode {
    type: 'PageFooter';
    text: string;
}

