import type {BaseTreeNode} from "./BaseTreeNode.js";
import type {BlankLineNode} from "./BlankLineNode.js";
import type {ListItemNode} from "./ListItemNode.js";
import type {PageBreakNode} from "./PageBreakNode.js";
import type {PageFooterNode} from "./PageFooterNode.js";
import type {PageHeaderNode} from "./PageHeaderNode.js";

export type ListItemsType =
    ListItemNode
    | BlankLineNode
    | PageFooterNode
    | PageHeaderNode
    | PageBreakNode;

export interface ListNode extends BaseTreeNode {
    type: 'List';
    items: ListItemsType[];
}
