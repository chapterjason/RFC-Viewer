import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface ListItemNode {
    marker: string;
    lines: string[];
    contentIndent: number;
    markerIndent: number;
}

export interface ListNode extends BaseTreeNode {
    type: 'List';
    items: ListItemNode[];
}
