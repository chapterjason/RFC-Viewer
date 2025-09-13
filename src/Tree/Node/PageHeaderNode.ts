import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface PageHeaderNode extends BaseTreeNode {
    type: 'PageHeader';
    text: string;
}

