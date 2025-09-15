import type {BaseTreeNode} from "./BaseTreeNode.js";
import type {ListItemNode} from "./ListItemNode.js";

export interface ListNode extends BaseTreeNode {
    type: 'List';
    items: ListItemNode[];
}
