import type {BaseTreeNode} from "./BaseTreeNode.js";
import type {BlankLineNode} from "./BlankLineNode.js";
import type {ListNode} from "./ListNode.js";
import type {PageBreakNode} from "./PageBreakNode.js";
import type {PageFooterNode} from "./PageFooterNode.js";
import type {PageHeaderNode} from "./PageHeaderNode.js";
import type {ParagraphNode} from "./ParagraphNode.js";

export type ListItemChildrenType =
    ParagraphNode
    | ListNode
    | PageFooterNode
    | PageBreakNode
    | PageHeaderNode
    | BlankLineNode;

export interface ListItemNode extends BaseTreeNode {
    type: 'ListItem';
    marker: string;
    children: ListItemChildrenType[];
    contentIndent: number;
    markerIndent: number;
    markerOnly?: boolean;
    inline?: boolean;
}
